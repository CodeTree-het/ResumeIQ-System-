import asyncio

from backend.database.mongodb import database
from backend.nlp.section_detector import detect_resume_sections
from backend.nlp.achievement_extractor import extract_achievements


resumes_collection = database["resumes"]


async def test_achievement_extractor():
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

    achievement_text = sections.get(
        "achievements",
        ""
    )

    achievements = extract_achievements(
        achievement_text
    )

    print(
        "\n--- ResumeIQ Achievement Extraction Test ---"
    )

    print(
        f"Resume: {resume['original_filename']}"
    )

    print(
        "\n===== ACHIEVEMENT SECTION ====="
    )

    if achievement_text.strip():
        print(achievement_text)
    else:
        print(
            "No achievement section content found."
        )

    print(
        "\n===== EXTRACTED ACHIEVEMENTS ====="
    )

    if achievements:
        for index, achievement in enumerate(
            achievements,
            start=1
        ):
            print(
                f"{index}. {achievement}"
            )
    else:
        print(
            "No achievements detected."
        )

    print(
        f"\nTotal Achievements Detected: "
        f"{len(achievements)}"
    )


if __name__ == "__main__":
    asyncio.run(
        test_achievement_extractor()
    )