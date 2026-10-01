import re

from backend.nlp.skill_extractor import extract_skills_from_text


GENERIC_PROJECT_LABELS = {
    "project",
    "projects",
    "project details",
    "project description",
    "project working",
    "technology",
    "technologies",
    "technology used",
    "technologies used",
    "tech stack",
    "tools",
    "tools used",
    "environment",
}


DESCRIPTION_STARTERS = {
    "developed",
    "implemented",
    "designed",
    "built",
    "created",
    "performed",
    "used",
    "uses",
    "worked",
    "added",
    "monitored",
    "monitors",
    "provides",
    "analyzed",
    "analysed",
    "identified",
    "generated",
    "integrated",
    "managed",
}


def clean_project_line(line: str) -> str:
    line = line.strip()

    # Remove bullet symbols
    line = re.sub(
        r"^[•●▪■\-*]+\s*",
        "",
        line
    )

    return line.strip()


def normalize_text(text: str) -> str:
    # Remove unnecessary multiple spaces
    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


def looks_like_technology_list(line: str) -> bool:
    normalized_line = normalize_text(line)

    skills = extract_skills_from_text(
        normalized_line
    )

    comma_count = normalized_line.count(",")

    # Example:
    # Python, Pandas, NumPy, Matplotlib
    if comma_count >= 2 and len(skills) >= 2:
        return True

    if len(skills) >= 3:
        return True

    return False


def is_generic_label(line: str) -> bool:
    return (
        line.strip().lower()
        in GENERIC_PROJECT_LABELS
    )


def is_project_title(line: str) -> bool:
    clean_line = clean_project_line(line)

    if not clean_line:
        return False

    lower_line = clean_line.lower()

    # Generic labels should not become project titles
    if lower_line in GENERIC_PROJECT_LABELS:
        return False

    # Description sentence
    if clean_line.endswith(
        (".", ",", ";", ":")
    ):
        return False

    # Project title normally short
    if len(clean_line) > 90:
        return False

    words = clean_line.split()

    if not (1 <= len(words) <= 9):
        return False

    # Lowercase first letter usually means
    # continuation of previous PDF line
    if clean_line[0].islower():
        return False

    first_word = re.sub(
        r"[^A-Za-z]",
        "",
        words[0]
    ).lower()

    # Description starters should not become titles
    if first_word in DESCRIPTION_STARTERS:
        return False

    # Technology lists should not become project titles
    if looks_like_technology_list(
        clean_line
    ):
        return False

    ignored_words = {
        "and",
        "or",
        "of",
        "for",
        "with",
        "using",
        "in",
        "on",
        "the",
        "a",
        "an",
        "&",
    }

    meaningful_words = []

    for word in words:
        cleaned_word = re.sub(
            r"[^A-Za-z0-9+]",
            "",
            word
        )

        if not cleaned_word:
            continue

        if (
            cleaned_word.lower()
            in ignored_words
        ):
            continue

        meaningful_words.append(
            cleaned_word
        )

    if not meaningful_words:
        return False

    title_like_words = 0

    for word in meaningful_words:
        if (
            word[0].isupper()
            or word.isupper()
            or any(
                char.isupper()
                for char in word[1:]
            )
        ):
            title_like_words += 1

    title_ratio = (
        title_like_words
        / len(meaningful_words)
    )

    return title_ratio >= 0.60


def merge_wrapped_lines(
    lines: list[str]
) -> list[str]:

    merged_lines = []

    buffer = ""

    for raw_line in lines:
        line = clean_project_line(
            raw_line
        )

        if not line:
            continue

        # Generic labels must stay separate
        if is_generic_label(line):

            if buffer:
                merged_lines.append(
                    normalize_text(buffer)
                )

                buffer = ""

            merged_lines.append(line)

            continue

        if not buffer:
            buffer = line

        else:
            # Fix PDF word split:
            #
            # Scikit-
            # learn
            #
            # becomes:
            # Scikit-learn
            if buffer.endswith("-"):
                buffer = (
                    buffer
                    + line
                )

            else:
                buffer += (
                    " " + line
                )

        # Logical sentence/block completed
        if re.search(
            r"[.!?]$",
            buffer
        ):
            merged_lines.append(
                normalize_text(buffer)
            )

            buffer = ""

    if buffer:
        merged_lines.append(
            normalize_text(buffer)
        )

    return merged_lines


