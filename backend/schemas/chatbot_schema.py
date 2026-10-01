from typing import Literal

from pydantic import BaseModel, Field


class ChatbotContext(BaseModel):

    page: str | None = Field(
        default=None,
        max_length=100
    )

    issue_type: str | None = Field(
        default=None,
        max_length=100
    )


class ChatbotRequest(BaseModel):

    message: str = Field(
        min_length=1,
        max_length=2000
    )

    context: ChatbotContext | None = None


class ChatbotReplyData(BaseModel):

    type: Literal[
        "text",
        "email_diagnostic",
        "resume_diagnostic",
        "settings_diagnostic",
        "general_help"
    ] = "text"

    action_required: bool = False

    action: str | None = None


class ChatbotResponse(BaseModel):

    success: bool = True

    message: str

    data: ChatbotReplyData | None = None