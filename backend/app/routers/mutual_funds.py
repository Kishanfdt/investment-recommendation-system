import pandas as pd
from functools import lru_cache
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import config
from app.services.supabase_client import supabase

router = APIRouter(prefix="/mutual-funds", tags=["Mutual Funds"])


@lru_cache(maxsize=1)
def load_funds():
    path = config.MODELS_DIR / "mutual_funds_ranked.csv"
    df = pd.read_csv(path)
    return df


class FundRecommendation(BaseModel):
    scheme_name: str
    fund_type: str
    risk_tier: str
    amc: str
    return_1y: float | None
    return_3y: float | None
    volatility: float | None


class FundRecommendationResponse(BaseModel):
    risk_category: str
    matched_risk_tier: str
    recommendations: list[FundRecommendation]


# Maps the investor risk categories from risk_scoring.py to fund risk tiers
RISK_CATEGORY_TO_FUND_TIER = {
    "conservative": "conservative",
    "moderate": "moderate",
    "aggressive": "aggressive",
}


@router.get("/recommendations/{profile_id}", response_model=FundRecommendationResponse)
def get_fund_recommendations(profile_id: str, top_n: int = 10):
    # Pull the investor's actual computed risk profile from Supabase --
    # this is the personalization link: real profile data driving real output
    result = supabase.table("risk_profiles").select("*").eq("profile_id", profile_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Risk profile not found for this investor")

    risk_category = result.data[0]["risk_category"]
    matched_tier = RISK_CATEGORY_TO_FUND_TIER.get(risk_category, "moderate")

    funds = load_funds()
    matched = funds[funds["risk_tier"] == matched_tier].copy()

    # Rank by risk-adjusted return: 3Y CAGR divided by volatility (a simple
    # Sharpe-like proxy). Volatility is floored at 2.0 so near-zero-volatility
    # funds (e.g. liquid/debt) don't mathematically dominate every ranking --
    # without this floor, a 7% return / 0.2% volatility fund scores far above
    # a genuinely well-performing moderate-risk equity/hybrid fund.
    matched = matched.dropna(subset=["return_3y", "volatility"])
    matched = matched[matched["volatility"] > 0]
    matched["risk_adjusted_score"] = matched["return_3y"] / matched["volatility"].clip(lower=2.0)
    matched = matched.sort_values("risk_adjusted_score", ascending=False).head(top_n)

    recommendations = [
        FundRecommendation(
            scheme_name=row["scheme_name"],
            fund_type=row["fund_type"],
            risk_tier=row["risk_tier"],
            amc=row["amc"],
            return_1y=row["return_1y"] if pd.notna(row["return_1y"]) else None,
            return_3y=row["return_3y"] if pd.notna(row["return_3y"]) else None,
            volatility=row["volatility"] if pd.notna(row["volatility"]) else None,
        )
        for _, row in matched.iterrows()
    ]

    return FundRecommendationResponse(
        risk_category=risk_category,
        matched_risk_tier=matched_tier,
        recommendations=recommendations,
    )