from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Literal, Optional

from app.services.risk_scoring import compute_risk_score, score_time_horizon
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

    # Auth linkage — optional so Phase 1 unauthenticated calls still work
    user_id: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    """All fields optional — only provided fields are updated."""
    age: Optional[int] = None
    annual_income_range: Optional[Literal["<5L", "5-10L", "10-25L", "25L+"]] = None
    investment_horizon_years: Optional[int] = None
    investment_goal: Optional[Literal["wealth_growth", "retirement", "short_term_gains", "capital_preservation"]] = None
    existing_investment_experience: Optional[Literal["none", "beginner", "intermediate", "experienced"]] = None
    q1_reaction_to_20pct_drop: Optional[int] = None
    q2_investment_priority: Optional[int] = None
    q4_income_stability: Optional[int] = None
    q5_loss_tolerance_pct: Optional[int] = None


class RiskProfileResponse(BaseModel):
    profile_id: str
    risk_score: float
    risk_category: str
    max_equity_allocation_pct: float
    recommended_rebalance_frequency: str


class UserProfileResponse(BaseModel):
    profile_id: str
    full_name: str
    email: str
    risk_score: float
    risk_category: str
    max_equity_allocation_pct: float
    recommended_rebalance_frequency: str


@router.post("/onboard", response_model=RiskProfileResponse)
def onboard_investor(payload: OnboardingRequest):
    # 1. Insert the base investor profile
    insert_data = {
        "full_name": payload.full_name,
        "email": payload.email,
        "age": payload.age,
        "annual_income_range": payload.annual_income_range,
        "investment_horizon_years": payload.investment_horizon_years,
        "investment_goal": payload.investment_goal,
        "existing_investment_experience": payload.existing_investment_experience,
    }
    if payload.user_id:
        insert_data["user_id"] = payload.user_id

    profile_insert = supabase.table("investor_profiles").insert(insert_data).execute()

    if not profile_insert.data:
        raise HTTPException(status_code=500, detail="Failed to create investor profile")

    profile_id = profile_insert.data[0]["id"]

    # 2. Compute the risk score from the questionnaire
    risk_result = compute_risk_score(
        q1_reaction_to_20pct_drop=payload.q1_reaction_to_20pct_drop,
        q2_investment_priority=payload.q2_investment_priority,
        investment_horizon_years=payload.investment_horizon_years,
        q4_income_stability=payload.q4_income_stability,
        q5_loss_tolerance_pct=payload.q5_loss_tolerance_pct,
    )

    # 3. Store the raw questionnaire responses (auditability / future re-scoring)
    supabase.table("risk_questionnaire_responses").insert({
        "profile_id": profile_id,
        "q1_reaction_to_20pct_drop": payload.q1_reaction_to_20pct_drop,
        "q2_investment_priority": payload.q2_investment_priority,
        "q3_time_horizon_score": score_time_horizon(payload.investment_horizon_years),
        "q4_income_stability": payload.q4_income_stability,
        "q5_loss_tolerance_pct": payload.q5_loss_tolerance_pct,
    }).execute()

    # 4. Store the computed risk profile
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


@router.get("/by-user/{user_id}", response_model=UserProfileResponse)
def get_profile_by_user(user_id: str):
    """
    Look up an investor profile by Supabase auth user_id.
    Used post-login to resolve profile_id and decide whether onboarding is needed.
    """
    profile_result = (
        supabase.table("investor_profiles")
        .select("id, full_name, email")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="No profile found for this user")

    profile_row = profile_result.data[0]
    profile_id = profile_row["id"]

    risk_result = supabase.table("risk_profiles").select("*").eq("profile_id", profile_id).execute()
    if not risk_result.data:
        raise HTTPException(status_code=404, detail="Risk profile not found for this user")

    risk_row = risk_result.data[0]
    return UserProfileResponse(
        profile_id=profile_id,
        full_name=profile_row["full_name"],
        email=profile_row["email"],
        risk_score=risk_row["risk_score"],
        risk_category=risk_row["risk_category"],
        max_equity_allocation_pct=risk_row["max_equity_allocation_pct"],
        recommended_rebalance_frequency=risk_row["recommended_rebalance_frequency"],
    )


