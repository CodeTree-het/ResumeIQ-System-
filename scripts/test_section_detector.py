import asyncio

from backend.database.mongodb import database
from backend.nlp.section_detector import detect_resume_sections


resumes_collection = database["resumes"]


async def test_section_detector():
    resume = await resumes_collection.find_one(
        {"is_active": True},
        sort=[("uploaded_at", -1)]
    )

    if not resume:
        print("No active resume found.")
        return

    extracted_text = resume.get("extracted_text", "")

    sections = detect_resume_sections(extracted_text)

    print("\n--- ResumeIQ Section Detection Test ---")
    print(f"Resume: {resume['original_filename']}")

    for section_name, section_text in sections.items():
        print(f"\n===== {section_name.upper()} =====")

        if section_text:
            print(section_text[:800])
        else:
            print("No content detected.")


if __name__ == "__main__":
    asyncio.run(test_section_detector())