import re


def clean_achievement_line(line: str) -> str:
    line = line.strip()

    line = re.sub(
        r"^[•●▪■\-*]+\s*",
        "",
        line
    )

    return line.strip()


def extract_achievements(
    achievement_text: str
) -> list[str]:

    if not achievement_text.strip():
        return []

    achievements = []

    for line in achievement_text.splitlines():

        clean_line = clean_achievement_line(
            line
        )

        if not clean_line:
            continue

        if clean_line.lower() in {
            "achievement",
            "achievements",
            "award",
            "awards",
            "honor",
            "honors",
        }:
            continue

        if clean_line not in achievements:
            achievements.append(
                clean_line
            )

    return achievements