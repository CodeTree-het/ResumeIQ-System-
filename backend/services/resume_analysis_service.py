from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from backend.database.mongodb import database

from backend.nlp.section_detector import (
    detect_resume_sections,
)

from backend.nlp.skill_extractor import (
    extract_skills_with_evidence,
)

from backend.nlp.education_extractor import (
    extract_education,
)

from backend.nlp.experience_extractor import (
    extract_experience,
)

from backend.nlp.project_extractor import (
    extract_projects,
)

from backend.nlp.certification_extractor import (
    extract_certifications,
)

from backend.nlp.achievement_extractor import (
    extract_achievements,
)


# ==========================================
# ML Resume Quality Predictor
# ==========================================

from backend.ml.resume_analysis_predictor import (
    predict_resume_quality,
)


# ==========================================
# Hybrid ATS Scoring
# ==========================================

from backend.services.ats_service import (
    calculate_hybrid_ats_score,
)


# ==========================================
# MongoDB Collections
# ==========================================

resumes_collection = database[
    "resumes"
]

resume_analyses_collection = database[
    "resume_analyses"
]


# ==========================================
# Section Presence
# ==========================================

def build_section_presence(
    sections: dict
) -> dict:

    section_names = [
        "summary",
        "skills",
        "education",
        "experience",
        "projects",
        "certifications",
        "achievements",
    ]

    presence = {}

    for section_name in section_names:

        section_text = sections.get(
            section_name,
            ""
        )

        presence[
            section_name
        ] = bool(
            str(
                section_text
            ).strip()
        )

    return presence


# ==========================================
# Build Full Resume Analysis
# ==========================================

def build_resume_analysis(
    resume: dict
) -> dict:

    extracted_text = str(
        resume.get(
            "extracted_text",
            ""
        )
        or
        ""
    )


    # ======================================
    # 1. Detect Resume Sections
    # ======================================

    sections = detect_resume_sections(
        extracted_text
    )


    # ======================================
    # 2. Skills + Evidence
    # ======================================

    skill_evidence = (
        extract_skills_with_evidence(
            extracted_text,
            sections
        )
    )


    skills = []


    for item in skill_evidence:

        skill_name = item.get(
            "skill"
        )

        if (
            skill_name
            and
            skill_name not in skills
        ):

            skills.append(
                skill_name
            )


    # ======================================
    # 3. Education
    # ======================================

    education = extract_education(
        sections.get(
            "education",
            ""
        )
    )


    # ======================================
    # 4. Experience
    # ======================================

    experience = extract_experience(
        sections.get(
            "experience",
            ""
        )
    )


    # ======================================
    # 5. Projects
    # ======================================

    projects = extract_projects(
        sections.get(
            "projects",
            ""
        )
    )


    # ======================================
    # 6. Certifications
    # ======================================

    certifications = (
        extract_certifications(
            sections.get(
                "certifications",
                ""
            )
        )
    )


    # ======================================
    # 7. Achievements
    # ======================================

    achievements = (
        extract_achievements(
            sections.get(
                "achievements",
                ""
            )
        )
    )


    # ======================================
    # 8. Section Presence
    # ======================================

    section_presence = (
        build_section_presence(
            sections
        )
    )


    # ======================================
    # 9. Model 1:
    # ML Resume Quality Prediction
    # ======================================

    ml_prediction = (
        predict_resume_quality(
            extracted_text
        )
    )


    # ======================================
    # Build ML Result
    #
    # IMPORTANT:
    # This is Model 1 ML quality signal.
    # This is NOT directly the final ATS score.
    # ======================================

    ml_resume_quality = {

        "quality_label":
            ml_prediction[
                "quality_label"
            ],

        "confidence":
            ml_prediction[
                "confidence"
            ],

        "high_quality_probability":
            ml_prediction[
                "high_quality_probability"
            ],

        "low_quality_probability":
            ml_prediction[
                "low_quality_probability"
            ],

        "quality_probability_percent":
            round(
                ml_prediction[
                    "high_quality_probability"
                ]
                * 100,
                2
            ),

        "features":
            ml_prediction[
                "features"
            ],

        "explanations":
            ml_prediction[
                "explanations"
            ],

        "model_type":
            "Random Forest Classification",

        "signal_type":
            "ML Resume Quality Signal",
    }


    # ======================================
    # 10. Build Base Analysis Object
    # ======================================

    analysis = {

        # ----------------------------------
        # Identity
        # ----------------------------------

        "candidate_id":
            str(
                resume.get(
                    "candidate_id",
                    ""
                )
            ),

        "resume_id":
            str(
                resume.get(
                    "_id",
                    ""
                )
            ),

        "resume_filename":
            resume.get(
                "original_filename",
                ""
            ),


        # ----------------------------------
        # Summary
        # ----------------------------------

        "summary":
            str(
                sections.get(
                    "summary",
                    ""
                )
            ).strip(),


        # ----------------------------------
        # Skills
        # ----------------------------------

        "skills":
            skills,

        "skill_evidence":
            skill_evidence,


        # ----------------------------------
        # Education
        # ----------------------------------

        "education":
            education,


        # ----------------------------------
        # Experience
        # ----------------------------------

        "experience":
            experience,


        # ----------------------------------
        # Projects
        # ----------------------------------

        "projects":
            projects,


        # ----------------------------------
        # Certifications
        # ----------------------------------

        "certifications":
            certifications,


        # ----------------------------------
        # Achievements
        # ----------------------------------

        "achievements":
            achievements,


        # ----------------------------------
        # Section Presence
        # ----------------------------------

        "section_presence":
            section_presence,


        # ----------------------------------
        # Machine Learning - Model 1
        # ----------------------------------

        "ml_resume_quality":
            ml_resume_quality,
    }


    # ======================================
    # 11. Hybrid ATS Score
    #
    # 70% Rule-Based ATS
    # 30% Model 1 ML Quality
    # ======================================

    ats_score = (
        calculate_hybrid_ats_score(
            analysis=
                analysis,

            resume_text=
                extracted_text,

            ml_resume_quality=
                ml_resume_quality,
        )
    )


    # ======================================
    # Add Complete ATS Result
    # ======================================

    analysis[
        "ats_score"
    ] = ats_score


    # ======================================
    # 12. Final Score Meanings
    #
    # Resume Score:
    # Pure rule-based ATS score
    #
    # ATS Readiness:
    # Hybrid score:
    # 70% Rule + 30% ML
    # ======================================

    rule_score = round(
        float(
            ats_score.get(
                "rule_score",
                0
            )
            or
            0
        ),
        2
    )


    hybrid_score = round(
        float(
            ats_score.get(
                "ats_readiness",
                ats_score.get(
                    "total_score",
                    0
                )
            )
            or
            0
        ),
        2
    )


    analysis[
        "resume_score"
    ] = rule_score


    analysis[
        "ats_readiness"
    ] = hybrid_score


    # ======================================
    # Metadata
    # ======================================

    analysis[
        "analysis_version"
    ] = "2.2"


    analysis[
        "scoring_version"
    ] = "Hybrid ATS v1.0"


    analysis[
        "analyzed_at"
    ] = datetime.now(
        timezone.utc
    )


    return analysis


