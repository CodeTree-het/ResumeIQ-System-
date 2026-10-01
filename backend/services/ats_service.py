import re


# ==========================================
# ATS Configuration
# ==========================================

ATS_MAX_SCORE = 100

RULE_BASED_WEIGHT = 0.70
ML_MODEL_WEIGHT = 0.30


# ==========================================
# Section Score
# Maximum: 20
# ==========================================

def calculate_section_score(
    analysis: dict
) -> tuple[float, list[str]]:

    presence = analysis.get(
        "section_presence",
        {}
    )

    section_weights = {
        "summary": 4,
        "skills": 4,
        "education": 4,
        "experience": 3,
        "projects": 3,
        "certifications": 1,
        "achievements": 1,
    }

    score = 0
    missing_sections = []

    for section, weight in section_weights.items():

        if presence.get(
            section,
            False
        ):
            score += weight

        else:
            missing_sections.append(
                section
            )

    return score, missing_sections


# ==========================================
# Skills Score
# Maximum: 20
# ==========================================

def calculate_skill_score(
    analysis: dict
) -> float:

    skills = analysis.get(
        "skills",
        []
    )

    total_skills = len(
        skills
    )

    if total_skills >= 15:
        return 20

    if total_skills >= 10:
        return 17

    if total_skills >= 6:
        return 14

    if total_skills >= 3:
        return 9

    if total_skills >= 1:
        return 5

    return 0


# ==========================================
# Education Score
# Maximum: 10
# ==========================================

def calculate_education_score(
    analysis: dict
) -> float:

    education = analysis.get(
        "education",
        {}
    )

    score = 0

    degrees = education.get(
        "degrees",
        []
    )

    institutions = education.get(
        "institutions",
        []
    )

    year_ranges = education.get(
        "year_ranges",
        []
    )

    cgpa = education.get(
        "cgpa",
        []
    )

    percentages = education.get(
        "percentages",
        []
    )

    if degrees:
        score += 4

    if institutions:
        score += 3

    if year_ranges:
        score += 2

    if cgpa or percentages:
        score += 1

    return min(
        score,
        10
    )


# ==========================================
# Experience Score
# Maximum: 15
# ==========================================

def calculate_experience_score(
    analysis: dict
) -> float:

    experience = analysis.get(
        "experience",
        {}
    )

    if not experience.get(
        "has_experience",
        False
    ):
        return 0

    score = 5

    if experience.get(
        "roles"
    ):
        score += 4

    if experience.get(
        "date_ranges"
    ):
        score += 3

    raw_text = experience.get(
        "raw_text",
        ""
    )

    word_count = len(
        raw_text.split()
    )

    if word_count >= 30:
        score += 3

    elif word_count >= 10:
        score += 2

    return min(
        score,
        15
    )


# ==========================================
# Project Score
# Maximum: 15
# ==========================================

def calculate_project_score(
    analysis: dict
) -> float:

    projects = analysis.get(
        "projects",
        []
    )

    if not projects:
        return 0

    score = 0

    project_count = len(
        projects
    )

    if project_count >= 3:
        score += 9

    elif project_count == 2:
        score += 7

    else:
        score += 5

    projects_with_description = 0
    projects_with_technology = 0

    for project in projects:

        description = project.get(
            "description",
            ""
        )

        technologies = project.get(
            "technologies",
            []
        )

        description_word_count = len(
            description.split()
        )

        if description_word_count >= 15:
            projects_with_description += 1

        if technologies:
            projects_with_technology += 1

    if projects_with_description >= 2:
        score += 3

    elif projects_with_description == 1:
        score += 2

    if projects_with_technology >= 2:
        score += 3

    elif projects_with_technology == 1:
        score += 2

    return min(
        score,
        15
    )


# ==========================================
# Achievement Score
# Maximum: 5
# ==========================================

def calculate_achievement_score(
    analysis: dict
) -> float:

    achievements = analysis.get(
        "achievements",
        []
    )

    if not achievements:
        return 0

    if len(achievements) >= 2:
        return 5

    return 4


# ==========================================
# Certification Score
# Maximum: 5
# ==========================================

def calculate_certification_score(
    analysis: dict
) -> float:

    certifications = analysis.get(
        "certifications",
        []
    )

    if not certifications:
        return 0

    if len(certifications) >= 2:
        return 5

    return 4


# ==========================================
# Content / Keyword Score
# Maximum: 10
# ==========================================

