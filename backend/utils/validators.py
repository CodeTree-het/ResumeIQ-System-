from pathlib import Path


ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx"}

MAX_RESUME_SIZE_MB = 10
MAX_RESUME_SIZE_BYTES = MAX_RESUME_SIZE_MB * 1024 * 1024


def validate_resume_extension(filename: str) -> bool:
    if not filename:
        return False

    extension = Path(filename).suffix.lower()

    return extension in ALLOWED_RESUME_EXTENSIONS


def validate_resume_size(file_content: bytes) -> bool:
    return len(file_content) <= MAX_RESUME_SIZE_BYTES