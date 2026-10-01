import asyncio

from backend.database.mongodb import database
from backend.nlp.section_detector import detect_resume_sections
from backend.nlp.experience_extractor import extract_experience


resumes_collection = database["resumes"]


async def test_experience_extractor():
    resume = await resumes_collection.find_one(
        {"is_active": True},
        sort=[("uploaded_at", -1)]
    )

    if not resume:
        print("No active resume found.")
        return

    extracted_text = resume.get(
        "extracted_text",
        ""
    )

    sections = detect_resume_sections(
        extracted_text
    )

    experience_text = sections.get(
        "experience",
        ""
    )

    experience_data = extract_experience(
        experience_text
    )

    print(
        "\n--- ResumeIQ Experience Extraction Test ---"
    )

    print(
        f"Resume: {resume['original_filename']}"
    )

    print(
        "\n===== EXPERIENCE SECTION ====="
    )

    if experience_text.strip():
        print(experience_text)
    else:
        print("No experience section content found.")

    print(
        "\n===== EXTRACTED EXPERIENCE ====="
    )

    print(
        f"Has Experience: "
        f"{experience_data['has_experience']}"
    )

    print("\nRoles:")

    for role in experience_data["roles"]:
        print(f"- {role}")

    print("\nDate Ranges:")

    for date_range in experience_data["date_ranges"]:
        print(f"- {date_range}")

    print("\nExplicit Experience Years:")

    for years in experience_data["explicit_years"]:
        print(f"- {years}")

    print(
        f"\nCurrently Working: "
        f"{experience_data['currently_working']}"
    )

    print(
        "\nRaw Experience Text:"
    )

    if experience_data["raw_text"]:
        print(
            experience_data["raw_text"]
        )
    else:
        print(
            "No raw experience text."
        )


def test_sample_experience():
    sample_text = """
    Data Analyst
    ABC Technologies
    January 2024 - Present
    Worked on data cleaning, analysis and dashboard reporting.

    Software Developer Intern
    XYZ Solutions
    June 2023 - December 2023
    Developed web applications and APIs.
    """

    result = extract_experience(
        sample_text
    )

    print(
        "\n--- Generic Experience Test ---"
    )

    print(
        f"Has Experience: "
        f"{result['has_experience']}"
    )

    print(
        f"Roles: "
        f"{result['roles']}"
    )

    print(
        f"Date Ranges: "
        f"{result['date_ranges']}"
    )

    print(
        f"Experience Years: "
        f"{result['explicit_years']}"
    )

    print(
        f"Currently Working: "
        f"{result['currently_working']}"
    )


if __name__ == "__main__":
    asyncio.run(
        test_experience_extractor()
    )

    test_sample_experience()