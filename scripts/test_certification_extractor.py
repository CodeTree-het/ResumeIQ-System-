import asyncio

from backend.database.mongodb import database
from backend.nlp.section_detector import detect_resume_sections
from backend.nlp.certification_extractor import extract_certifications


resumes_collection = database["resumes"]


async def test_certification_extractor():
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

    certification_text = sections.get(
        "certifications",
        ""
    )

    certifications = extract_certifications(
        certification_text
    )

    print(
        "\n--- ResumeIQ Certification Extraction Test ---"
    )

    print(
        f"Resume: {resume['original_filename']}"
    )

    print(
        "\n===== CERTIFICATION SECTION ====="
    )

    if certification_text.strip():
        print(certification_text)
    else:
        print(
            "No certification section content found."
        )

    print(
        "\n===== EXTRACTED CERTIFICATIONS ====="
    )

    if certifications:
        for index, certification in enumerate(
            certifications,
            start=1
        ):
            print(
                f"{index}. {certification}"
            )
    else:
        print(
            "No certifications detected."
        )

    print(
        f"\nTotal Certifications Detected: "
        f"{len(certifications)}"
    )


if __name__ == "__main__":
    asyncio.run(
        test_certification_extractor()
    )   