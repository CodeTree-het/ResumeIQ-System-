from pathlib import Path
from typing import Dict, Any

import joblib
import pandas as pd

from backend.ml.resume_quality_feature_extractor import (
    extract_resume_quality_features_with_details
)


# =========================================================
# Paths
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent

MODEL_PATH = (
    BASE_DIR
    / "trained_models"
    / "resume_analysis_model.joblib"
)


# =========================================================
# Feature Order
# Must match training
# =========================================================

MODEL_FEATURES = [
    "years_college",
    "college_degree",
    "honors",
    "worked_during_school",
    "years_experience",
    "computer_skills",
    "special_skills",
    "volunteer",
    "employment_holes",
    "has_email_address",
]


# =========================================================
# Load Model
# =========================================================

if not MODEL_PATH.exists():

    raise FileNotFoundError(
        f"Resume analysis model not found: {MODEL_PATH}"
    )


resume_analysis_model = joblib.load(
    MODEL_PATH
)


# =========================================================
# Prediction Function
# =========================================================

def predict_resume_quality(
    resume_text: str
) -> Dict[str, Any]:

    if not resume_text:

        raise ValueError(
            "Resume text cannot be empty."
        )


    # -----------------------------------------------------
    # Extract ML Features
    # -----------------------------------------------------

    extraction_result = (
        extract_resume_quality_features_with_details(
            resume_text
        )
    )


    features = extraction_result[
        "features"
    ]

    explanations = extraction_result[
        "explanations"
    ]


    # -----------------------------------------------------
    # Convert To DataFrame
    # -----------------------------------------------------

    model_input = pd.DataFrame(
        [
            {
                feature:
                    features[feature]

                for feature
                in MODEL_FEATURES
            }
        ]
    )


    # -----------------------------------------------------
    # Prediction
    #
    # 0 = Low Quality
    # 1 = High Quality
    # -----------------------------------------------------

    prediction = int(
        resume_analysis_model.predict(
            model_input
        )[0]
    )


    # -----------------------------------------------------
    # Probability
    # -----------------------------------------------------

    probabilities = (
        resume_analysis_model
        .predict_proba(
            model_input
        )[0]
    )


    classes = list(
        resume_analysis_model.classes_
    )


    high_index = (
        classes.index(1)
    )


    low_index = (
        classes.index(0)
    )


    high_probability = float(
        probabilities[
            high_index
        ]
    )


    low_probability = float(
        probabilities[
            low_index
        ]
    )


    # -----------------------------------------------------
    # Human-readable Result
    # -----------------------------------------------------

    quality_label = (
        "high"
        if prediction == 1
        else "low"
    )


    confidence = (
        high_probability
        if prediction == 1
        else low_probability
    )


    # -----------------------------------------------------
    # Return Result
    # -----------------------------------------------------

    return {

        "quality_label":
            quality_label,

        "prediction_value":
            prediction,

        "confidence":
            round(
                confidence,
                4
            ),

        "high_quality_probability":
            round(
                high_probability,
                4
            ),

        "low_quality_probability":
            round(
                low_probability,
                4
            ),

        "features":
            features,

        "explanations":
            explanations,
    }