# ==========================================
# Analyze Resume
# ==========================================

async def analyze_resume(
    resume_id: str,
    candidate_id: str
) -> dict:

    # ======================================
    # Validate Resume ID
    # ======================================

    try:

        object_id = ObjectId(
            resume_id
        )

    except InvalidId:

        raise ValueError(
            "Invalid resume ID."
        )


    # ======================================
    # Find Candidate Resume
    #
    # candidate_id ensures that one candidate
    # cannot analyse another candidate's resume.
    # ======================================

    resume = (
        await
        resumes_collection
        .find_one(
            {
                "_id":
                    object_id,

                "candidate_id":
                    candidate_id,
            }
        )
    )


    if not resume:

        raise ValueError(
            "Resume not found."
        )


    # ======================================
    # Validate Extracted Text
    # ======================================

    extracted_text = str(
        resume.get(
            "extracted_text",
            ""
        )
        or
        ""
    )


    if not extracted_text.strip():

        raise ValueError(
            "Resume has no extracted text."
        )


    # ======================================
    # NLP + Model 1 + Hybrid ATS Analysis
    # ======================================

    analysis = (
        build_resume_analysis(
            resume
        )
    )


    # ======================================
    # Save / Update Analysis
    # ======================================

    await (
        resume_analyses_collection
        .update_one(
            {
                "resume_id":
                    analysis[
                        "resume_id"
                    ],

                "candidate_id":
                    analysis[
                        "candidate_id"
                    ],
            },
            {
                "$set":
                    analysis
            },
            upsert=True
        )
    )


    # ======================================
    # Return Fresh Analysis
    # ======================================

    return analysis


# ==========================================
# Get Saved Resume Analysis
# ==========================================

async def get_resume_analysis(
    resume_id: str,
    candidate_id: str
) -> dict | None:

    analysis = (
        await
        resume_analyses_collection
        .find_one(
            {
                "resume_id":
                    resume_id,

                "candidate_id":
                    candidate_id,
            }
        )
    )


    if not analysis:

        return None


    # Convert Mongo ObjectId to string

    if (
        "_id"
        in analysis
    ):

        analysis[
            "_id"
        ] = str(
            analysis[
                "_id"
            ]
        )


    return analysis