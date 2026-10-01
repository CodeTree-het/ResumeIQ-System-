import random
from pathlib import Path

import pandas as pd


random.seed(42)


INPUT_PATH = Path(
    "datasets/resume_analysis/resume_sections_clean.csv"
)

OUTPUT_PATH = Path(
    "datasets/resume_analysis/resume_sections_balanced.csv"
)

TARGET_PER_CLASS = 150


def generate_achievement_examples(
    required_count: int,
    existing_texts: set
) -> list[dict]:

    actions = [
        "improved customer satisfaction",
        "reduced processing time",
        "increased campaign engagement",
        "improved recruitment efficiency",
        "optimized application performance",
        "increased website traffic",
        "reduced data processing errors",
        "improved employee engagement",
        "automated reporting workflow",
        "improved dashboard accuracy",
    ]

    metrics = [
        "by 10%",
        "by 15%",
        "by 20%",
        "by 25%",
        "by 30%",
        "by 35%",
        "by 40%",
        "by 50%",
    ]

    scopes = [
        "during an academic project",
        "for a client project",
        "during internship",
        "across multiple campaigns",
        "for internal operations",
        "across three departments",
        "for a team project",
        "during a university competition",
    ]

    prefixes = [
        "Achievement:",
        "Recognized for",
        "Awarded for",
        "Successfully",
        "Received recognition after",
    ]

    generated = []

    attempts = 0

    while (
        len(generated) < required_count
        and attempts < 10000
    ):
        attempts += 1

        text = (
            f"{random.choice(prefixes)} "
            f"{random.choice(actions)} "
            f"{random.choice(metrics)} "
            f"{random.choice(scopes)}."
        )

        if text in existing_texts:
            continue

        existing_texts.add(text)

        generated.append(
            {
                "text": text,
                "label": "achievements",
            }
        )

    return generated


def generate_certification_examples(
    required_count: int,
    existing_texts: set
) -> list[dict]:

    providers = [
        "Google",
        "Microsoft",
        "IBM",
        "AWS",
        "Coursera",
        "Deloitte",
        "British Airways",
        "HubSpot",
        "Meta",
        "LinkedIn Learning",
        "Udemy",
        "Great Learning",
    ]

    certificates = [
        "Data Analytics Certificate",
        "Python for Data Science Certificate",
        "Machine Learning Certificate",
        "Cloud Fundamentals Certification",
        "Digital Marketing Certification",
        "SEO Fundamentals Certificate",
        "Human Resource Management Certificate",
        "Talent Acquisition Certificate",
        "Power BI Data Analyst Certificate",
        "SQL Fundamentals Certificate",
        "Web Development Certificate",
        "Business Analytics Certificate",
    ]

    templates = [
        "{provider} — {certificate}",
        "Completed {certificate} from {provider}",
        "Certified in {certificate} by {provider}",
        "Certification: {provider} {certificate}",
        "{provider} Professional Certificate in {certificate}",
    ]

    years = [
        "2022",
        "2023",
        "2024",
        "2025",
        "2026",
    ]

    generated = []

    attempts = 0

    while (
        len(generated) < required_count
        and attempts < 10000
    ):
        attempts += 1

        template = random.choice(
            templates
        )

        text = template.format(
            provider=random.choice(
                providers
            ),
            certificate=random.choice(
                certificates
            ),
        )

        if random.choice(
            [True, False]
        ):
            text += (
                f" | {random.choice(years)}"
            )

        if text in existing_texts:
            continue

        existing_texts.add(text)

        generated.append(
            {
                "text": text,
                "label": "certifications",
            }
        )

    return generated


def generate_other_examples(
    required_count: int,
    existing_texts: set
) -> list[dict]:

    cities = [
        "Surat, Gujarat",
        "Ahmedabad, Gujarat",
        "Mumbai, Maharashtra",
        "Pune, Maharashtra",
        "Bengaluru, Karnataka",
        "Chennai, Tamil Nadu",
        "Hyderabad, Telangana",
        "Delhi, India",
    ]

    language_sets = [
        "English, Hindi, Gujarati",
        "English, Hindi",
        "English, Tamil",
        "English, Marathi, Hindi",
        "English, Telugu, Hindi",
    ]

    generated = []

    index = 1

    while len(generated) < required_count:

        username = (
            f"candidate{index:03d}"
        )

        phone_number = (
            9000000000 + index
        )

        variants = [
            f"Email: {username}@example.com",
            f"Phone: +91 {phone_number}",
            (
                "LinkedIn: "
                f"linkedin.com/in/{username}"
            ),
            (
                "GitHub: "
                f"github.com/{username}"
            ),
            (
                "Portfolio: "
                f"www.{username}.com"
            ),
            (
                "Location: "
                f"{random.choice(cities)}"
            ),
            (
                "Languages: "
                f"{random.choice(language_sets)}"
            ),
        ]

        for text in variants:

            if len(generated) >= required_count:
                break

            if text in existing_texts:
                continue

            existing_texts.add(text)

            generated.append(
                {
                    "text": text,
                    "label": "other",
                }
            )

        index += 1

    return generated


def main():

    if not INPUT_PATH.exists():
        print(
            "Clean dataset not found."
        )
        return

    df = pd.read_csv(
        INPUT_PATH
    )

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

    expected_labels = [
        "summary",
        "skills",
        "education",
        "experience",
        "projects",
        "certifications",
        "achievements",
        "other",
    ]

    balanced_parts = []

    for label in expected_labels:

        class_df = df[
            df["label"] == label
        ].copy()

        if len(class_df) >= TARGET_PER_CLASS:

            class_df = class_df.sample(
                n=TARGET_PER_CLASS,
                random_state=42
            )

            balanced_parts.append(
                class_df
            )

            continue

        existing_texts = set(
            class_df["text"].tolist()
        )

        required_count = (
            TARGET_PER_CLASS
            - len(class_df)
        )

        if label == "achievements":

            generated_rows = (
                generate_achievement_examples(
                    required_count,
                    existing_texts
                )
            )

        elif label == "certifications":

            generated_rows = (
                generate_certification_examples(
                    required_count,
                    existing_texts
                )
            )

        elif label == "other":

            generated_rows = (
                generate_other_examples(
                    required_count,
                    existing_texts
                )
            )

        else:
            print(
                f"Not enough rows for label: {label}"
            )

            return

        generated_df = pd.DataFrame(
            generated_rows
        )

        class_df = pd.concat(
            [
                class_df,
                generated_df
            ],
            ignore_index=True
        )

        balanced_parts.append(
            class_df
        )

    balanced_df = pd.concat(
        balanced_parts,
        ignore_index=True
    )

    balanced_df = (
        balanced_df
        .drop_duplicates(
            subset=[
                "text",
                "label"
            ]
        )
        .sample(
            frac=1,
            random_state=42
        )
        .reset_index(
            drop=True
        )
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    balanced_df.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8"
    )

    print(
        "\n--- Resume Analysis Balanced Dataset ---"
    )

    print(
        f"\nTotal Rows: "
        f"{len(balanced_df)}"
    )

    print(
        "\n===== LABEL DISTRIBUTION ====="
    )

    print(
        balanced_df[
            "label"
        ].value_counts().sort_index()
    )

    print(
        "\nDuplicate Rows: "
        f"{balanced_df.duplicated().sum()}"
    )

    print(
        f"\nSaved at: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()