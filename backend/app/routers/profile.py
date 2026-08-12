from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Literal

from app.services.risk_scoring import compute_risk_score
from app.services.supabase_client import supabase

router = APIRouter(prefix="/profile", tags=["Investor Profile"])


class OnboardingRequest(BaseModel):
    full_name: str
    email: EmailStr
    age: int
    annual_income_range: Literal["<5L", "5-10L", "10-25L", "25L+"]
    investment_horizon_years: int
    investment_goal: Literal["wealth_growth", "retirement", "short_term_gains", "capital_preservation"]
    existing_investment_experience: Literal["none", "beginner", "intermediate", "experienced"]

    # Risk questionnaire answers
    q1_reaction_to_20pct_drop: int   # 1-5
    q2_investment_priority: int      # 1-5
    q4_income_stability: int         # 1-5
    q5_loss_tolerance_pct: int       # 0-30+


class RiskProfileResponse(BaseModel):
    profile_id: str
    risk_score: float
    risk_category: str
    max_equity_allocation_pct: float
    recommended_rebalance_frequency: str


@router.post("/onboard", response_model=RiskProfileResponse)
def onboard_investor(payload: OnboardingRequest):
    # 1. Insert the base investor profile
    profile_insert = supabase.table("investor_profiles").insert({
        "full_name": payload.full_name,
        "email": payload.email,
        "age": payload.age,
        "annual_income_range": payload.annual_income_range,
        "investment_horizon_years": payload.investment_horizon_years,
        "investment_goal": payload.investment_goal,
        "existing_investment_experience": payload.existing_investment_experience,
    }).execute()

    if not profile_insert.data:
        raise HTTPException(status_code=500, detail="Failed to create investor profile")

    profile_id = profile_insert.data[0]["id"]

    # 2. Compute the risk score from the questionnaire
    q3_time_horizon_score = None  # computed inside compute_risk_score from horizon_years
    risk_result = compute_risk_score(
        q1_reaction_to_20pct_drop=payload.q1_reaction_to_20pct_drop,
        q2_investment_priority=payload.q2_investment_priority,
        investment_horizon_years=payload.investment_horizon_years,
        q4_income_stability=payload.q4_income_stability,
        q5_loss_tolerance_pct=payload.q5_loss_tolerance_pct,
    )

    # 3. Store the raw questionnaire responses (auditability / future re-scoring)
    from app.services.risk_scoring import score_time_horizon
    supabase.table("risk_questionnaire_responses").insert({
        "profile_id": profile_id,
        "q1_reaction_to_20pct_drop": payload.q1_reaction_to_20pct_drop,
        "q2_investment_priority": payload.q2_investment_priority,
        "q3_time_horizon_score": score_time_horizon(payload.investment_horizon_years),
        "q4_income_stability": payload.q4_income_stability,
        "q5_loss_tolerance_pct": payload.q5_loss_tolerance_pct,
    }).execute()

    # 4. Store the computed risk profile -- this is what the recommendation engine reads
    risk_insert = supabase.table("risk_profiles").insert({
        "profile_id": profile_id,
        **risk_result,
    }).execute()

    if not risk_insert.data:
        raise HTTPException(status_code=500, detail="Failed to store risk profile")

    return RiskProfileResponse(profile_id=profile_id, **risk_result)


@router.get("/{profile_id}/risk", response_model=RiskProfileResponse)
def get_risk_profile(profile_id: str):
    result = supabase.table("risk_profiles").select("*").eq("profile_id", profile_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Risk profile not found")

    row = result.data[0]
    return RiskProfileResponse(
        profile_id=profile_id,
        risk_score=row["risk_score"],
        risk_category=row["risk_category"],
        max_equity_allocation_pct=row["max_equity_allocation_pct"],
        recommended_rebalance_frequency=row["recommended_rebalance_frequency"],
    )