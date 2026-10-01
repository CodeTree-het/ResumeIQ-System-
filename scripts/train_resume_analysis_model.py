import json
from pathlib import Path

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)


# =========================================================
# Paths
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR
    / "datasets"
    / "resume_analysis"
    / "resume_quality.csv"
)

MODEL_DIR = (
    BASE_DIR
    / "trained_models"
)

MODEL_PATH = (
    MODEL_DIR
    / "resume_analysis_model.joblib"
)

METADATA_PATH = (
    MODEL_DIR
    / "resume_analysis_model_metadata.json"
)


# =========================================================
# Features
# =========================================================

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


# =========================================================
# Evaluation
# =========================================================

def evaluate_model(
    model_name,
    model,
    X_test,
    y_test
):

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

    precision = precision_score(
        y_test,
        predictions
    )

    recall = recall_score(
        y_test,
        predictions
    )

    f1 = f1_score(
        y_test,
        predictions
    )

    roc_auc = roc_auc_score(
        y_test,
        probabilities
    )


    print("\n==========================================")
    print(model_name)
    print("==========================================")

    print(
        f"Accuracy : {accuracy:.4f}"
    )

    print(
        f"Precision: {precision:.4f}"
    )

    print(
        f"Recall   : {recall:.4f}"
    )

    print(
        f"F1 Score : {f1:.4f}"
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


    return {
        "model_name": model_name,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc
    }


# =========================================================
# Main
# =========================================================

def main():

    print("\n============================================")
    print("ResumeIQ - Resume Analysis Model Training")
    print("============================================\n")


    # -----------------------------------------------------
    # Load Dataset
    # -----------------------------------------------------

    df = pd.read_csv(
        DATASET_PATH
    )


    print(
        "Dataset loaded successfully ✅"
    )

    print(
        "Rows:",
        len(df)
    )


    # -----------------------------------------------------
    # Validate Required Columns
    # -----------------------------------------------------

    required_columns = (
        FEATURES
        +
        [TARGET]
    )


    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]


    if missing_columns:

        raise ValueError(
            f"Missing columns: {missing_columns}"
        )


    # -----------------------------------------------------
    # Feature Dataset
    # -----------------------------------------------------

    X = df[
        FEATURES
    ].copy()


    # -----------------------------------------------------
    # Encode Target
    #
    # low  = 0
    # high = 1
    # -----------------------------------------------------

    y = (
        df[TARGET]
        .str
        .lower()
        .map({
            "low": 0,
            "high": 1
        })
    )


    if y.isnull().any():

        raise ValueError(
            "Unexpected resume_quality value found."
        )


    # -----------------------------------------------------
    # Missing Value Check
    # -----------------------------------------------------

    print(
        "\nSelected feature missing values:"
    )

    print(
        X.isnull().sum()
    )


    if X.isnull().any().any():

        print(
            "\nMissing values found."
        )

        print(
            "Filling numeric missing values with median."
        )


        for column in FEATURES:

            if X[column].isnull().any():

                X[column] = (
                    X[column]
                    .fillna(
                        X[column].median()
                    )
                )


    # -----------------------------------------------------
    # Train Test Split
    # -----------------------------------------------------

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y
        )
    )


    print(
        "\nTraining records:",
        len(X_train)
    )

    print(
        "Testing records :",
        len(X_test)
    )


    # =====================================================
    # Model 1
    # Logistic Regression
    # =====================================================

    logistic_model = Pipeline(
        steps=[
            (
                "scaler",
                StandardScaler()
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    random_state=42
                )
            )
        ]
    )


    logistic_model.fit(
        X_train,
        y_train
    )


    logistic_result = evaluate_model(
        "Logistic Regression",
        logistic_model,
        X_test,
        y_test
    )


    # =====================================================
    # Model 2
    # Random Forest
    # =====================================================

    random_forest_model = (
        RandomForestClassifier(
            n_estimators=300,
            max_depth=8,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight="balanced",
            n_jobs=-1
        )
    )


    random_forest_model.fit(
        X_train,
        y_train
    )


    random_forest_result = evaluate_model(
        "Random Forest",
        random_forest_model,
        X_test,
        y_test
    )


    # =====================================================
    # Select Best Model Using F1 Score
    # =====================================================

    results = [
        (
            logistic_result,
            logistic_model
        ),
        (
            random_forest_result,
            random_forest_model
        )
    ]


    best_result, best_model = max(
        results,
        key=lambda item:
            item[0]["f1"]
    )


    print("\n============================================")
    print("Best Model")
    print("============================================")

    print(
        "Selected:",
        best_result["model_name"]
    )

    print(
        f"Accuracy : {best_result['accuracy']:.4f}"
    )

    print(
        f"F1 Score : {best_result['f1']:.4f}"
    )

    print(
        f"ROC-AUC  : {best_result['roc_auc']:.4f}"
    )


    # =====================================================
    # Save Model
    # =====================================================

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )


    joblib.dump(
        best_model,
        MODEL_PATH
    )


    print(
        "\nModel saved successfully ✅"
    )

    print(
        MODEL_PATH
    )


    # =====================================================
    # Save Metadata
    # =====================================================

    metadata = {

        "model_name":
            best_result["model_name"],

        "model_type":
            "binary_classification",

        "target":
            TARGET,

        "target_mapping": {
            "low": 0,
            "high": 1
        },

        "features":
            FEATURES,

        "accuracy":
            round(
                best_result["accuracy"],
                6
            ),

        "precision":
            round(
                best_result["precision"],
                6
            ),

        "recall":
            round(
                best_result["recall"],
                6
            ),

        "f1":
            round(
                best_result["f1"],
                6
            ),

        "roc_auc":
            round(
                best_result["roc_auc"],
                6
            ),

        "excluded_sensitive_features": [
            "firstname",
            "race",
            "gender"
        ],

        "excluded_leakage_features": [
            "received_callback"
        ]
    }


    with open(
        METADATA_PATH,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metadata,
            file,
            indent=4
        )


    print(
        "Metadata saved successfully ✅"
    )

    print(
        METADATA_PATH
    )


    print("\n============================================")
    print("Training completed successfully ✅")
    print("============================================\n")


# =========================================================
# Run
# =========================================================

if __name__ == "__main__":

    main()