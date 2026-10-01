import asyncio

from backend.database.mongodb import database
from backend.nlp.section_detector import detect_resume_sections
from backend.nlp.education_extractor import extract_education


resumes_collection = database["resumes"]


async def test_education_extractor():
    resume = await resumes_collection.find_one(
        {"is_active": True},
        sort=[("uploaded_at", -1)]
    )

    if not resume:
        print("No active resume found.")
        return

    extracted_text = resume.get("extracted_text", "")

    sections = detect_resume_sections(extracted_text)

    education_text = sections.get("education", "")

    education_data = extract_education(education_text)

    print("\n--- ResumeIQ Education Extraction Test ---")
    print(f"Resume: {resume['original_filename']}")

    print("\n===== EDUCATION SECTION =====")
    print(education_text)

    print("\n===== EXTRACTED EDUCATION =====")

    print("Degrees:")
    for item in education_data["degrees"]:
        print(f"- {item}")

    print("\nInstitutions:")
    for item in education_data["institutions"]:
        print(f"- {item}")

    print("\nYear Ranges:")
    for item in education_data["year_ranges"]:
        print(f"- {item}")

    print("\nCGPA:")
    for item in education_data["cgpa"]:
        print(f"- {item}")

    print("\nPercentages:")
    for item in education_data["percentages"]:
        print(f"- {item}")

    print(
        f"\nOngoing Education: "
        f"{education_data['ongoing']}"
    )


if __name__ == "__main__":
    asyncio.run(test_education_extractor())