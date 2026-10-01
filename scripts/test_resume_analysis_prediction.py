import sys
from pathlib import Path


# ==========================================
# Add Project Root
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

if str(BASE_DIR) not in sys.path:
    sys.path.insert(
        0,
        str(BASE_DIR)
    )


# ==========================================
# Import Predictor
# ==========================================

from backend.ml.resume_analysis_predictor import (
    predict_resume_quality
)


# ==========================================
# Low Quality Sample Resume
# ==========================================

sample_resume_text = """
John

Objective
Looking for a job.

Education
School completed.

Experience
Fresher.
"""


# ==========================================
# Main Test
# ==========================================

def main():

    print("\n============================================")
    print("ResumeIQ - Resume Analysis Prediction Test")
    print("============================================\n")


    result = predict_resume_quality(
        sample_resume_text
    )


    # --------------------------------------
    # Prediction Result
    # --------------------------------------

    print(
        "Quality Prediction :",
        result["quality_label"]
    )

    print(
        "Prediction Value   :",
        result["prediction_value"]
    )

    print(
        "Confidence         :",
        f"{result['confidence'] * 100:.2f}%"
    )

    print(
        "High Probability   :",
        f"{result['high_quality_probability'] * 100:.2f}%"
    )

    print(
        "Low Probability    :",
        f"{result['low_quality_probability'] * 100:.2f}%"
    )


    # --------------------------------------
    # Extracted Features
    # --------------------------------------

    print("\nExtracted Features")
    print("------------------")


    for feature, value in (
        result["features"].items()
    ):

        print(
            f"{feature:<25}: {value}"
        )


    # --------------------------------------
    # Explanations
    # --------------------------------------

    print("\nFeature Explanations")
    print("--------------------")


    for feature, explanation in (
        result["explanations"].items()
    ):

        print(
            f"{feature:<25}: {explanation}"
        )


    print("\n============================================")
    print("Prediction test completed successfully ✅")
    print("============================================\n")


# ==========================================
# Run
# ==========================================

if __name__ == "__main__":
    main()