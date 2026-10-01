import pandas as pd
from pathlib import Path


DATASET_PATH = Path(
    "datasets/resume_analysis/resume_sections.csv"
)


def main():

    if not DATASET_PATH.exists():
        print("Dataset file not found.")
        return

    df = pd.read_csv(
        DATASET_PATH
    )

    print(
        "\n--- Resume Analysis Dataset Check ---"
    )

    print(
        f"\nTotal Rows: {len(df)}"
    )

    print(
        f"Columns: {list(df.columns)}"
    )

    print(
        "\n===== LABEL DISTRIBUTION ====="
    )

    label_counts = (
        df["label"]
        .value_counts()
        .sort_index()
    )

    print(
        label_counts
    )

    print(
        "\n===== MISSING VALUES ====="
    )

    print(
        df.isnull().sum()
    )

    duplicate_count = df.duplicated().sum()

    print(
        f"\nDuplicate Rows: "
        f"{duplicate_count}"
    )

    empty_text_count = (
        df["text"]
        .astype(str)
        .str.strip()
        .eq("")
        .sum()
    )

    print(
        f"Empty Text Rows: "
        f"{empty_text_count}"
    )

    unique_labels = sorted(
        df["label"]
        .dropna()
        .unique()
        .tolist()
    )

    print(
        "\n===== UNIQUE LABELS ====="
    )

    for label in unique_labels:
        print(
            f"- {label}"
        )

    expected_labels = {
        "summary",
        "skills",
        "education",
        "experience",
        "projects",
        "certifications",
        "achievements",
        "other",
    }

    actual_labels = set(
        unique_labels
    )

    if actual_labels == expected_labels:
        print(
            "\nAll expected labels are present."
        )
    else:
        print(
            "\nLabel mismatch detected."
        )

        print(
            f"Missing Labels: "
            f"{expected_labels - actual_labels}"
        )

        print(
            f"Unexpected Labels: "
            f"{actual_labels - expected_labels}"
        )

    print(
        "\n===== SAMPLE DATA ====="
    )

    print(
        df.sample(
            min(10, len(df)),
            random_state=42
        ).to_string(
            index=False
        )
    )


if __name__ == "__main__":
    main()