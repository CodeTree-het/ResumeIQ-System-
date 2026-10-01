import asyncio

from backend.database.mongodb import database
from backend.nlp.section_detector import detect_resume_sections
from backend.nlp.skill_extractor import (
    extract_skills_from_text,
    extract_skills_with_evidence,
)


resumes_collection = database["resumes"]


async def test_skill_extractor():
    resume = await resumes_collection.find_one(
        {"is_active": True},
        sort=[("uploaded_at", -1)]
    )

    if not resume:
        print("No active resume found.")
        return

    extracted_text = resume.get("extracted_text", "")

    sections = detect_resume_sections(extracted_text)

    skills = extract_skills_from_text(extracted_text)

    evidence = extract_skills_with_evidence(
        full_text=extracted_text,
        sections=sections
    )

    print("\n--- ResumeIQ Skill Extraction Test ---")
    print(f"Resume: {resume['original_filename']}")

    print("\n===== DETECTED SKILLS =====")

    for skill in skills:
        print(f"- {skill}")

    print(f"\nTotal Skills Detected: {len(skills)}")

    print("\n===== SKILL EVIDENCE =====")

    for item in evidence:
        print(
            f"{item['skill']} -> "
            f"{item['found_in']} "
            f"(Evidence Count: {item['evidence_count']})"
        )


if __name__ == "__main__":
    asyncio.run(test_skill_extractor())