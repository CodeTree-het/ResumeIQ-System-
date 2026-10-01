from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class ResumeModel(BaseModel):
    candidate_id: str

    original_filename: str
    stored_filename: str
    file_path: str

    file_type: Literal["pdf", "docx"]

    extracted_text: str

    is_active: bool = True

    uploaded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )