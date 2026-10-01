import pandas as pd
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = (
    BASE_DIR
    / "datasets"
    / "resume_analysis"
    / "resume_data_for_ranking.csv"
)


def main():

    print("\n==========================================")
    print("ResumeIQ - Resume Analysis Dataset Check")
    print("==========================================\n")

    # Load dataset
    df = pd.read_csv(DATASET_PATH)

    print("Dataset loaded successfully ✅\n")

    # Shape
    print("1. Dataset Shape")
    print("-----------------")
    print("Rows   :", df.shape[0])
    print("Columns:", df.shape[1])

    print("\n")

    # Column names
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

    # Data types
    print("3. Data Types")
    print("-------------")
    print(
        df.dtypes
    )

    print("\n")

    # Missing values
    print("4. Missing Values")
    print("-----------------")

    missing_values = (
        df.isnull()
        .sum()
        .sort_values(
            ascending=False
        )
    )

    print(
        missing_values[
            missing_values > 0
        ]
    )

    print("\n")

    # Duplicate rows
    print("5. Duplicate Rows")
    print("-----------------")

    print(
        df.duplicated().sum()
    )

    print("\n")

    # First rows
    print("6. First 3 Rows")
    print("----------------")

    print(
        df.head(3)
        .to_string()
    )

    print("\n")

    # matched_score check
    if "matched_score" in df.columns:

        print("7. matched_score Statistics")
        print("---------------------------")

        print(
            df["matched_score"]
            .describe()
        )

        print("\n")

    else:

        print(
            "matched_score column not found."
        )


if __name__ == "__main__":
    main()