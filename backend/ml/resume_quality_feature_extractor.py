import re
from typing import Dict, Any


# =========================================================
# ResumeIQ - Resume Quality Feature Extractor
# =========================================================

MODEL_FEATURES = [
    "years_college",
    "college_degree",
    "honors",
    "worked_during_school",
    "years_experience",
    "computer_skills",
    "special_skills",
    "volunteer",
    "employment_holes",
    "has_email_address",
]


# =========================================================
# Keyword Lists
# =========================================================

DEGREE_KEYWORDS = [
    # Bachelor
    "bachelor",
    "bachelors",
    "bachelor's",
    "b.tech",
    "btech",
    "b.e",
    "b.sc",
    "bsc",
    "bca",
    "b.com",
    "bcom",

    # Master
    "master",
    "masters",
    "master's",
    "m.tech",
    "mtech",
    "m.sc",
    "msc",
    "mca",
    "mba",
    "m.com",
    "mcom",

    # Doctorate
    "phd",
    "ph.d",
    "doctorate",
]


DIPLOMA_KEYWORDS = [
    "diploma",
    "polytechnic",
    "associate degree",
]


COLLEGE_KEYWORDS = [
    "college",
    "university",
    "institute of technology",
]


HONOR_KEYWORDS = [
    "honors",
    "honours",
    "distinction",
    "gold medal",
    "gold medalist",
    "dean's list",
    "deans list",
    "merit award",
    "academic award",
    "academic excellence",
    "cum laude",
    "scholarship",
]


WORKED_DURING_SCHOOL_KEYWORDS = [
    "internship",
    "intern ",
    "intern at",
    "internship at",
    "trainee",
    "apprentice",
    "apprenticeship",
    "part time",
    "part-time",
    "campus ambassador",
    "student assistant",
    "student developer",
]


COMPUTER_SKILL_KEYWORDS = [
    # Programming
    "python",
    "java",
    "javascript",
    "typescript",
    "c++",
    "c#",
    "php",
    "ruby",
    "golang",
    "kotlin",
    "swift",
    "r programming",

    # Web
    "html",
    "css",
    "bootstrap",
    "react",
    "reactjs",
    "angular",
    "vue",
    "node.js",
    "nodejs",
    "express",
    "django",
    "flask",
    "fastapi",

    # Database
    "sql",
    "mysql",
    "postgresql",
    "postgres",
    "mongodb",
    "oracle",
    "sqlite",
    "redis",

    # Data / AI / ML
    "machine learning",
    "deep learning",
    "data science",
    "data analysis",
    "data analytics",
    "pandas",
    "numpy",
    "scikit-learn",
    "sklearn",
    "tensorflow",
    "pytorch",
    "keras",
    "matplotlib",
    "tableau",
    "power bi",
    "powerbi",
    "excel",

    # Cloud / DevOps
    "aws",
    "azure",
    "google cloud",
    "gcp",
    "docker",
    "kubernetes",
    "github",
    "gitlab",
    "linux",

    # Design
    "figma",
    "photoshop",
    "illustrator",
    "adobe xd",
    "after effects",
    "indesign",
]


SPECIAL_SKILL_KEYWORDS = [
    "leadership",
    "communication",
    "teamwork",
    "problem solving",
    "problem-solving",
    "critical thinking",
    "analytical skills",
    "analytical thinking",
    "project management",
    "time management",
    "presentation skills",
    "negotiation",
    "decision making",
    "decision-making",
    "creativity",
    "research",
    "strategic planning",
    "collaboration",
    "adaptability",
]


# IMPORTANT:
# Keep volunteer detection strict.
# Do not use generic terms like:
# community service, social work, social service
VOLUNTEER_KEYWORDS = [
    "volunteer experience",
    "volunteering experience",
    "volunteer work",
    "volunteer at",
    "volunteered at",
    "volunteered for",
    "volunteering",
    "voluntary work",
    "ngo volunteer",
]


EMPLOYMENT_GAP_KEYWORDS = [
    "career break",
    "career gap",
    "employment gap",
    "work gap",
    "sabbatical",
    "career pause",
]


# =========================================================
# Helper Functions
# =========================================================

def normalize_text(text: str) -> str:
    """
    Convert resume text to lowercase and normalize
    whitespace for keyword matching.
    """

    if not text:
        return ""

    text = text.lower()

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


