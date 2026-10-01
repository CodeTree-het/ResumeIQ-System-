import pandas as pd
from pathlib import Path


# ==========================================
# Project Paths
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR
    / "datasets"
    / "resume_analysis"
    / "resume_quality.csv"
)


# ==========================================
# Main
# ==========================================

def main():

    print("\n==============================================")
    print("ResumeIQ - Resume Quality Dataset Inspection")
    print("==============================================\n")


    # ======================================
    # Load Dataset
    # ======================================

    df = pd.read_csv(DATASET_PATH)

    print("Dataset loaded successfully ✅\n")


    # ======================================
    # 1. Dataset Shape
    # ======================================

    print("1. Dataset Shape")
    print("----------------")

    print("Rows   :", df.shape[0])
    print("Columns:", df.shape[1])

    print("\n")


    # ======================================
    # 2. Column Names
    # ======================================

    print("2. Column Names")
    print("----------------")

    for index, column in enumerate(
        df.columns,
        start=1
    ):

        print(
            f"{index}. {column}"
        )

    print("\n")


    # ======================================
    # 3. Data Types
    # ======================================

    print("3. Data Types")
    print("-------------")

    print(
        df.dtypes
    )

    print("\n")


    # ======================================
    # 4. Missing Values
    # ======================================

    print("4. Missing Values")
    print("-----------------")

    missing_values = (
        df.isnull()
        .sum()
        .sort_values(
            ascending=False
        )
    )

    missing_values = (
        missing_values[
            missing_values > 0
        ]
    )

    if len(missing_values) == 0:

        print(
            "No missing values found ✅"
        )

    else:

        print(
            missing_values
        )

    print("\n")


    # ======================================
    # 5. Duplicate Rows
    # ======================================

    print("5. Duplicate Rows")
    print("-----------------")

    duplicates = (
        df.duplicated()
        .sum()
    )

    print(
        duplicates
    )

    print("\n")


    # ======================================
    # 6. Target Column
    # ======================================

    print("6. Target Column Check")
    print("----------------------")

    target_column = (
        "resume_quality"
    )


    if target_column in df.columns:

        print(
            "Target column found ✅"
        )

        print(
            "\nTarget value counts:"
        )

        print(
            df[target_column]
            .value_counts(
                dropna=False
            )
        )

        print(
            "\nTarget percentage:"
        )

        print(
            (
                df[target_column]
                .value_counts(
                    normalize=True,
                    dropna=False
                )
                * 100
            ).round(2)
        )

    else:

        print(
            "resume_quality column NOT found ❌"
        )

    print("\n")


    # ======================================
    # 7. Unique Values Per Column
    # ======================================

    print("7. Unique Values Per Column")
    print("---------------------------")

    for column in df.columns:

        unique_count = (
            df[column]
            .nunique(
                dropna=False
            )
        )

        print(
            f"{column}: {unique_count}"
        )

    print("\n")


    # ======================================
    # 8. First 5 Rows
    # ======================================

    print("8. First 5 Rows")
    print("----------------")

    print(
        df.head(5)
        .to_string()
    )

    print("\n")


    # ======================================
    # 9. Numeric Summary
    # ======================================

    print("9. Numeric Columns Summary")
    print("--------------------------")

    numeric_columns = (
        df.select_dtypes(
            include=["number"]
        )
    )


    if numeric_columns.empty:

        print(
            "No numeric columns found."
        )

    else:

        print(
            numeric_columns
            .describe()
            .to_string()
        )

    print("\n")


    # ======================================
    # 10. Object / Category Summary
    # ======================================

    print("10. Categorical Columns")
    print("-----------------------")

    categorical_columns = (
        df.select_dtypes(
            include=["object", "string"]
        )
        .columns
        .tolist()
    )

    for column in categorical_columns:

        print(
            f"\n{column}:"
        )

        print(
            df[column]
            .value_counts(
                dropna=False
            )
            .head(10)
        )

    print("\n")


    # ======================================
    # 11. Sensitive Columns Check
    # ======================================

    print("11. Sensitive Columns Check")
    print("---------------------------")

    sensitive_columns = [
        "firstname",
        "race",
        "gender"
    ]


    found_sensitive_columns = [
        column
        for column in sensitive_columns
        if column in df.columns
    ]


    if found_sensitive_columns:

        print(
            "Sensitive columns found:"
        )

        for column in found_sensitive_columns:

            print(
                "-",
                column
            )

        print(
            "\nThese columns should NOT be used for model training."
        )

    else:

        print(
            "No listed sensitive columns found."
        )

    print("\n")


    # ======================================
    # 12. Suggested Resume Features
    # ======================================

    print("12. Suggested Resume Features")
    print("-----------------------------")

    suggested_features = [
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


    available_features = [
        feature
        for feature in suggested_features
        if feature in df.columns
    ]


    missing_features = [
        feature
        for feature in suggested_features
        if feature not in df.columns
    ]


    print(
        "Available suggested features:"
    )

    for feature in available_features:

        print(
            "✅",
            feature
        )


    if missing_features:

        print(
            "\nSuggested features not found:"
        )

        for feature in missing_features:

            print(
                "❌",
                feature
            )

    print("\n")


    # ======================================
    # Complete
    # ======================================

    print("==============================================")
    print("Dataset inspection completed successfully ✅")
    print("==============================================\n")


# ==========================================
# Run
# ==========================================

if __name__ == "__main__":

    main()