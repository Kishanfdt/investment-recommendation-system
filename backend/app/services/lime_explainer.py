"""
LIME explainability service.
Provides a model-agnostic, local explanation to complement SHAP's
tree-specific explanation -- per the project's XAI requirement (SHAP + LIME).
"""

import numpy as np
import pandas as pd
from functools import lru_cache
from lime.lime_tabular import LimeTabularExplainer

from app import config


@lru_cache(maxsize=1)
def load_lime_explainer():
    background_path = config.MODELS_DIR / "lime_background_data.csv"
    background_data = pd.read_csv(background_path)

    # Sanity check: background data columns must exactly match the trained
    # feature order, or LIME's perturbations will be meaningless.
    missing = [c for c in config.FEATURE_COLUMNS if c not in background_data.columns]
    if missing:
        raise ValueError(f"lime_background_data.csv is missing columns: {missing}")

    background_data = background_data[config.FEATURE_COLUMNS]

    explainer = LimeTabularExplainer(
        training_data=background_data.values,
        feature_names=config.FEATURE_COLUMNS,
        class_names=["DOWN", "UP"],
        mode="classification",
        discretize_continuous=True,
        random_state=42,
    )
    return explainer


def explain_with_lime(model, X_live_row: pd.DataFrame, num_features: int = 5) -> list[dict]:
    """
    X_live_row: single-row DataFrame with columns == config.FEATURE_COLUMNS.
    Returns the same shape of output as the SHAP explanation, for easy
    side-by-side comparison in the API response.
    """
    explainer = load_lime_explainer()

    instance = X_live_row[config.FEATURE_COLUMNS].values[0]

    explanation = explainer.explain_instance(
        data_row=instance,
        predict_fn=model.predict_proba,
        num_features=num_features,
    )

    # explanation.as_list() gives [(condition_string, weight), ...]
    # e.g. ("RSI > 65.20", 0.34) -- weight sign indicates push toward class 1 (UP)
    results = []
    for condition, weight in explanation.as_list():
        results.append({
            "condition": condition,
            "weight": round(float(weight), 4),
            "direction": "pushes UP" if weight > 0 else "pushes DOWN",
        })

    return results