def contains_keyword(
    text: str,
    keywords: list[str]
) -> bool:
    """
    Returns True when any keyword appears in text.
    """

    return any(
        keyword in text
        for keyword in keywords
    )


# =========================================================
# Email Address
# =========================================================

def extract_has_email_address(
    text: str
) -> int:

    email_pattern = (
        r"\b[A-Za-z0-9._%+-]+"
        r"@[A-Za-z0-9.-]+"
        r"\.[A-Za-z]{2,}\b"
    )

    match = re.search(
        email_pattern,
        text
    )

    return 1 if match else 0


# =========================================================
# College Degree
# =========================================================

def extract_college_degree(
    normalized_text: str
) -> int:

    if contains_keyword(
        normalized_text,
        DEGREE_KEYWORDS
    ):
        return 1

    return 0


# =========================================================
# Years College
# =========================================================

def extract_years_college(
    normalized_text: str
) -> int:
    """
    The training dataset represents years_college
    approximately in the 0-4 range.

    This is an estimated educational-level feature,
    not the candidate's literal number of college years.
    """

    # Degree detected
    if contains_keyword(
        normalized_text,
        DEGREE_KEYWORDS
    ):
        return 4

    # Diploma / Polytechnic
    if contains_keyword(
        normalized_text,
        DIPLOMA_KEYWORDS
    ):
        return 2

    # College / university mentioned
    if contains_keyword(
        normalized_text,
        COLLEGE_KEYWORDS
    ):
        return 1

    return 0


# =========================================================
# Honors
# =========================================================

def extract_honors(
    normalized_text: str
) -> int:

    if contains_keyword(
        normalized_text,
        HONOR_KEYWORDS
    ):
        return 1

    return 0


# =========================================================
# Worked During School
# =========================================================

def extract_worked_during_school(
    normalized_text: str
) -> int:
    """
    Detects explicit internship / student-work evidence.

    This does not prove the work happened during college,
    but provides the closest resume-text signal for the
    feature available in the training dataset.
    """

    if contains_keyword(
        normalized_text,
        WORKED_DURING_SCHOOL_KEYWORDS
    ):
        return 1

    return 0


# =========================================================
# Years Experience
# =========================================================

def extract_years_experience(
    normalized_text: str
) -> int:
    """
    Extract professional experience only when explicitly
    written in the resume.

    IMPORTANT:
    Date ranges such as:

        2022 - 2025
        2025 - 2027

    are NOT used here because they can belong to education,
    projects, certifications, etc.

    Supported examples:

        3 years of experience
        5+ years experience
        experience of 4 years
        2 yrs of experience
    """

    patterns = [
        r"\b(\d{1,2})\+?\s*years?\s+of\s+(?:professional\s+|work\s+)?experience\b",

        r"\b(\d{1,2})\+?\s*years?\s+(?:professional\s+|work\s+)?experience\b",

        r"\bexperience\s+of\s+(\d{1,2})\+?\s*years?\b",

        r"\b(\d{1,2})\+?\s*yrs?\s+of\s+(?:professional\s+|work\s+)?experience\b",

        r"\b(\d{1,2})\+?\s*yrs?\s+(?:professional\s+|work\s+)?experience\b",

        r"\bover\s+(\d{1,2})\s*years?\s+of\s+experience\b",

        r"\bmore\s+than\s+(\d{1,2})\s*years?\s+of\s+experience\b",
    ]


    detected_years = []


    for pattern in patterns:

        matches = re.findall(
            pattern,
            normalized_text,
            flags=re.IGNORECASE
        )


        for match in matches:

            try:

                years = int(
                    match
                )


                # Same broad range as training data
                if 0 <= years <= 44:

                    detected_years.append(
                        years
                    )

            except (
                ValueError,
                TypeError
            ):

                continue


    if detected_years:

        return max(
            detected_years
        )


    # Explicit fresher means 0 experience
    fresher_patterns = [
        r"\bfresher\b",
        r"\bno professional experience\b",
        r"\bno work experience\b",
    ]


    for pattern in fresher_patterns:

        if re.search(
            pattern,
            normalized_text,
            flags=re.IGNORECASE
        ):

            return 0


    # Do NOT infer experience from generic date ranges
    return 0


# =========================================================
# Computer Skills
# =========================================================

