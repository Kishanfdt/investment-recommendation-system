"""
Risk scoring logic for investor profiling.
Converts questionnaire answers into a 0-100 risk score, a risk category,
and constraints that the recommendation engine (Modules 9-11) must respect.
"""

from typing import Literal

RiskCategory = Literal["conservative", "moderate", "aggressive"]


def score_time_horizon(years: int) -> int:
    """Longer horizon -> higher risk tolerance score (1-5)."""
    if years < 1:
        return 1
    elif years < 3:
        return 2
    elif years < 5:
        return 3
    elif years < 10:
        return 4
    return 5


def compute_risk_score(
    q1_reaction_to_20pct_drop: int,   # 1 (sell everything) - 5 (buy more)
    q2_investment_priority: int,       # 1 (safety) - 5 (max growth)
    investment_horizon_years: int,
    q4_income_stability: int,          # 1 (unstable) - 5 (very stable)
    q5_loss_tolerance_pct: int,        # 0, 5, 10, 20, or 30+
) -> dict:
    """
    Composite 0-100 risk score from five weighted inputs.
    Weights reflect standard investor-profiling practice: reaction to loss
    and stated loss tolerance carry the most weight, since they're the
    most direct measures of actual risk tolerance (not just stated goals).
    """
    q3_time_horizon_score = score_time_horizon(investment_horizon_years)

    # Normalize loss tolerance (0-30+) onto a 1-5 scale
    loss_tolerance_score = min(5, max(1, round(q5_loss_tolerance_pct / 6) + 1))

    weighted_score = (
        q1_reaction_to_20pct_drop * 0.30
        + q2_investment_priority * 0.20
        + q3_time_horizon_score * 0.15
        + q4_income_stability * 0.15
        + loss_tolerance_score * 0.20
    )

    # weighted_score ranges 1-5; rescale to 0-100
    risk_score = round(((weighted_score - 1) / 4) * 100, 2)

    if risk_score < 35:
        category: RiskCategory = "conservative"
        max_equity_allocation_pct = 30.0
        rebalance_frequency = "quarterly"
    elif risk_score < 65:
        category = "moderate"
        max_equity_allocation_pct = 60.0
        rebalance_frequency = "semi_annual"
    else:
        category = "aggressive"
        max_equity_allocation_pct = 90.0
        rebalance_frequency = "annual"

    return {
        "risk_score": risk_score,
        "risk_category": category,
        "max_equity_allocation_pct": max_equity_allocation_pct,
        "recommended_rebalance_frequency": rebalance_frequency,
    }