from datetime import datetime, timezone
from typing import Literal

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
)


# =========================================================
# USER PREFERENCES
# =========================================================

class UserPreferencesModel(BaseModel):

    preferred_role: str = ""

    experience_level: str = ""

    work_mode: str = ""

    analysis_language: str = "english"

    ai_suggestions: bool = True

    ats_suggestions: bool = True


# =========================================================
# NOTIFICATION SETTINGS
# =========================================================

class UserNotificationSettingsModel(BaseModel):

    analysis_complete: bool = True

    job_matches: bool = True

    resume_tips: bool = True

    security_alerts: bool = True


# =========================================================
# PRIVACY SETTINGS
# =========================================================

class UserPrivacySettingsModel(BaseModel):

    resume_visibility: Literal[
        "private",
        "recruiters",
        "public"
    ] = "private"


# =========================================================
# USER MODEL
# =========================================================

class UserModel(BaseModel):

    # -----------------------------------------------------
    # BASIC INFORMATION
    # -----------------------------------------------------

    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    mobile: str | None = Field(
        default=None,
        min_length=7,
        max_length=20
    )

    location: str | None = Field(
        default=None,
        max_length=150
    )


    # -----------------------------------------------------
    # PASSWORD
    # -----------------------------------------------------

    password_hash: str


    # -----------------------------------------------------
    # ROLE
    # -----------------------------------------------------

    role: Literal[
        "candidate",
        "recruiter",
        "admin"
    ]


    # -----------------------------------------------------
    # ACCOUNT STATUS
    # -----------------------------------------------------

    status: Literal[
        "active",
        "inactive"
    ] = "active"


    # -----------------------------------------------------
    # EMAIL VERIFICATION
    # -----------------------------------------------------

    is_email_verified: bool = False

    email_verified_at: datetime | None = None


    # -----------------------------------------------------
    # USER SETTINGS
    # -----------------------------------------------------

    preferences: UserPreferencesModel = Field(
        default_factory=UserPreferencesModel
    )

    notifications: UserNotificationSettingsModel = Field(
        default_factory=UserNotificationSettingsModel
    )

    privacy: UserPrivacySettingsModel = Field(
        default_factory=UserPrivacySettingsModel
    )


    # -----------------------------------------------------
    # DATES
    # -----------------------------------------------------

    created_at: datetime = Field(
        default_factory=lambda:
            datetime.now(
                timezone.utc
            )
    )

    updated_at: datetime = Field(
        default_factory=lambda:
            datetime.now(
                timezone.utc
            )
    )