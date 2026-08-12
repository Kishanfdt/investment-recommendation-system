"""
Scale-invariant feature engineering for the pooled NIFTY 50 model.
Mirrors the logic in 13_NIFTY50_Data_Collection.ipynb's
engineer_pooled_features() -- must stay in sync with that notebook.
"""

import numpy as np
import pandas as pd

POOLED_FEATURE_COLUMNS = [
    "Return", "Volatility", "RSI",
    "MACD_norm", "MACD_Signal_norm", "MACD_Histogram_norm",
    "Volume_Change", "Close_to_MA20", "Close_to_MA50", "MA20_to_MA50",
    "High_Low_Range_pct", "Volume_zscore",
]


def engineer_pooled_features(data: pd.DataFrame, ticker: str) -> pd.DataFrame:
    df = data.copy()
    df = df.sort_values("Date").drop_duplicates().reset_index(drop=True)

    numeric_cols = ["Open", "High", "Low", "Close", "Volume"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=["Close"]).reset_index(drop=True)

    df["MA20"] = df["Close"].rolling(20).mean()
    df["MA50"] = df["Close"].rolling(50).mean()
    df["Return"] = df["Close"].pct_change()
    df["Volatility"] = df["Return"].rolling(20).std()

    delta = df["Close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    df["RSI"] = 100 - (100 / (1 + rs))
    df["RSI"] = df["RSI"].fillna(100)

    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    macd_signal = macd.ewm(span=9, adjust=False).mean()
    macd_hist = macd - macd_signal

    df["MACD_norm"] = macd / df["Close"]
    df["MACD_Signal_norm"] = macd_signal / df["Close"]
    df["MACD_Histogram_norm"] = macd_hist / df["Close"]
    df["Close_to_MA20"] = df["Close"] / df["MA20"]
    df["Close_to_MA50"] = df["Close"] / df["MA50"]
    df["MA20_to_MA50"] = df["MA20"] / df["MA50"]
    df["High_Low_Range_pct"] = (df["High"] - df["Low"]) / df["Close"]

    df["Volume_Change"] = df["Volume"].pct_change()
    df["Volume_Change"] = df["Volume_Change"].replace([np.inf, -np.inf], np.nan)
    df["Return"] = df["Return"].replace([np.inf, -np.inf], np.nan)

    volume_mean = df["Volume"].rolling(60).mean()
    volume_std = df["Volume"].rolling(60).std()
    df["Volume_zscore"] = (df["Volume"] - volume_mean) / volume_std.replace(0, np.nan)

    df["Ticker"] = ticker
    return df


def get_latest_pooled_row(data: pd.DataFrame, ticker: str) -> pd.DataFrame:
    engineered = engineer_pooled_features(data, ticker)
    engineered = engineered.dropna(subset=POOLED_FEATURE_COLUMNS).reset_index(drop=True)

    if not np.isfinite(engineered[POOLED_FEATURE_COLUMNS].values).all():
        raise ValueError(f"Non-finite values in latest feature row for {ticker}.")
    if len(engineered) == 0:
        raise ValueError(f"No complete feature row available for {ticker} -- need more historical data.")

    return engineered.tail(1)