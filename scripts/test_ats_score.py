import asyncio

from backend.database.mongodb import database
from backend.services.resume_analysis_service import (
    analyze_resume,
)
from backend.services.ats_service import (
    calculate_ats_score,
)


resumes_collection = database["resumes"]


async def test_ats_score():

    resume = await resumes_collection.find_one(
        {"is_active": True},
        sort=[("uploaded_at", -1)]
    )

    if not resume:
        print("No active resume found.")
        return

    resume_id = str(
        resume["_id"]
    )

    candidate_id = str(
        resume["candidate_id"]
    )

    extracted_text = resume.get(
        "extracted_text",
        ""
    )

    print(
        "\n--- ResumeIQ ATS / Resume Quality Test ---"
    )

    print(
        f"Resume: {resume['original_filename']}"
    )

    try:
        analysis = await analyze_resume(
            resume_id=resume_id,
            candidate_id=candidate_id
        )

        ats_result = calculate_ats_score(
            analysis=analysis,
            resume_text=extracted_text
        )

    except Exception as error:
        print(
            f"\nATS Analysis Error: {error}"
        )
        return

    print(
        "\n===== FINAL SCORE ====="
    )

    print(
        f"Score: "
        f"{ats_result['score']} / "
        f"{ats_result['max_score']}"
    )

    print(
        f"Rating: "
        f"{ats_result['rating']}"
    )

    print(
        "\n===== SCORE BREAKDOWN ====="
    )

    breakdown = ats_result[
        "breakdown"
    ]

    print(
        f"Sections: "
        f"{breakdown['sections']} / 20"
    )

    print(
        f"Skills: "
        f"{breakdown['skills']} / 20"
    )

    print(
        f"Education: "
        f"{breakdown['education']} / 10"
    )

    print(
        f"Experience: "
        f"{breakdown['experience']} / 15"
    )

    print(
        f"Projects: "
        f"{breakdown['projects']} / 15"
    )

    print(
        f"Achievements: "
        f"{breakdown['achievements']} / 5"
    )

    print(
        f"Certifications: "
        f"{breakdown['certifications']} / 5"
    )

    print(
        f"Content / Keywords: "
        f"{breakdown['content_keywords']} / 10"
    )

    print(
        "\n===== MISSING SECTIONS ====="
    )

    missing_sections = ats_result[
        "missing_sections"
    ]

    if missing_sections:
        for section in missing_sections:
            print(
                f"- {section}"
            )
    else:
        print(
            "No important sections missing."
        )

    print(
        "\n===== CONTENT DETAILS ====="
    )

    content_details = ats_result[
        "content_details"
    ]

    print(
        f"Word Count: "
        f"{content_details['word_count']}"
    )

    print(
        f"Action Verbs Found: "
        f"{content_details['action_verbs_found']}"
    )

    print(
        f"Numeric Values Found: "
        f"{content_details['numeric_values_found']}"
    )

    print(
        f"Skills Found: "
        f"{content_details['skills_found']}"
    )

    print(
        f"Summary Word Count: "
        f"{content_details['summary_word_count']}"
    )

    print(
        "\n===== RECOMMENDATIONS ====="
    )

    recommendations = ats_result[
        "recommendations"
    ]

    if recommendations:
        for index, recommendation in enumerate(
            recommendations,
            start=1
        ):
            print(
                f"{index}. {recommendation}"
            )
    else:
        print(
            "No major recommendations."
        )

    print(
        "\n===== DISCLAIMER ====="
    )

    print(
        ats_result["disclaimer"]
    )


if __name__ == "__main__":
    asyncio.run(
        test_ats_score()
    )