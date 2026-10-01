import re


def clean_certification_line(line: str) -> str:
    line = line.strip()

    line = re.sub(
        r"^[•●▪■\-*]+\s*",
        "",
        line
    )

    return line.strip()


def extract_certifications(
    certification_text: str
) -> list[str]:

    if not certification_text.strip():
        return []

    certifications = []

    for line in certification_text.splitlines():

        clean_line = clean_certification_line(
            line
        )

        if not clean_line:
            continue

        # Ignore generic section labels
        if clean_line.lower() in {
            "certification",
            "certifications",
            "certificate",
            "certificates",
        }:
            continue

        if clean_line not in certifications:
            certifications.append(
                clean_line
            )

    return certifications