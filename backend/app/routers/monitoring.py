import pandas as pd
import yfinance as yf
from fastapi import APIRouter
from datetime import date

from app.services.supabase_client import supabase

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


@router.post("/resolve")
def resolve_predictions():
    """
    Checks all unresolved predictions whose target date has passed,
    fetches the actual close price, and records whether the prediction
    was correct. Meant to be called periodically (e.g. once a day).
    """
    unresolved = (
        supabase.table("prediction_logs")
        .select("*")
        .eq("resolved", False)
        .lte("prediction_date", str(date.today()))
        .execute()
    )

    if not unresolved.data:
        return {"resolved_count": 0, "message": "No predictions ready to resolve."}

    resolved_count = 0
    errors = []

    tickers = list({row["ticker"] for row in unresolved.data})

    for ticker in tickers:
        try:
            hist = yf.download(ticker, period="10d", auto_adjust=False, progress=False)
            if isinstance(hist.columns, pd.MultiIndex):
                hist.columns = hist.columns.get_level_values(0)
            hist = hist.reset_index()
            hist.columns.name = None
            hist["Date"] = pd.to_datetime(hist["Date"]).dt.date

            ticker_rows = [r for r in unresolved.data if r["ticker"] == ticker]

            for row in ticker_rows:
                target_date = pd.to_datetime(row["prediction_date"]).date()
                match = hist[hist["Date"] == target_date]

                if match.empty:
                    continue  # market may not have opened yet for this date, try again later

                actual_close = float(match["Close"].values[0])
                previous_close = row["previous_close"]
                actual_direction = 1 if actual_close > previous_close else 0
                correct = actual_direction == row["predicted_direction"]

                supabase.table("prediction_logs").update({
                    "actual_close": round(actual_close, 4),
                    "actual_direction": actual_direction,
                    "correct": correct,
                    "resolved": True,
                }).eq("id", row["id"]).execute()

                resolved_count += 1

        except Exception as e:
            errors.append(f"{ticker}: {str(e)}")

    return {"resolved_count": resolved_count, "errors": errors}


@router.get("/stats")
def get_monitoring_stats(ticker: str = "TCS.NS", lookback_days: int = 30):
    """Rolling accuracy stats for a given ticker's logged predictions."""
    result = (
        supabase.table("prediction_logs")
        .select("*")
        .eq("ticker", ticker)
        .eq("resolved", True)
        .order("prediction_date", desc=False)
        .execute()
    )

    if not result.data:
        return {
            "ticker": ticker,
            "total_resolved": 0,
            "overall_accuracy": None,
            "recent_accuracy": None,
            "history": [],
        }

    df = pd.DataFrame(result.data)
    df["prediction_date"] = pd.to_datetime(df["prediction_date"])
    df = df.sort_values("prediction_date")

    overall_accuracy = float(df["correct"].mean())

    recent = df.tail(lookback_days)
    recent_accuracy = float(recent["correct"].mean()) if len(recent) > 0 else None

    history = [
        {
            "date": str(row["prediction_date"].date()),
            "signal": row["signal"],
            "predicted_direction": row["predicted_direction"],
            "actual_direction": row["actual_direction"],
            "correct": row["correct"],
            "ensemble_probability_up": row["ensemble_probability_up"],
        }
        for _, row in df.iterrows()
    ]

    return {
        "ticker": ticker,
        "total_resolved": len(df),
        "overall_accuracy": round(overall_accuracy, 4),
        "recent_accuracy": round(recent_accuracy, 4) if recent_accuracy is not None else None,
        "recent_window_days": lookback_days,
        "history": history,
    }