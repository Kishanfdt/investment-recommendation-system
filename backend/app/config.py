"""
Backend configuration. Mirrors the Colab project's config.py values
(feature list, model filenames) but with local filesystem paths instead
of Google Drive paths, since this runs outside Colab.
"""

from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
MODELS_DIR = APP_DIR / "models"

PRIMARY_TICKER = "TCS.NS"

PORTFOLIO_TICKERS = [
    "RELIANCE.NS",
    "TCS.NS",
    "HDFCBANK.NS",
    "INFY.NS",
]

# Must exactly match the feature list used during training in Colab --
# do not edit this independently of the Colab project's src/config.py.
FEATURE_COLUMNS = [
    "Open",
    "High",
    "Low",
    "Close",
    "Volume",
    "MA20",
    "MA50",
    "Return",
    "Volatility",
    "RSI",
    "MACD",
    "MACD_Signal",
    "MACD_Histogram",
    "Volume_Change",
]

TARGET_COLUMN = "Target"

MODEL_FILES = {
    "random_forest": MODELS_DIR / "random_forest_classifier.pkl",
    "xgboost": MODELS_DIR / "xgboost_classifier.pkl",
    "lightgbm": MODELS_DIR / "lightgbm_classifier.pkl",
    "lstm": MODELS_DIR / "tcs_lstm_model.keras",
}