import asyncio

from backend.database.mongodb import database
from backend.services.resume_analysis_service import (
    analyze_resume,
)


resumes_collection = database["resumes"]


async def test_resume_analysis():

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

    print(
        "\n--- ResumeIQ Complete Resume Analysis Test ---"
    )

    print(
        f"Resume: {resume['original_filename']}"
    )

    print(
        f"Resume ID: {resume_id}"
    )

    print(
        f"Candidate ID: {candidate_id}"
    )

    try:

        analysis = await analyze_resume(
            resume_id=resume_id,
            candidate_id=candidate_id
        )

    except Exception as error:

        print(
            f"\nAnalysis Error: {error}"
        )

        return

    print(
        "\n===== SUMMARY ====="
    )

    print(
        analysis["summary"]
        if analysis["summary"]
        else "No summary detected."
    )

    print(
        "\n===== SKILLS ====="
    )

    for skill in analysis["skills"]:
        print(
            f"- {skill}"
        )

    print(
        f"\nTotal Skills: "
        f"{len(analysis['skills'])}"
    )

    print(
        "\n===== EDUCATION ====="
    )

    education = analysis[
        "education"
    ]

    print(
        f"Degrees: "
        f"{education['degrees']}"
    )

    print(
        f"Institutions: "
        f"{education['institutions']}"
    )

    print(
        f"Year Ranges: "
        f"{education['year_ranges']}"
    )

    print(
        f"CGPA: "
        f"{education['cgpa']}"
    )

    print(
        f"Percentages: "
        f"{education['percentages']}"
    )

    print(
        f"Ongoing: "
        f"{education['ongoing']}"
    )

    print(
        "\n===== EXPERIENCE ====="
    )

    experience = analysis[
        "experience"
    ]

    print(
        f"Has Experience: "
        f"{experience['has_experience']}"
    )

    print(
        f"Roles: "
        f"{experience['roles']}"
    )

    print(
        f"Date Ranges: "
        f"{experience['date_ranges']}"
    )

    print(
        f"Currently Working: "
        f"{experience['currently_working']}"
    )

    print(
        "\n===== PROJECTS ====="
    )

    for index, project in enumerate(
        analysis["projects"],
        start=1
    ):

        print(
            f"\nProject {index}"
        )

        print(
            f"Title: "
            f"{project['title']}"
        )

        print(
            f"Technologies: "
            f"{project['technologies']}"
        )

        print(
            f"Description: "
            f"{project['description']}"
        )

    print(
        f"\nTotal Projects: "
        f"{len(analysis['projects'])}"
    )

    print(
        "\n===== CERTIFICATIONS ====="
    )

    for certification in analysis[
        "certifications"
    ]:
        print(
            f"- {certification}"
        )

    print(
        f"\nTotal Certifications: "
        f"{len(analysis['certifications'])}"
    )

    print(
        "\n===== ACHIEVEMENTS ====="
    )

    if analysis["achievements"]:

        for achievement in analysis[
            "achievements"
        ]:
            print(
                f"- {achievement}"
            )

    else:
        print(
            "No achievements detected."
        )

    print(
        "\n===== SECTION PRESENCE ====="
    )

    for section, present in analysis[
        "section_presence"
    ].items():

        print(
            f"{section}: {present}"
        )

    print(
        "\n===== ANALYSIS INFO ====="
    )

    print(
        f"Analysis Version: "
        f"{analysis['analysis_version']}"
    )

    print(
        f"Analyzed At: "
        f"{analysis['analyzed_at']}"
    )

    print(
        "\nResume analysis successfully "
        "generated and saved to MongoDB."
    )


if __name__ == "__main__":

    asyncio.run(
        test_resume_analysis()
    )