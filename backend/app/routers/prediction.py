import numpy as np
import pandas as pd
import joblib
import json
import yfinance as yf
import shap
import tensorflow as tf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from functools import lru_cache

from app import config
from app.feature_engineering import engineer_features, get_latest_feature_row

router = APIRouter(prefix="/prediction", tags=["Prediction"])


# ------------------------------------------------------------------
# Model loading -- cached so files are read from disk only once
# ------------------------------------------------------------------

@lru_cache(maxsize=1)
def load_tree_models():
    rf = joblib.load(config.MODEL_FILES["random_forest"])
    xgb = joblib.load(config.MODEL_FILES["xgboost"])
    lgbm = joblib.load(config.MODEL_FILES["lightgbm"])
    return rf, xgb, lgbm


@lru_cache(maxsize=1)
def load_lstm():
    model = tf.keras.models.load_model(config.MODEL_FILES["lstm"])
    feature_scaler = joblib.load(config.MODELS_DIR / "lstm_feature_scaler.pkl")
    target_scaler = joblib.load(config.MODELS_DIR / "lstm_target_scaler.pkl")
    with open(config.MODELS_DIR / "lstm_config.json") as f:
        lstm_cfg = json.load(f)
    return model, feature_scaler, target_scaler, lstm_cfg


@lru_cache(maxsize=1)
def load_ensemble_config():
    with open(config.MODELS_DIR / "ensemble_config.json") as f:
        return json.load(f)


def get_lstm_signal(full_engineered, model, feature_scaler, target_scaler, lstm_cfg):
    lookback = lstm_cfg["lookback"]
    feature_cols = lstm_cfg["features"]

    clean = full_engineered.dropna(subset=feature_cols).reset_index(drop=True)
    if len(clean) < lookback:
        return None, None

    recent_window = clean[feature_cols].tail(lookback)
    scaled_window = feature_scaler.transform(recent_window)
    sequence = np.expand_dims(scaled_window, axis=0)

    predicted_scaled = model.predict(sequence, verbose=0)
    predicted_close = target_scaler.inverse_transform(predicted_scaled)[0, 0]

    last_close = clean["Close"].iloc[-1]
    predicted_return = (predicted_close - last_close) / last_close
    signal = 1 if predicted_return > 0 else 0
    return float(predicted_return), signal


# ------------------------------------------------------------------
# Response schema
# ------------------------------------------------------------------

class ModelSignal(BaseModel):
    model: str
    probability_up: float | None = None
    predicted_return: float | None = None
    weight: float


class PredictionResponse(BaseModel):
    ticker: str
    as_of_date: str
    ensemble_probability_up: float
    signal: str
    individual_models: list[ModelSignal]
    top_shap_factors: list[dict]


# ------------------------------------------------------------------
# Endpoint
# ------------------------------------------------------------------

@router.get("/{ticker}", response_model=PredictionResponse)
def predict(ticker: str):
    if ticker != config.PRIMARY_TICKER:
        raise HTTPException(
            status_code=400,
            detail=f"Only {config.PRIMARY_TICKER} is supported by the trained models currently.",
        )

    raw_data = yf.download(ticker, period="400d", auto_adjust=False)
    if isinstance(raw_data.columns, pd.MultiIndex):
        raw_data.columns = raw_data.columns.get_level_values(0)
    raw_data = raw_data.reset_index()
    raw_data.columns.name = None

    try:
        latest_row = get_latest_feature_row(raw_data, config.FEATURE_COLUMNS)
        full_engineered = engineer_features(raw_data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    X_live = latest_row[config.FEATURE_COLUMNS]

    rf_model, xgb_model, lgbm_model = load_tree_models()
    lstm_model, feature_scaler, target_scaler, lstm_cfg = load_lstm()
    ensemble_cfg = load_ensemble_config()
    weights = ensemble_cfg["model_weights"]

    rf_prob = float(rf_model.predict_proba(X_live)[0, 1])
    xgb_prob = float(xgb_model.predict_proba(X_live)[0, 1])
    lgbm_prob = float(lgbm_model.predict_proba(X_live)[0, 1])

    lstm_return, lstm_signal = get_lstm_signal(
        full_engineered, lstm_model, feature_scaler, target_scaler, lstm_cfg
    )
    lstm_component = lstm_signal if lstm_signal is not None else 0.5

    weighted_prob = (
        weights["RF"] * rf_prob
        + weights["XGB"] * xgb_prob
        + weights["LGBM"] * lgbm_prob
        + weights["LSTM"] * lstm_component
    )

    signal = "BUY" if weighted_prob >= 0.55 else ("SELL" if weighted_prob <= 0.45 else "HOLD")

    individual_models = [
        ModelSignal(model="Random Forest", probability_up=rf_prob, weight=weights["RF"]),
        ModelSignal(model="XGBoost", probability_up=xgb_prob, weight=weights["XGB"]),
        ModelSignal(model="LightGBM", probability_up=lgbm_prob, weight=weights["LGBM"]),
        ModelSignal(model="LSTM", predicted_return=lstm_return, weight=weights["LSTM"]),
    ]

    explainer = shap.TreeExplainer(lgbm_model)
    explanation = explainer(X_live)
    shap_values = explanation.values[0]

    contrib = pd.DataFrame({
        "feature": config.FEATURE_COLUMNS,
        "value": X_live.values[0],
        "shap_value": shap_values,
    })
    contrib["direction"] = np.where(contrib["shap_value"] > 0, "pushes UP", "pushes DOWN")
    contrib["abs_shap"] = contrib["shap_value"].abs()
    contrib = contrib.sort_values("abs_shap", ascending=False).head(5)

    top_shap_factors = [
        {
            "feature": row["feature"],
            "value": round(float(row["value"]), 4),
            "shap_value": round(float(row["shap_value"]), 4),
            "direction": row["direction"],
        }
        for _, row in contrib.iterrows()
    ]

    return PredictionResponse(
        ticker=ticker,
        as_of_date=str(latest_row["Date"].values[0])[:10],
        ensemble_probability_up=round(weighted_prob, 4),
        signal=signal,
        individual_models=individual_models,
        top_shap_factors=top_shap_factors,
    )