def analyze_project_content(
    lines: list[str]
) -> dict:

    logical_lines = merge_wrapped_lines(
        lines
    )

    description_lines = []

    tech_blocks = []

    leading_tech_blocks = []

    narrative_started = False

    technology_mode = False

    for line in logical_lines:

        # Handle labels like:
        # Project Working
        # Technologies Used
        # Tech Stack
        if is_generic_label(line):

            if line.lower() in {
                "technology",
                "technologies",
                "technology used",
                "technologies used",
                "tech stack",
                "tools",
                "tools used",
                "environment",
                "project working",
            }:
                technology_mode = True

            continue

        first_word = re.sub(
            r"[^A-Za-z]",
            "",
            line.split()[0]
        ).lower()

        # Important:
        # Narrative sentences may contain technologies.
        #
        # Example:
        # Uses Isolation Forest for anomaly detection...
        #
        # It should remain in description AND
        # its technologies should also be detected.
        if (
            first_word
            in DESCRIPTION_STARTERS
        ):
            narrative_started = True
            technology_mode = False

            description_lines.append(
                line
            )

            detected_skills = (
                extract_skills_from_text(
                    line
                )
            )

            if detected_skills:
                tech_blocks.append(
                    line
                )

            continue

        # Technology-only line
        if looks_like_technology_list(
            line
        ):
            tech_blocks.append(
                line
            )

            # Technology lines appearing before
            # project narrative are tracked separately.
            if not narrative_started:
                leading_tech_blocks.append(
                    line
                )

            continue

        # After a heading like Project Working,
        # check whether the next line contains skills.
        if technology_mode:

            detected_skills = (
                extract_skills_from_text(
                    line
                )
            )

            if detected_skills:
                tech_blocks.append(
                    line
                )

                continue

        # Normal project description
        narrative_started = True
        technology_mode = False

        description_lines.append(
            line
        )

    return {
        "description": normalize_text(
            " ".join(
                description_lines
            )
        ),

        "tech_blocks": tech_blocks,

        "leading_tech_blocks":
            leading_tech_blocks,
    }


def extract_project_technologies(
    title: str,
    tech_blocks: list[str],
    description: str
) -> list[str]:

    combined_text = " ".join(
        [
            title,
            *tech_blocks,
            description,
        ]
    )

    return extract_skills_from_text(
        normalize_text(
            combined_text
        )
    )


def extract_projects(
    projects_text: str
) -> list[dict]:

    if not projects_text:
        return []

    raw_lines = [
        clean_project_line(line)
        for line
        in projects_text.splitlines()
        if clean_project_line(line)
    ]

    project_segments = []

    current_project = None

    # ---------------------------------
    # Step 1:
    # Detect individual project blocks
    # ---------------------------------

    for line in raw_lines:

        if is_project_title(line):

            if current_project:
                project_segments.append(
                    current_project
                )

            current_project = {
                "title": line,
                "lines": [],
            }

        else:
            if current_project:
                current_project[
                    "lines"
                ].append(
                    line
                )

    if current_project:
        project_segments.append(
            current_project
        )

    # ---------------------------------
    # Step 2:
    # Analyze each project block
    # ---------------------------------

    projects = []

    for segment in project_segments:

        analyzed = (
            analyze_project_content(
                segment["lines"]
            )
        )

        projects.append(
            {
                "title":
                    segment["title"],

                "description":
                    analyzed[
                        "description"
                    ],

                "_tech_blocks":
                    analyzed[
                        "tech_blocks"
                    ],

                "_leading_tech_blocks":
                    analyzed[
                        "leading_tech_blocks"
                    ],
            }
        )

    # ---------------------------------
    # Step 3:
    # Handle PDF reading-order issue
    # ---------------------------------
    #
    # Sometimes PDF extraction gives:
    #
    # Project A
    # Project A description
    #
    # Project B
    # Project A technologies
    # Project B technologies
    # Project B description
    #
    # If current project begins with
    # multiple technology blocks and
    # previous project has no technology,
    # move first technology block to
    # previous project.
    # ---------------------------------

    for index in range(
        1,
        len(projects)
    ):

        previous_project = (
            projects[index - 1]
        )

        current_project = (
            projects[index]
        )

        leading_blocks = (
            current_project[
                "_leading_tech_blocks"
            ]
        )

        previous_blocks = (
            previous_project[
                "_tech_blocks"
            ]
        )

        if (
            len(leading_blocks) >= 2
            and len(previous_blocks) == 0
        ):

            block_to_move = (
                leading_blocks[0]
            )

            previous_project[
                "_tech_blocks"
            ].append(
                block_to_move
            )

            if (
                block_to_move
                in current_project[
                    "_tech_blocks"
                ]
            ):
                current_project[
                    "_tech_blocks"
                ].remove(
                    block_to_move
                )

    # ---------------------------------
    # Step 4:
    # Create clean final output
    # ---------------------------------

    final_projects = []

    for project in projects:

        technologies = (
            extract_project_technologies(
                project["title"],
                project[
                    "_tech_blocks"
                ],
                project[
                    "description"
                ],
            )
        )

        final_projects.append(
            {
                "title":
                    project["title"],

                "description":
                    project[
                        "description"
                    ],

                "technologies":
                    technologies,
            }
        )

    return final_projects