import pandas as pd
from functools import lru_cache
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import config
from app.services.supabase_client import supabase

router = APIRouter(prefix="/portfolio", tags=["Portfolio Optimization"])

# Maps investor risk category -> which MPT strategy they see.
# Conservative investors get the Minimum Volatility portfolio (lowest risk),
# aggressive investors get Maximum Sharpe (highest risk-adjusted return,
# which in this dataset concentrates heavily -- see Module 10 notes),
# moderate investors get Equal Weight as a balanced middle ground.
RISK_CATEGORY_TO_STRATEGY = {
    "conservative": "Minimum_Volatility",
    "moderate": "Equal_Weight",
    "aggressive": "Maximum_Sharpe",
}

STRATEGY_DISPLAY_NAMES = {
    "Minimum_Volatility": "Minimum Volatility",
    "Equal_Weight": "Equal Weight",
    "Maximum_Sharpe": "Maximum Sharpe",
}


@lru_cache(maxsize=1)
def load_portfolio_data():
    weights = pd.read_csv(config.MODELS_DIR / "optimal_portfolio_weights.csv")
    comparison = pd.read_csv(config.MODELS_DIR / "portfolio_comparison.csv")
    stats = pd.read_csv(config.MODELS_DIR / "asset_statistics.csv", index_col=0)
    return weights, comparison, stats


class AssetWeight(BaseModel):
    asset: str
    weight: float


class PortfolioResponse(BaseModel):
    risk_category: str
    strategy: str
    expected_return: float
    volatility: float
    sharpe_ratio: float
    weights: list[AssetWeight]


@router.get("/recommendation/{profile_id}", response_model=PortfolioResponse)
def get_portfolio_recommendation(profile_id: str):
    result = supabase.table("risk_profiles").select("*").eq("profile_id", profile_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Risk profile not found for this investor")

    risk_category = result.data[0]["risk_category"]
    strategy_col = RISK_CATEGORY_TO_STRATEGY.get(risk_category, "Equal_Weight")

    weights_df, comparison_df, stats_df = load_portfolio_data()

    if strategy_col not in weights_df.columns:
        raise HTTPException(status_code=500, detail=f"Strategy column '{strategy_col}' not found in portfolio data")

    weights = [
        AssetWeight(asset=row["Asset"], weight=round(float(row[strategy_col]), 4))
        for _, row in weights_df.iterrows()
    ]

    strategy_display = STRATEGY_DISPLAY_NAMES[strategy_col]
    comparison_row = comparison_df[comparison_df["Portfolio"] == strategy_display]

    if comparison_row.empty:
        raise HTTPException(status_code=500, detail=f"Strategy '{strategy_display}' not found in comparison data")

    row = comparison_row.iloc[0]

    return PortfolioResponse(
        risk_category=risk_category,
        strategy=strategy_display,
        expected_return=round(float(row["Return"]), 4),
        volatility=round(float(row["Volatility"]), 4),
        sharpe_ratio=round(float(row["Sharpe_Ratio"]), 4),
        weights=weights,
    )


@router.get("/all-strategies")
def get_all_strategies():
    """Returns all 3 MPT strategies for comparison, regardless of risk profile."""
    weights_df, comparison_df, stats_df = load_portfolio_data()
    return {
        "comparison": comparison_df.to_dict(orient="records"),
        "weights": weights_df.to_dict(orient="records"),
        "asset_statistics": stats_df.reset_index().to_dict(orient="records"),
    }