def extract_computer_skills(
    normalized_text: str
) -> int:

    if contains_keyword(
        normalized_text,
        COMPUTER_SKILL_KEYWORDS
    ):
        return 1

    return 0


# =========================================================
# Special / Soft Skills
# =========================================================

def extract_special_skills(
    normalized_text: str
) -> int:

    section_keywords = [
        "soft skills",
        "special skills",
        "core competencies",
        "competencies",
    ]


    if contains_keyword(
        normalized_text,
        section_keywords
    ):
        return 1


    if contains_keyword(
        normalized_text,
        SPECIAL_SKILL_KEYWORDS
    ):
        return 1


    return 0


# =========================================================
# Volunteer Experience
# =========================================================

def extract_volunteer(
    normalized_text: str
) -> int:
    """
    Conservative volunteer detection.

    Generic phrases such as:
        social work
        community service
        ngo

    alone are intentionally not enough.
    """

    if contains_keyword(
        normalized_text,
        VOLUNTEER_KEYWORDS
    ):
        return 1

    return 0


# =========================================================
# Employment Gaps
# =========================================================

def extract_employment_holes(
    normalized_text: str
) -> int:
    """
    Mark employment gap only when explicitly mentioned.

    Missing dates are NOT treated as an employment gap.
    """

    if contains_keyword(
        normalized_text,
        EMPLOYMENT_GAP_KEYWORDS
    ):
        return 1

    return 0


# =========================================================
# Main Feature Extractor
# =========================================================

def extract_resume_quality_features(
    resume_text: str
) -> Dict[str, int]:

    if not resume_text:
        raise ValueError(
            "Resume text cannot be empty."
        )


    normalized_text = normalize_text(
        resume_text
    )


    features = {

        "years_college":
            extract_years_college(
                normalized_text
            ),

        "college_degree":
            extract_college_degree(
                normalized_text
            ),

        "honors":
            extract_honors(
                normalized_text
            ),

        "worked_during_school":
            extract_worked_during_school(
                normalized_text
            ),

        "years_experience":
            extract_years_experience(
                normalized_text
            ),

        "computer_skills":
            extract_computer_skills(
                normalized_text
            ),

        "special_skills":
            extract_special_skills(
                normalized_text
            ),

        "volunteer":
            extract_volunteer(
                normalized_text
            ),

        "employment_holes":
            extract_employment_holes(
                normalized_text
            ),

        "has_email_address":
            extract_has_email_address(
                resume_text
            ),
    }


    return features


# =========================================================
# Features + Human-Readable Explanations
# =========================================================

def extract_resume_quality_features_with_details(
    resume_text: str
) -> Dict[str, Any]:

    features = (
        extract_resume_quality_features(
            resume_text
        )
    )


    explanations = {

        "years_college":
            (
                "Estimated education-level value: "
                f"{features['years_college']}"
            ),

        "college_degree":
            (
                "College degree detected"
                if features["college_degree"]
                else
                "College degree not clearly detected"
            ),

        "honors":
            (
                "Academic honors or achievements detected"
                if features["honors"]
                else
                "No explicit academic honors detected"
            ),

        "worked_during_school":
            (
                "Internship or student-work evidence detected"
                if features["worked_during_school"]
                else
                "No clear internship or student-work evidence detected"
            ),

        "years_experience":
            (
                "Explicit professional experience detected: "
                f"{features['years_experience']} years"
                if features["years_experience"] > 0
                else
                "No explicit number of professional experience years detected"
            ),

        "computer_skills":
            (
                "Technical/computer skills detected"
                if features["computer_skills"]
                else
                "Technical/computer skills not clearly detected"
            ),

        "special_skills":
            (
                "Special or soft skills detected"
                if features["special_skills"]
                else
                "Special/soft skills not clearly detected"
            ),

        "volunteer":
            (
                "Explicit volunteer experience detected"
                if features["volunteer"]
                else
                "No explicit volunteer experience detected"
            ),

        "employment_holes":
            (
                "Employment gap explicitly mentioned"
                if features["employment_holes"]
                else
                "No explicit employment gap detected"
            ),

        "has_email_address":
            (
                "Email address detected"
                if features["has_email_address"]
                else
                "Email address not detected"
            ),
    }


    return {
        "features":
            features,

        "explanations":
            explanations,
    }