def calculate_content_score(
    analysis: dict,
    resume_text: str
) -> tuple[float, dict]:

    score = 0

    words = resume_text.split()

    word_count = len(
        words
    )


    # --------------------------------------
    # Resume Length
    # Maximum: 3
    # --------------------------------------

    if 250 <= word_count <= 1000:
        score += 3

    elif 150 <= word_count < 250:
        score += 2

    elif word_count > 1000:
        score += 2

    elif word_count >= 80:
        score += 1


    # --------------------------------------
    # Action Verbs
    # Maximum: 2
    # --------------------------------------

    action_verbs = [
        "developed",
        "implemented",
        "designed",
        "created",
        "built",
        "managed",
        "analyzed",
        "analysed",
        "improved",
        "optimized",
        "automated",
        "integrated",
        "led",
        "delivered",
        "performed",
    ]

    lower_text = resume_text.lower()

    action_verb_count = 0

    for verb in action_verbs:

        if re.search(
            rf"\b{re.escape(verb)}\b",
            lower_text
        ):
            action_verb_count += 1

    if action_verb_count >= 5:
        score += 2

    elif action_verb_count >= 2:
        score += 1


    # --------------------------------------
    # Quantifiable Information
    # Maximum: 2
    # --------------------------------------

    metric_patterns = [

        # 25%, 15.5%
        r"\b\d+(?:\.\d+)?\s*%",

        # ₹50000, $5000
        r"(?:₹|\$|€|£)\s*"
        r"\d+(?:,\d{3})*(?:\.\d+)?",

        # 10K, 2M
        r"\b\d+(?:\.\d+)?\s*[KkMm]\b",

        # 50 users, 10+ clients, etc.
        r"\b\d+(?:\.\d+)?\+?\s+"
        r"(?:users|clients|customers|projects|"
        r"employees|records|reports|dashboards|"
        r"applications|models|campaigns|"
        r"candidates)\b",
    ]

    metric_matches = []

    for pattern in metric_patterns:

        matches = re.findall(
            pattern,
            resume_text,
            re.IGNORECASE
        )

        metric_matches.extend(
            matches
        )

    metric_count = len(
        metric_matches
    )

    if metric_count >= 4:
        score += 2

    elif metric_count >= 1:
        score += 1


    # --------------------------------------
    # Skill Keywords
    # Maximum: 2
    # --------------------------------------

    total_skills = len(
        analysis.get(
            "skills",
            []
        )
    )

    if total_skills >= 8:
        score += 2

    elif total_skills >= 4:
        score += 1


    # --------------------------------------
    # Summary Quality
    # Maximum: 1
    # --------------------------------------

    summary = analysis.get(
        "summary",
        ""
    )

    summary_word_count = len(
        summary.split()
    )

    if summary_word_count >= 25:
        score += 1


    return (
        min(
            score,
            10
        ),
        {
            "word_count":
                word_count,

            "action_verbs_found":
                action_verb_count,

            "numeric_values_found":
                metric_count,

            "skills_found":
                total_skills,

            "summary_word_count":
                summary_word_count,
        }
    )


# ==========================================
# Score Rating
# ==========================================

def get_score_rating(
    total_score: float
) -> str:

    if total_score >= 85:
        return "Excellent"

    if total_score >= 70:
        return "Good"

    if total_score >= 55:
        return "Fair"

    return "Needs Improvement"


# ==========================================
# Recommendations
# ==========================================

def build_recommendations(
    breakdown: dict,
    missing_sections: list[str]
) -> list[str]:

    recommendations = []


    if missing_sections:

        readable_sections = ", ".join(
            section.title()
            for section in missing_sections
        )

        recommendations.append(
            "Consider adding or improving these resume "
            f"sections: {readable_sections}."
        )


    if breakdown["skills"] < 14:

        recommendations.append(
            "Add clearly relevant technical or professional "
            "skills supported by resume evidence."
        )


    if breakdown["education"] < 7:

        recommendations.append(
            "Make education details clearer with degree, "
            "institution and study dates."
        )


    if breakdown["experience"] < 8:

        recommendations.append(
            "Add relevant work, internship or practical "
            "experience when available."
        )


    if breakdown["projects"] < 10:

        recommendations.append(
            "Describe relevant projects with technologies, "
            "responsibilities and outcomes."
        )


    if breakdown["achievements"] == 0:

        recommendations.append(
            "Add measurable achievements or awards when "
            "applicable."
        )


    if breakdown["certifications"] == 0:

        recommendations.append(
            "Add relevant certifications when applicable."
        )


    if breakdown["content_keywords"] < 7:

        recommendations.append(
            "Improve resume content using clear action verbs, "
            "relevant keywords and measurable results."
        )


    return recommendations


# ==========================================
# RULE-BASED ATS SCORE
#
# Explainable ATS component.
# Maximum: 100
# ==========================================

