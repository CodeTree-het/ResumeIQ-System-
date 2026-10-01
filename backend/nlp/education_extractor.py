import re


DEGREE_PATTERNS = {
    r"\bmaster of computer applications\b": "Master of Computer Applications (MCA)",
    r"\bmca\b": "Master of Computer Applications (MCA)",

    r"\bbachelor of computer applications\b": "Bachelor of Computer Applications (BCA)",
    r"\bbca\b": "Bachelor of Computer Applications (BCA)",

    r"\bbachelor of science in information technology\b":
        "Bachelor of Science in Information Technology",

    r"\bb\.?\s?sc\.?\s?(it|information technology)?\b":
        "Bachelor of Science in Information Technology",

    r"\bmaster of science\b": "Master of Science (MSc)",
    r"\bm\.?\s?sc\.?\b": "Master of Science (MSc)",

    r"\bbachelor of technology\b": "Bachelor of Technology (BTech)",
    r"\bb\.?\s?tech\.?\b": "Bachelor of Technology (BTech)",

    r"\bbachelor of engineering\b": "Bachelor of Engineering (BE)",
    r"\bb\.?\s?e\.?\b": "Bachelor of Engineering (BE)",

    r"\bhigher secondary certificate\b": "Higher Secondary Certificate (HSC)",
    r"\bh\.?\s?s\.?\s?c\.?\b": "Higher Secondary Certificate (HSC)",

    r"\bsecondary school certificate\b": "Secondary School Certificate (SSC)",
    r"\bs\.?\s?s\.?\s?c\.?\b": "Secondary School Certificate (SSC)",
}


def extract_degrees(education_text: str) -> list[str]:
    detected_degrees = []

    for pattern, degree_name in DEGREE_PATTERNS.items():
        if re.search(pattern, education_text, re.IGNORECASE):
            if degree_name not in detected_degrees:
                detected_degrees.append(degree_name)

    return detected_degrees


def extract_institutions(education_text: str) -> list[str]:
    institutions = []

    institution_keywords = [
        "university",
        "college",
        "vidhyalaya",
        "vidyalaya",
        "institute",
    ]

    exclude_keywords = [
        "certificate",
        "degree",
        "bachelor",
        "master",
        "percentage",
        "cgpa",
    ]

    for line in education_text.splitlines():
        clean_line = line.strip()

        if not clean_line:
            continue

        lower_line = clean_line.lower()

        if any(keyword in lower_line for keyword in exclude_keywords):
            continue

        if any(keyword in lower_line for keyword in institution_keywords):
            if clean_line not in institutions:
                institutions.append(clean_line)

    return institutions


def extract_year_ranges(education_text: str) -> list[str]:
    pattern = r"\b(?:19|20)\d{2}\s*[–—-]\s*(?:19|20)\d{2}\b"

    matches = re.findall(
        pattern,
        education_text
    )

    return list(dict.fromkeys(matches))


def extract_cgpa(education_text: str) -> list[str]:
    pattern = r"\bCGPA\s*[:\-]?\s*(\d+(?:\.\d+)?)"

    matches = re.findall(
        pattern,
        education_text,
        re.IGNORECASE
    )

    return list(dict.fromkeys(matches))


def extract_percentages(
    education_text: str
) -> list[str]:

    patterns = [
        r"\bPercentage\s*[:\-]?\s*(\d{1,3}(?:\.\d+)?)\s*%?",
        r"\b(\d{1,3}(?:\.\d+)?)\s*%",
    ]

    percentages = []

    for pattern in patterns:
        matches = re.findall(
            pattern,
            education_text,
            re.IGNORECASE
        )

        for value in matches:
            if value not in percentages:
                percentages.append(value)

    return percentages


def extract_education(
    education_text: str
) -> dict:

    if not education_text:
        return {
            "degrees": [],
            "institutions": [],
            "year_ranges": [],
            "cgpa": [],
            "percentages": [],
            "ongoing": False,
        }

    return {
        "degrees": extract_degrees(
            education_text
        ),

        "institutions": extract_institutions(
            education_text
        ),

        "year_ranges": extract_year_ranges(
            education_text
        ),

        "cgpa": extract_cgpa(
            education_text
        ),

        "percentages": extract_percentages(
            education_text
        ),

        "ongoing": bool(
            re.search(
                r"\bongoing\b|\bpursuing\b|\bcurrent\b",
                education_text,
                re.IGNORECASE
            )
        ),
    }