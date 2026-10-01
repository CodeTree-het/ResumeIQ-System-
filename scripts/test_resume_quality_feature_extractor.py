import sys
from pathlib import Path


# ==========================================
# Add Project Root To Python Path
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

if str(BASE_DIR) not in sys.path:
    sys.path.insert(
        0,
        str(BASE_DIR)
    )


# ==========================================
# Import ResumeIQ Feature Extractor
# ==========================================

from backend.ml.resume_quality_feature_extractor import (
    extract_resume_quality_features,
    extract_resume_quality_features_with_details
)


# ==========================================
# Sample Resume Text
# ==========================================

sample_resume_text = """
Het Patel
Email: patel.het@example.com

Education
Master of Computer Applications (MCA)
Veer Narmad South Gujarat University

Experience
2 years of experience in software development.

Internship
Software Developer Intern at ABC Technologies.

Technical Skills
Python
FastAPI
MongoDB
SQL
HTML
CSS
JavaScript
Git

Soft Skills
Communication
Teamwork
Problem Solving

Volunteer Experience
Volunteer at local NGO for community service.
"""


# ==========================================
# Test
# ==========================================

def main():

    print("\n==============================================")
    print("ResumeIQ - Resume Quality Feature Test")
    print("==============================================\n")


    # --------------------------------------
    # Extract Features
    # --------------------------------------

    features = (
        extract_resume_quality_features(
            sample_resume_text
        )
    )


    print("Extracted ML Features:")
    print("----------------------")


    for feature, value in features.items():

        print(
            f"{feature:<25} : {value}"
        )


    # --------------------------------------
    # Extract Features + Explanation
    # --------------------------------------

    result = (
        extract_resume_quality_features_with_details(
            sample_resume_text
        )
    )


    print("\nExplanations:")
    print("-------------")


    for feature, explanation in (
        result["explanations"].items()
    ):

        print(
            f"{feature:<25} : {explanation}"
        )


    print("\n==============================================")
    print("Feature extraction test completed ✅")
    print("==============================================\n")


if __name__ == "__main__":

    main()