def calculate_ats_score(
    analysis: dict,
    resume_text: str
) -> dict:

    # --------------------------------------
    # Sections
    # --------------------------------------

    section_score, missing_sections = (
        calculate_section_score(
            analysis
        )
    )


    # --------------------------------------
    # Skills
    # --------------------------------------

    skill_score = calculate_skill_score(
        analysis
    )


    # --------------------------------------
    # Education
    # --------------------------------------

    education_score = (
        calculate_education_score(
            analysis
        )
    )


    # --------------------------------------
    # Experience
    # --------------------------------------

    experience_score = (
        calculate_experience_score(
            analysis
        )
    )


    # --------------------------------------
    # Projects
    # --------------------------------------

    project_score = (
        calculate_project_score(
            analysis
        )
    )


    # --------------------------------------
    # Achievements
    # --------------------------------------

    achievement_score = (
        calculate_achievement_score(
            analysis
        )
    )


    # --------------------------------------
    # Certifications
    # --------------------------------------

    certification_score = (
        calculate_certification_score(
            analysis
        )
    )


    # --------------------------------------
    # Content / Keywords
    # --------------------------------------

    content_score, content_details = (
        calculate_content_score(
            analysis,
            resume_text
        )
    )


    # --------------------------------------
    # Breakdown
    # --------------------------------------

    breakdown = {

        "sections":
            section_score,

        "skills":
            skill_score,

        "education":
            education_score,

        "experience":
            experience_score,

        "projects":
            project_score,

        "achievements":
            achievement_score,

        "certifications":
            certification_score,

        "content_keywords":
            content_score,
    }


    # --------------------------------------
    # Rule Score
    # --------------------------------------

    total_score = round(
        sum(
            breakdown.values()
        ),
        2
    )


    total_score = min(
        total_score,
        ATS_MAX_SCORE
    )


    # --------------------------------------
    # Recommendations
    # --------------------------------------

    recommendations = (
        build_recommendations(
            breakdown,
            missing_sections
        )
    )


    return {

        "score":
            total_score,

        "max_score":
            ATS_MAX_SCORE,

        "rating":
            get_score_rating(
                total_score
            ),

        "breakdown":
            breakdown,

        "missing_sections":
            missing_sections,

        "content_details":
            content_details,

        "recommendations":
            recommendations,

        "scoring_method":
            "Explainable Rule-Based Resume Score",

        "disclaimer": (
            "This is ResumeIQ's explainable rule-based "
            "resume score and not an official or universal "
            "ATS vendor score."
        ),
    }


# ==========================================
# ML QUALITY SCORE NORMALIZER
#
# Converts Model 1 output into 0-100 score.
#
# IMPORTANT:
# High-quality probability is preferred.
# We DO NOT blindly use confidence because
# 98% confidence in LOW quality must not
# become a score of 98.
# ==========================================

def get_ml_quality_score(
    ml_resume_quality: dict | None
) -> float:

    if not ml_resume_quality:
        return 0.0


    # --------------------------------------
    # 1. Best source:
    # quality_probability_percent
    # --------------------------------------

    probability_percent = (
        ml_resume_quality.get(
            "quality_probability_percent"
        )
    )

    if probability_percent is not None:

        try:

            value = float(
                probability_percent
            )

            return round(
                max(
                    0.0,
                    min(
                        100.0,
                        value
                    )
                ),
                2
            )

        except (
            TypeError,
            ValueError
        ):
            pass


    # --------------------------------------
    # 2. High Quality Probability
    # --------------------------------------

    high_probability = (
        ml_resume_quality.get(
            "high_quality_probability"
        )
    )

    if high_probability is not None:

        try:

            value = float(
                high_probability
            )

            if 0 <= value <= 1:
                value *= 100

            return round(
                max(
                    0.0,
                    min(
                        100.0,
                        value
                    )
                ),
                2
            )

        except (
            TypeError,
            ValueError
        ):
            pass


    # --------------------------------------
    # 3. Fallback:
    # confidence + label
    # --------------------------------------

    confidence = (
        ml_resume_quality.get(
            "confidence"
        )
    )

    quality_label = str(
        ml_resume_quality.get(
            "quality_label",
            ""
        )
    ).strip().lower()


    if confidence is not None:

        try:

            confidence_value = float(
                confidence
            )

            if (
                0
                <= confidence_value
                <= 1
            ):
                confidence_value *= 100


            confidence_value = max(
                0.0,
                min(
                    100.0,
                    confidence_value
                )
            )


            if quality_label == "high":

                return round(
                    confidence_value,
                    2
                )


            if quality_label == "low":

                return round(
                    100
                    -
                    confidence_value,
                    2
                )


        except (
            TypeError,
            ValueError
        ):
            pass


    return 0.0


