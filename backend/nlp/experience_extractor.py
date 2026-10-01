import re


PRESENT_WORDS = {
    "present",
    "current",
    "currently",
    "ongoing",
}


ROLE_KEYWORDS = [
    # IT / Software
    "full stack developer",
    "full-stack developer",
    "software developer intern",
    "software engineer intern",
    "frontend developer intern",
    "backend developer intern",
    "software engineer",
    "software developer",
    "web developer",
    "frontend developer",
    "front-end developer",
    "backend developer",
    "back-end developer",

    # Data Science / Analytics
    "data scientist intern",
    "data analyst intern",
    "machine learning engineer intern",
    "data engineer intern",
    "data scientist",
    "data analyst",
    "business analyst",
    "machine learning engineer",
    "ml engineer",
    "data engineer",

    # HR
    "hr executive intern",
    "hr intern",
    "recruitment intern",
    "talent acquisition intern",
    "human resources executive",
    "human resources manager",
    "talent acquisition specialist",
    "talent acquisition executive",
    "hr executive",
    "hr manager",
    "recruiter",

    # Marketing
    "digital marketing intern",
    "marketing intern",
    "seo intern",
    "social media intern",
    "digital marketing executive",
    "digital marketing manager",
    "marketing executive",
    "marketing manager",
    "seo executive",
    "seo specialist",
    "social media manager",

    # Generic
    "intern",
    "trainee",
]


MONTH_PATTERN = (
    r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|"
    r"Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|"
    r"Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|"
    r"Nov(?:ember)?|Dec(?:ember)?)"
)


def clean_line(line: str) -> str:
    line = line.strip()

    line = re.sub(
        r"^[•●▪■\-*]+\s*",
        "",
        line
    )

    return line.strip()


def spans_overlap(
    start1: int,
    end1: int,
    start2: int,
    end2: int
) -> bool:
    return max(
        start1,
        start2
    ) < min(
        end1,
        end2
    )


def extract_date_ranges(
    experience_text: str
) -> list[str]:

    results = []

    used_spans = []

    # --------------------------------
    # Pattern 1:
    # January 2024 - Present
    # June 2023 - December 2023
    # --------------------------------

    month_pattern = (
        rf"\b{MONTH_PATTERN}\s+\d{{4}}\s*"
        rf"[–—-]\s*"
        rf"(?:"
        rf"{MONTH_PATTERN}\s+\d{{4}}"
        rf"|Present"
        rf"|Current"
        rf"|Ongoing"
        rf")\b"
    )

    month_matches = re.finditer(
        month_pattern,
        experience_text,
        re.IGNORECASE
    )

    for match in month_matches:
        value = match.group(0).strip()

        results.append(
            value
        )

        used_spans.append(
            (
                match.start(),
                match.end()
            )
        )

    # --------------------------------
    # Pattern 2:
    # 2022 - 2024
    # 2023 - Present
    # --------------------------------

    year_pattern = (
        r"\b(?:19|20)\d{2}\s*"
        r"[–—-]\s*"
        r"(?:"
        r"(?:19|20)\d{2}"
        r"|Present"
        r"|Current"
        r"|Ongoing"
        r")\b"
    )

    year_matches = re.finditer(
        year_pattern,
        experience_text,
        re.IGNORECASE
    )

    for match in year_matches:

        start = match.start()
        end = match.end()

        overlap_found = False

        for used_start, used_end in used_spans:
            if spans_overlap(
                start,
                end,
                used_start,
                used_end
            ):
                overlap_found = True
                break

        if overlap_found:
            continue

        value = match.group(0).strip()

        if value not in results:
            results.append(
                value
            )

    return results


def extract_explicit_experience_years(
    experience_text: str
) -> list[str]:

    patterns = [
        # 3 years of experience
        r"\b(\d+(?:\.\d+)?)\+?\s*years?\s+"
        r"(?:of\s+)?experience\b",

        # Experience: 3 years
        r"\bexperience\s*[:\-]?\s*(?:of\s+)?"
        r"(\d+(?:\.\d+)?)\+?\s*years?\b",
    ]

    years = []

    for pattern in patterns:
        matches = re.findall(
            pattern,
            experience_text,
            re.IGNORECASE
        )

        for value in matches:
            if value not in years:
                years.append(
                    value
                )

    return years


def extract_roles(
    experience_text: str
) -> list[str]:

    matches_found = []

    # Longer role names checked first
    sorted_roles = sorted(
        ROLE_KEYWORDS,
        key=len,
        reverse=True
    )

    for role in sorted_roles:

        pattern = (
            r"(?<!\w)"
            + re.escape(role)
            + r"(?!\w)"
        )

        matches = re.finditer(
            pattern,
            experience_text,
            re.IGNORECASE
        )

        for match in matches:

            current_start = match.start()
            current_end = match.end()

            overlap = False

            # If "Software Developer Intern"
            # already detected, do not separately
            # add "Software Developer" or "Intern".
            for existing in matches_found:

                if spans_overlap(
                    current_start,
                    current_end,
                    existing["start"],
                    existing["end"]
                ):
                    overlap = True
                    break

            if overlap:
                continue

            matches_found.append(
                {
                    "role": role.title(),
                    "start": current_start,
                    "end": current_end,
                }
            )

    # Preserve resume order
    matches_found.sort(
        key=lambda item: item["start"]
    )

    detected_roles = []

    for item in matches_found:

        role_name = item["role"]

        if role_name not in detected_roles:
            detected_roles.append(
                role_name
            )

    return detected_roles


def detect_current_employment(
    experience_text: str
) -> bool:

    lower_text = experience_text.lower()

    for word in PRESENT_WORDS:

        if re.search(
            rf"\b{re.escape(word)}\b",
            lower_text
        ):
            return True

    return False


def extract_experience(
    experience_text: str
) -> dict:

    if not experience_text.strip():

        return {
            "has_experience": False,
            "roles": [],
            "date_ranges": [],
            "explicit_years": [],
            "currently_working": False,
            "raw_text": "",
        }

    cleaned_lines = [
        clean_line(line)
        for line in experience_text.splitlines()
        if clean_line(line)
    ]

    cleaned_text = " ".join(
        cleaned_lines
    )

    return {
        "has_experience": bool(
            cleaned_text
        ),

        "roles": extract_roles(
            cleaned_text
        ),

        "date_ranges": extract_date_ranges(
            cleaned_text
        ),

        "explicit_years":
            extract_explicit_experience_years(
                cleaned_text
            ),

        "currently_working":
            detect_current_employment(
                cleaned_text
            ),

        "raw_text":
            cleaned_text,
    }