import pandas as pd
from pathlib import Path


INPUT_PATH = Path(
    "datasets/resume_analysis/resume_sections.csv"
)

OUTPUT_PATH = Path(
    "datasets/resume_analysis/resume_sections_clean.csv"
)


def main():

    if not INPUT_PATH.exists():
        print("Input dataset not found.")
        return

    df = pd.read_csv(
        INPUT_PATH
    )

    print(
        "\n--- Resume Analysis Dataset Cleaning ---"
    )

    print(
        f"Original Rows: {len(df)}"
    )

    duplicate_count = (
        df.duplicated().sum()
    )

    print(
        f"Duplicate Rows Found: "
        f"{duplicate_count}"
    )

    # Remove missing values
    df = df.dropna(
        subset=[
            "text",
            "label"
        ]
    )

    # Remove empty text
    df["text"] = (
        df["text"]
        .astype(str)
        .str.strip()
    )

    df["label"] = (
        df["label"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    df = df[
        df["text"] != ""
    ]

    # Remove exact duplicates
    df = df.drop_duplicates(
        subset=[
            "text",
            "label"
        ]
    )

    # Shuffle dataset
    df = df.sample(
        frac=1,
        random_state=42
    ).reset_index(
        drop=True
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8"
    )

    print(
        f"\nClean Rows: {len(df)}"
    )

    print(
        "\n===== CLEAN LABEL DISTRIBUTION ====="
    )

    print(
        df["label"]
        .value_counts()
        .sort_index()
    )

    print(
        f"\nSaved at: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()