# ==========================================
# HYBRID ATS SCORE
#
# 70% Rule-Based Resume Score
# 30% Model 1 ML Quality Signal
#
# Final Output: 0-100
# ==========================================

def calculate_hybrid_ats_score(
    analysis: dict,
    resume_text: str,
    ml_resume_quality: dict | None,
    rule_weight: float = RULE_BASED_WEIGHT,
    ml_weight: float = ML_MODEL_WEIGHT
) -> dict:

    # --------------------------------------
    # Validate weights
    # --------------------------------------

    if (
        rule_weight < 0
        or
        ml_weight < 0
    ):

        raise ValueError(
            "ATS scoring weights cannot be negative."
        )


    weight_total = (
        rule_weight
        +
        ml_weight
    )


    if weight_total <= 0:

        raise ValueError(
            "ATS scoring weights must have a positive total."
        )


    # Normalize weights if changed later

    normalized_rule_weight = (
        rule_weight
        /
        weight_total
    )

    normalized_ml_weight = (
        ml_weight
        /
        weight_total
    )


    # --------------------------------------
    # Rule-Based Component
    # --------------------------------------

    rule_result = (
        calculate_ats_score(
            analysis,
            resume_text
        )
    )


    rule_score = float(
        rule_result.get(
            "score",
            0
        )
    )


    # --------------------------------------
    # ML Component
    # --------------------------------------

    ml_quality_score = (
        get_ml_quality_score(
            ml_resume_quality
        )
    )


    # --------------------------------------
    # Hybrid Final Score
    # --------------------------------------

    rule_contribution = (
        rule_score
        *
        normalized_rule_weight
    )


    ml_contribution = (
        ml_quality_score
        *
        normalized_ml_weight
    )


    hybrid_score = round(
        rule_contribution
        +
        ml_contribution,
        2
    )


    hybrid_score = max(
        0.0,
        min(
            float(
                ATS_MAX_SCORE
            ),
            hybrid_score
        )
    )


    # --------------------------------------
    # Result
    # --------------------------------------

    return {

        # Main score used by frontend

        "total_score":
            hybrid_score,

        "score":
            hybrid_score,

        "percentage":
            hybrid_score,

        "ats_readiness":
            hybrid_score,

        "max_score":
            ATS_MAX_SCORE,


        # Rating

        "rating":
            get_score_rating(
                hybrid_score
            ),


        # Method

        "scoring_method":
            "Hybrid ATS Scoring",


        # Individual scores

        "rule_score":
            round(
                rule_score,
                2
            ),

        "ml_quality_score":
            round(
                ml_quality_score,
                2
            ),


        # Weights

        "weights": {

            "rule_based":
                round(
                    normalized_rule_weight,
                    2
                ),

            "ml_model":
                round(
                    normalized_ml_weight,
                    2
                ),
        },


        # Contribution to final score

        "contributions": {

            "rule_based":
                round(
                    rule_contribution,
                    2
                ),

            "ml_model":
                round(
                    ml_contribution,
                    2
                ),
        },


        # Explainable rule breakdown

        "breakdown":
            rule_result.get(
                "breakdown",
                {}
            ),


        # Missing resume sections

        "missing_sections":
            rule_result.get(
                "missing_sections",
                []
            ),


        # Content information

        "content_details":
            rule_result.get(
                "content_details",
                {}
            ),


        # Recommendations

        "recommendations":
            rule_result.get(
                "recommendations",
                []
            ),


        # Description

        "explanation": (
            "The final ResumeIQ ATS Readiness Score combines "
            "70% explainable resume-quality rules with 30% "
            "Machine Learning resume-quality prediction."
        ),


        # Academic / product transparency

        "disclaimer": (
            "ResumeIQ ATS Readiness is a hybrid internal score "
            "for resume evaluation. It does not represent an "
            "official score from any specific commercial ATS vendor."
        ),
    }


# ==========================================
# Save ATS Result
# ==========================================

async def save_ats_result(
    resume_id: str,
    candidate_id: str,
    ats_result: dict
) -> bool:

    from backend.database.mongodb import (
        database
    )


    resume_analyses_collection = database[
        "resume_analyses"
    ]


    result = (
        await
        resume_analyses_collection
        .update_one(
            {
                "resume_id":
                    resume_id,

                "candidate_id":
                    candidate_id,
            },
            {
                "$set": {

                    "ats_score":
                        ats_result
                }
            }
        )
    )


    return (
        result.matched_count > 0
    )