@router.get("/{profile_id}/questionnaire")
def get_questionnaire(profile_id: str):
    """
    Return the raw questionnaire answers for a profile so the Settings page
    can pre-populate the edit form.
    """
    # Fetch investor_profiles for non-questionnaire fields
    profile_result = (
        supabase.table("investor_profiles")
        .select("age, annual_income_range, investment_horizon_years, investment_goal, existing_investment_experience")
        .eq("id", profile_id)
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Investor profile not found")

    # Fetch raw questionnaire responses
    q_result = (
        supabase.table("risk_questionnaire_responses")
        .select("q1_reaction_to_20pct_drop, q2_investment_priority, q4_income_stability, q5_loss_tolerance_pct")
        .eq("profile_id", profile_id)
        .limit(1)
        .execute()
    )
    if not q_result.data:
        raise HTTPException(status_code=404, detail="Questionnaire responses not found")

    return {**profile_result.data[0], **q_result.data[0]}


@router.put("/{profile_id}/update", response_model=RiskProfileResponse)
def update_profile(profile_id: str, payload: UpdateProfileRequest):
    """
    Update investor profile + questionnaire responses, recompute risk score,
    and upsert risk_profiles. Only provided fields are changed.
    """
    # Verify the profile exists
    existing_profile = (
        supabase.table("investor_profiles")
        .select("age, annual_income_range, investment_horizon_years, investment_goal, existing_investment_experience")
        .eq("id", profile_id)
        .execute()
    )
    if not existing_profile.data:
        raise HTTPException(status_code=404, detail="Investor profile not found")

    existing_q = (
        supabase.table("risk_questionnaire_responses")
        .select("q1_reaction_to_20pct_drop, q2_investment_priority, q4_income_stability, q5_loss_tolerance_pct")
        .eq("profile_id", profile_id)
        .limit(1)
        .execute()
    )

    p = existing_profile.data[0]
    q = existing_q.data[0] if existing_q.data else {}

    # Merge: use payload value if provided, otherwise keep existing
    updated_age = payload.age if payload.age is not None else p.get("age", 25)
    updated_income = payload.annual_income_range or p.get("annual_income_range", "5-10L")
    updated_horizon = payload.investment_horizon_years if payload.investment_horizon_years is not None else p.get("investment_horizon_years", 5)
    updated_goal = payload.investment_goal or p.get("investment_goal", "wealth_growth")
    updated_experience = payload.existing_investment_experience or p.get("existing_investment_experience", "beginner")
    updated_q1 = payload.q1_reaction_to_20pct_drop if payload.q1_reaction_to_20pct_drop is not None else q.get("q1_reaction_to_20pct_drop", 3)
    updated_q2 = payload.q2_investment_priority if payload.q2_investment_priority is not None else q.get("q2_investment_priority", 3)
    updated_q4 = payload.q4_income_stability if payload.q4_income_stability is not None else q.get("q4_income_stability", 3)
    updated_q5 = payload.q5_loss_tolerance_pct if payload.q5_loss_tolerance_pct is not None else q.get("q5_loss_tolerance_pct", 10)

    # Update investor_profiles
    supabase.table("investor_profiles").update({
        "age": updated_age,
        "annual_income_range": updated_income,
        "investment_horizon_years": updated_horizon,
        "investment_goal": updated_goal,
        "existing_investment_experience": updated_experience,
    }).eq("id", profile_id).execute()

    # Update questionnaire responses
    if existing_q.data:
        supabase.table("risk_questionnaire_responses").update({
            "q1_reaction_to_20pct_drop": updated_q1,
            "q2_investment_priority": updated_q2,
            "q3_time_horizon_score": score_time_horizon(updated_horizon),
            "q4_income_stability": updated_q4,
            "q5_loss_tolerance_pct": updated_q5,
        }).eq("profile_id", profile_id).execute()
    else:
        supabase.table("risk_questionnaire_responses").insert({
            "profile_id": profile_id,
            "q1_reaction_to_20pct_drop": updated_q1,
            "q2_investment_priority": updated_q2,
            "q3_time_horizon_score": score_time_horizon(updated_horizon),
            "q4_income_stability": updated_q4,
            "q5_loss_tolerance_pct": updated_q5,
        }).execute()

    # Recompute risk score
    risk_result = compute_risk_score(
        q1_reaction_to_20pct_drop=updated_q1,
        q2_investment_priority=updated_q2,
        investment_horizon_years=updated_horizon,
        q4_income_stability=updated_q4,
        q5_loss_tolerance_pct=updated_q5,
    )

    # Upsert risk_profiles
    supabase.table("risk_profiles").update({
        **risk_result,
    }).eq("profile_id", profile_id).execute()

    return RiskProfileResponse(profile_id=profile_id, **risk_result)