import re

from backend.nlp.skill_normalizer import (
    SKILL_ALIASES,
    normalize_skills,
)


def build_skill_pattern(skill_alias: str) -> str:
    alias = skill_alias.lower()

    # Special handling for single-letter C.
    # Prevents false matches inside H.S.C., S.S.C., etc.
    if alias == "c":
        return r"(?<![\w.])c(?![\w+#])"

    return rf"(?<!\w){re.escape(alias)}(?!\w)"


def extract_skills_from_text(text: str) -> list[str]:
    if not text:
        return []

    text_lower = text.lower()

    detected_skills = []

    aliases_sorted = sorted(
        SKILL_ALIASES.keys(),
        key=len,
        reverse=True
    )

    for skill_alias in aliases_sorted:
        pattern = build_skill_pattern(skill_alias)

        if re.search(pattern, text_lower):
            detected_skills.append(skill_alias)

    normalized_skills = normalize_skills(detected_skills)

    # Avoid counting Random Forest twice when
    # Random Forest Regressor is explicitly present.
    if (
        "Random Forest Regressor" in normalized_skills
        and "Random Forest" in normalized_skills
    ):
        normalized_skills.remove("Random Forest")

    return normalized_skills


def extract_skills_with_evidence(
    full_text: str,
    sections: dict
) -> list[dict]:

    detected_skills = extract_skills_from_text(full_text)

    skill_evidence = []

    evidence_sections = [
        "skills",
        "projects",
        "experience",
        "summary",
        "education",
        "certifications",
    ]

    for skill in detected_skills:
        found_in = []

        skill_aliases = [
            alias
            for alias, canonical in SKILL_ALIASES.items()
            if canonical.lower() == skill.lower()
        ]

        for section_name in evidence_sections:
            section_text = sections.get(
                section_name,
                ""
            ).lower()

            if not section_text:
                continue

            for alias in skill_aliases:
                pattern = build_skill_pattern(alias)

                if re.search(pattern, section_text):
                    found_in.append(section_name)
                    break

        skill_evidence.append({
            "skill": skill,
            "found_in": found_in,
            "evidence_count": len(found_in)
        })

    return skill_evidence