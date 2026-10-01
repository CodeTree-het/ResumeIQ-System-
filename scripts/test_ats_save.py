import asyncio

from backend.database.mongodb import database

from backend.services.resume_analysis_service import (
    analyze_resume,
)

from backend.services.ats_service import (
    calculate_ats_score,
    save_ats_result,
)


resumes_collection = database["resumes"]

resume_analyses_collection = database[
    "resume_analyses"
]


async def test_ats_save():

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

    resume_text = resume.get(
        "extracted_text",
        ""
    )

    print(
        "\n--- ResumeIQ ATS Save Test ---"
    )

    print(
        f"Resume: {resume['original_filename']}"
    )

    # ----------------------------------
    # Generate Resume Analysis
    # ----------------------------------

    analysis = await analyze_resume(
        resume_id=resume_id,
        candidate_id=candidate_id
    )

    # ----------------------------------
    # Calculate ATS Score
    # ----------------------------------

    ats_result = calculate_ats_score(
        analysis=analysis,
        resume_text=resume_text
    )

    print(
        f"\nCalculated Score: "
        f"{ats_result['score']} / "
        f"{ats_result['max_score']}"
    )

    print(
        f"Rating: "
        f"{ats_result['rating']}"
    )

    # ----------------------------------
    # Save ATS Result
    # ----------------------------------

    saved = await save_ats_result(
        resume_id=resume_id,
        candidate_id=candidate_id,
        ats_result=ats_result
    )

    print(
        f"\nATS Save Success: {saved}"
    )

    # ----------------------------------
    # Verify MongoDB
    # ----------------------------------

    saved_analysis = (
        await resume_analyses_collection.find_one(
            {
                "resume_id": resume_id,
                "candidate_id": candidate_id,
            }
        )
    )

    if not saved_analysis:
        print(
            "\nResume analysis document not found."
        )
        return

    saved_ats = saved_analysis.get(
        "ats_result"
    )

    if not saved_ats:
        print(
            "\nATS result was not found in MongoDB."
        )
        return

    print(
        "\n===== SAVED ATS RESULT ====="
    )

    print(
        f"Score: "
        f"{saved_ats['score']} / "
        f"{saved_ats['max_score']}"
    )

    print(
        f"Rating: "
        f"{saved_ats['rating']}"
    )

    print(
        "\nBreakdown:"
    )

    for category, score in saved_ats[
        "breakdown"
    ].items():

        print(
            f"- {category}: {score}"
        )

    print(
        "\nATS result successfully "
        "saved and verified in MongoDB."
    )


if __name__ == "__main__":

    asyncio.run(
        test_ats_save()
    )