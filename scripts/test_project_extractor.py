import asyncio

from backend.database.mongodb import database
from backend.nlp.section_detector import detect_resume_sections
from backend.nlp.project_extractor import extract_projects


resumes_collection = database["resumes"]


async def test_project_extractor():
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

    projects_text = sections.get(
        "projects",
        ""
    )

    print(
        "\n--- ResumeIQ Project Extraction Test ---"
    )

    print(
        f"Resume: {resume['original_filename']}"
    )

    print(
        "\n===== RAW PROJECTS SECTION ====="
    )

    print(projects_text)

    print(
        "================================"
    )

    projects = extract_projects(
        projects_text
    )

    print(
        "\n===== EXTRACTED PROJECTS ====="
    )

    for index, project in enumerate(
        projects,
        start=1
    ):
        print(
            f"\nProject {index}"
        )

        print(
            f"Title: {project['title']}"
        )

        print(
            f"Technologies: {project['technologies']}"
        )

        print(
            f"Description: {project['description']}"
        )

    print(
        f"\nTotal Projects Detected: {len(projects)}"
    )


if __name__ == "__main__":
    asyncio.run(
        test_project_extractor()
    )