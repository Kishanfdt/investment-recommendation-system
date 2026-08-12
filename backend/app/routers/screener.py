import pandas as pd
import numpy as np
import joblib
import yfinance as yf
from functools import lru_cache
from fastapi import APIRouter
from pydantic import BaseModel

from app import config
from app.pooled_feature_engineering import get_latest_pooled_row, POOLED_FEATURE_COLUMNS

router = APIRouter(prefix="/screener", tags=["NIFTY 50 Screener"])

NIFTY50_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
    "LT.NS", "AXISBANK.NS", "BAJFINANCE.NS", "ASIANPAINT.NS", "MARUTI.NS",
    "TITAN.NS", "SUNPHARMA.NS", "ULTRACEMCO.NS", "NESTLEIND.NS", "WIPRO.NS",
    "ONGC.NS", "NTPC.NS", "ADANIENT.NS", "POWERGRID.NS", "M&M.NS",
    "TATASTEEL.NS", "JSWSTEEL.NS", "COALINDIA.NS", "BAJAJFINSV.NS",
    "HCLTECH.NS", "TECHM.NS", "INDUSINDBK.NS", "GRASIM.NS", "DRREDDY.NS",
    "CIPLA.NS", "EICHERMOT.NS", "BRITANNIA.NS", "APOLLOHOSP.NS", "DIVISLAB.NS",
    "HEROMOTOCO.NS", "BPCL.NS", "HINDALCO.NS", "SBILIFE.NS", "HDFCLIFE.NS",
    "UPL.NS", "BAJAJ-AUTO.NS", "ADANIPORTS.NS", "TATACONSUM.NS", "SHRIRAMFIN.NS",
]  # TATAMOTORS.NS excluded -- delisted/demerged, see Module 13 notes


@lru_cache(maxsize=1)
def load_pooled_models():
    rf = joblib.load(config.MODELS_DIR / "pooled_random_forest.pkl")
    xgb = joblib.load(config.MODELS_DIR / "pooled_xgboost.pkl")
    lgbm = joblib.load(config.MODELS_DIR / "pooled_lightgbm.pkl")
    return rf, xgb, lgbm


class ScreenerResult(BaseModel):
    ticker: str
    probability_up: float | None = None
    signal: str
    error: str | None = None


@router.get("/nifty50", response_model=list[ScreenerResult])
def screen_nifty50(top_n: int = 50):
    rf_model, xgb_model, lgbm_model = load_pooled_models()
    results = []

    for ticker in NIFTY50_TICKERS:
        try:
            raw_data = yf.download(ticker, period="150d", auto_adjust=False, progress=False)
            if isinstance(raw_data.columns, pd.MultiIndex):
                raw_data.columns = raw_data.columns.get_level_values(0)
            raw_data = raw_data.reset_index()
            raw_data.columns.name = None

            latest_row = get_latest_pooled_row(raw_data, ticker)
            X_live = latest_row[POOLED_FEATURE_COLUMNS]

            rf_prob = rf_model.predict_proba(X_live)[0, 1]
            xgb_prob = xgb_model.predict_proba(X_live)[0, 1]
            lgbm_prob = lgbm_model.predict_proba(X_live)[0, 1]

            # Equal-weight average across the 3 pooled models -- simpler than the
            # TCS ensemble since these were trained together as one system, not
            # separately walk-forward-validated per model (see Module 14 notes)
            avg_prob = float(np.mean([rf_prob, xgb_prob, lgbm_prob]))
            signal = "BUY" if avg_prob >= 0.55 else ("SELL" if avg_prob <= 0.45 else "HOLD")

            results.append(ScreenerResult(ticker=ticker, probability_up=round(avg_prob, 4), signal=signal))

        except Exception as e:
            results.append(ScreenerResult(ticker=ticker, signal="ERROR", error=str(e)))

    successful = [r for r in results if r.probability_up is not None]
    failed = [r for r in results if r.probability_up is None]
    successful.sort(key=lambda r: r.probability_up, reverse=True)

    return (successful + failed)[:top_n]