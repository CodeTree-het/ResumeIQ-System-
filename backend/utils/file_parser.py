from io import BytesIO

import fitz
from docx import Document


def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf_document = fitz.open(
            stream=file_content,
            filetype="pdf"
        )

        extracted_text = []

        for page in pdf_document:
            page_text = page.get_text("text")
            if page_text:
                extracted_text.append(page_text)

        pdf_document.close()

        return "\n".join(extracted_text).strip()

    except Exception as error:
        raise ValueError(
            f"Unable to read PDF file: {str(error)}"
        )


def extract_text_from_docx(file_content: bytes) -> str:
    try:
        document = Document(BytesIO(file_content))

        extracted_text = []

        for paragraph in document.paragraphs:
            text = paragraph.text.strip()

            if text:
                extracted_text.append(text)

        return "\n".join(extracted_text).strip()

    except Exception as error:
        raise ValueError(
            f"Unable to read DOCX file: {str(error)}"
        )


def extract_resume_text(
    filename: str,
    file_content: bytes
) -> str:

    filename_lower = filename.lower()

    if filename_lower.endswith(".pdf"):
        text = extract_text_from_pdf(file_content)

    elif filename_lower.endswith(".docx"):
        text = extract_text_from_docx(file_content)

    else:
        raise ValueError(
            "Unsupported resume file type."
        )

    if not text:
        raise ValueError(
            "No readable text found in the resume."
        )

    return text