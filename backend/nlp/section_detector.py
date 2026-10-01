import re


SECTION_ALIASES = {
    "summary": [
        "summary",
        "professional summary",
        "profile",
        "career objective",
        "objective",
        "about me",
    ],
    "skills": [
        "skills",
        "technical skills",
        "key skills",
        "core skills",
        "competencies",
        "technical expertise",
    ],
    "education": [
        "education",
        "academic qualification",
        "academic qualifications",
        "educational qualification",
        "educational qualifications",
        "academics",
    ],
    "experience": [
        "experience",
        "work experience",
        "professional experience",
        "employment history",
        "work history",
        "internship",
        "internships",
    ],
    "projects": [
        "projects",
        "project",
        "academic projects",
        "personal projects",
        "key projects",
    ],
    "certifications": [
        "certifications",
        "certification",
        "certificates",
        "courses",
        "training",
        "trainings",
    ],
    "achievements": [
        "achievements",
        "achievement",
        "awards",
        "honors",
        "accomplishments",
    ],
}


def normalize_heading(text: str) -> str:
    text = text.strip().lower()

    text = re.sub(r"[:\-–—]+$", "", text)

    text = re.sub(r"[^a-z\s]", " ", text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def identify_section_heading(line: str):
    normalized_line = normalize_heading(line)

    if not normalized_line:
        return None

    for section_name, aliases in SECTION_ALIASES.items():
        if normalized_line in aliases:
            return section_name

    return None


def detect_resume_sections(text: str) -> dict:
    sections = {
        "summary": "",
        "skills": "",
        "education": "",
        "experience": "",
        "projects": "",
        "certifications": "",
        "achievements": "",
        "other": "",
    }

    current_section = "other"

    lines = text.splitlines()

    for line in lines:
        clean_line = line.strip()

        if not clean_line:
            continue

        detected_section = identify_section_heading(clean_line)

        if detected_section:
            current_section = detected_section
            continue

        sections[current_section] += clean_line + "\n"

    for section_name in sections:
        sections[section_name] = sections[section_name].strip()

    return sections