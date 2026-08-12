
"""
Feature engineering logic, extracted from 03_Feature_Engineering.ipynb.
Used identically by training notebooks AND the live Streamlit app,
so there is no train/serve skew.
"""

import numpy as np
import pandas as pd


def engineer_features(data: pd.DataFrame) -> pd.DataFrame:
    """
    Takes raw OHLCV data (columns: Date, Open, High, Low, Close, Volume)
    and returns the same 14 engineered features used throughout the project.
    """
    df = data.copy()
    df = df.sort_values("Date").drop_duplicates().reset_index(drop=True)

    numeric_cols = ["Open", "High", "Low", "Close", "Volume"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=["Close"]).reset_index(drop=True)

    df["MA20"] = df["Close"].rolling(window=20).mean()
    df["MA50"] = df["Close"].rolling(window=50).mean()
    df["Return"] = df["Close"].pct_change()
    df["Volatility"] = df["Return"].rolling(window=20).std()

    delta = df["Close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    df["RSI"] = 100 - (100 / (1 + rs))
    df["RSI"] = df["RSI"].fillna(100)

    df["EMA12"] = df["Close"].ewm(span=12, adjust=False).mean()
    df["EMA26"] = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"] = df["EMA12"] - df["EMA26"]
    df["MACD_Signal"] = df["MACD"].ewm(span=9, adjust=False).mean()
    df["MACD_Histogram"] = df["MACD"] - df["MACD_Signal"]

    df["Volume_Change"] = df["Volume"].pct_change()
    df["Volume_Change"] = df["Volume_Change"].replace([np.inf, -np.inf], np.nan)
    df["Return"] = df["Return"].replace([np.inf, -np.inf], np.nan)

    return df


def get_latest_feature_row(data: pd.DataFrame, feature_columns: list) -> pd.DataFrame:
    """
    Runs engineer_features and returns only the most recent complete row
    (no NaN in any required feature) -- this is what the live app predicts on.
    """
    engineered = engineer_features(data)
    engineered = engineered.dropna(subset=feature_columns).reset_index(drop=True)

    if not np.isfinite(engineered[feature_columns].values).all():
        raise ValueError("Non-finite values in latest feature row -- check input data.")

    if len(engineered) == 0:
        raise ValueError("No complete feature row available -- need more historical data.")

    return engineered.tail(1)
