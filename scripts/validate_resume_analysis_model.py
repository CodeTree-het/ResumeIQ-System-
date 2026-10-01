from pathlib import Path

import joblib
import pandas as pd

from sklearn.base import clone
from sklearn.model_selection import (
    StratifiedKFold,
    cross_val_score,
    train_test_split
)
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)


# ==========================================
# Paths
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR
    / "datasets"
    / "resume_analysis"
    / "resume_quality.csv"
)

MODEL_PATH = (
    BASE_DIR
    / "trained_models"
    / "resume_analysis_model.joblib"
)


# ==========================================
# Features
# ==========================================

FEATURES = [
    "years_college",
    "college_degree",
    "honors",
    "worked_during_school",
    "years_experience",
    "computer_skills",
    "special_skills",
    "volunteer",
    "employment_holes",
    "has_email_address"
]

TARGET = "resume_quality"


# ==========================================
# Main
# ==========================================

def main():

    print("\n==============================================")
    print("ResumeIQ - Resume Analysis Model Validation")
    print("==============================================\n")


    # ======================================
    # Load Dataset
    # ======================================

    df = pd.read_csv(
        DATASET_PATH
    )

    print("Dataset loaded ✅")

    print(
        "Rows:",
        len(df)
    )


    # ======================================
    # Prepare Features
    # ======================================

    X = df[
        FEATURES
    ].copy()


    y = (
        df[TARGET]
        .str
        .lower()
        .map({
            "low": 0,
            "high": 1
        })
    )


    # ======================================
    # Load Saved Model
    # ======================================

    model = joblib.load(
        MODEL_PATH
    )

    print(
        "Saved model loaded ✅"
    )


    # ======================================
    # Same Holdout Test
    # ======================================

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y
        )
    )


    predictions = model.predict(
        X_test
    )


    probabilities = model.predict_proba(
        X_test
    )[:, 1]


    accuracy = accuracy_score(
        y_test,
        predictions
    )


    roc_auc = roc_auc_score(
        y_test,
        probabilities
    )


    print("\n==============================================")
    print("1. Saved Model Holdout Validation")
    print("==============================================")

    print(
        f"Accuracy : {accuracy:.4f}"
    )

    print(
        f"ROC-AUC  : {roc_auc:.4f}"
    )


    print("\nClassification Report")
    print("---------------------")

    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                "Low Quality",
                "High Quality"
            ]
        )
    )


    print("Confusion Matrix")
    print("----------------")

    print(
        confusion_matrix(
            y_test,
            predictions
        )
    )


    # ======================================
    # Baseline Accuracy
    # ======================================

    print("\n==============================================")
    print("2. Baseline Accuracy")
    print("==============================================")

    majority_percentage = (
        y.value_counts(
            normalize=True
        )
        .max()
        * 100
    )


    print(
        f"Majority class baseline: "
        f"{majority_percentage:.2f}%"
    )

    print(
        f"Model accuracy: "
        f"{accuracy * 100:.2f}%"
    )


    # ======================================
    # 5-Fold Cross Validation
    # ======================================

    print("\n==============================================")
    print("3. 5-Fold Cross Validation")
    print("==============================================")


    cross_validation = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )


    model_for_cv = clone(
        model
    )


    cv_scores = cross_val_score(
        model_for_cv,
        X,
        y,
        cv=cross_validation,
        scoring="accuracy",
        n_jobs=-1
    )


    print(
        "Fold scores:"
    )


    for index, score in enumerate(
        cv_scores,
        start=1
    ):

        print(
            f"Fold {index}: "
            f"{score:.4f}"
        )


    print(
        f"\nMean CV Accuracy: "
        f"{cv_scores.mean():.4f}"
    )

    print(
        f"CV Standard Deviation: "
        f"{cv_scores.std():.4f}"
    )


    # ======================================
    # Feature Importance
    # ======================================

    print("\n==============================================")
    print("4. Feature Importance")
    print("==============================================")


    if hasattr(
        model,
        "feature_importances_"
    ):

        feature_importance = (
            pd.DataFrame({
                "feature": FEATURES,
                "importance":
                    model.feature_importances_
            })
            .sort_values(
                by="importance",
                ascending=False
            )
        )


        for _, row in (
            feature_importance
            .iterrows()
        ):

            print(
                f"{row['feature']:<25}"
                f"{row['importance']:.4f}"
            )


    else:

        print(
            "Feature importance is not "
            "available for this model."
        )


    # ======================================
    # Prediction Probability Example
    # ======================================

    print("\n==============================================")
    print("5. Example Predictions")
    print("==============================================")


    sample_rows = X_test.head(
        5
    )


    sample_predictions = model.predict(
        sample_rows
    )


    sample_probabilities = model.predict_proba(
        sample_rows
    )[:, 1]


    for index in range(
        len(sample_rows)
    ):

        predicted_label = (
            "High Quality"
            if sample_predictions[index] == 1
            else "Low Quality"
        )


        print(
            f"\nSample {index + 1}"
        )

        print(
            "Prediction:",
            predicted_label
        )

        print(
            "High Quality Probability:",
            f"{sample_probabilities[index] * 100:.2f}%"
        )


    print("\n==============================================")
    print("Validation completed successfully ✅")
    print("==============================================\n")


if __name__ == "__main__":

    main()