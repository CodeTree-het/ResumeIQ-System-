import re

# import spacy


nlp = spacy.load("en_core_web_sm")


def clean_resume_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\r", "\n")

    text = re.sub(r"[ \t]+", " ", text)

    text = re.sub(r"\n{3,}", "\n\n", text)

    text = re.sub(
        r"https?://\S+|www\.\S+",
        " ",
        text
    )

    text = re.sub(
        r"\S+@\S+\.\S+",
        " ",
        text
    )

    text = re.sub(
        r"\+?\d[\d\s\-()]{7,}\d",
        " ",
        text
    )

    return text.strip()


def normalize_text(text: str) -> str:
    cleaned_text = clean_resume_text(text)

    doc = nlp(cleaned_text)

    normalized_tokens = []

    for token in doc:
        if token.is_space:
            continue

        if token.is_punct:
            continue

        normalized_tokens.append(
            token.lemma_.lower()
        )

    return " ".join(normalized_tokens)


def preprocess_resume_text(text: str) -> dict:
    cleaned_text = clean_resume_text(text)
    normalized_text = normalize_text(cleaned_text)

    return {
        "cleaned_text": cleaned_text,
        "normalized_text": normalized_text
    }
