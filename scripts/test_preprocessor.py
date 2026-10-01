import asyncio

from backend.database.mongodb import database
from backend.nlp.text_preprocessor import preprocess_resume_text


resumes_collection = database["resumes"]


async def test_preprocessor():
    resume = await resumes_collection.find_one(
        {"is_active": True},
        sort=[("uploaded_at", -1)]
    )

    if not resume:
        print("No active resume found.")
        return

    original_text = resume.get("extracted_text", "")

    result = preprocess_resume_text(original_text)

    print("\n--- ResumeIQ NLP Preprocessing Test ---")
    print(f"Resume: {resume['original_filename']}")
    print(f"Original length: {len(original_text)}")
    print(f"Cleaned length: {len(result['cleaned_text'])}")
    print(f"Normalized length: {len(result['normalized_text'])}")

    print("\n--- CLEANED TEXT SAMPLE ---")
    print(result["cleaned_text"][:700])

    print("\n--- NORMALIZED TEXT SAMPLE ---")
    print(result["normalized_text"][:700])


if __name__ == "__main__":
    asyncio.run(test_preprocessor())