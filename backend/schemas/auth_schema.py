from typing import Literal

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
)


# =========================================================
# USER PREFERENCES
# =========================================================

class UserPreferencesRequest(BaseModel):

    preferred_role: str = Field(
        default="",
        max_length=100
    )

    experience_level: str = Field(
        default="",
        max_length=100
    )

    work_mode: str = Field(
        default="",
        max_length=100
    )

    analysis_language: str = Field(
        default="english",
        max_length=50
    )

    ai_suggestions: bool = True

    ats_suggestions: bool = True


# =========================================================
# NOTIFICATION SETTINGS
# =========================================================

class UserNotificationSettingsRequest(BaseModel):

    analysis_complete: bool = True

    job_matches: bool = True

    resume_tips: bool = True

    security_alerts: bool = True


# =========================================================
# PRIVACY SETTINGS
# =========================================================

class UserPrivacySettingsRequest(BaseModel):

    resume_visibility: Literal[
        "private",
        "recruiters",
        "public"
    ] = "private"


# =========================================================
# REGISTER
# =========================================================

class RegisterRequest(BaseModel):

    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    mobile: str = Field(
        min_length=7,
        max_length=20,
        pattern=r"^[0-9+\-\s()]+$"
    )

    password: str = Field(
        min_length=8,
        max_length=72
    )

    role: Literal[
        "candidate",
        "recruiter"
    ]


    @field_validator(
        "full_name",
        mode="before"
    )
    @classmethod
    def clean_full_name(
        cls,
        value
    ):

        if isinstance(
            value,
            str
        ):
            return value.strip()

        return value


    @field_validator(
        "mobile",
        mode="before"
    )
    @classmethod
    def clean_register_mobile(
        cls,
        value
    ):

        if isinstance(
            value,
            str
        ):
            return value.strip()

        return value


# =========================================================
# VERIFY REGISTRATION EMAIL OTP
# =========================================================

class VerifyEmailOTPRequest(BaseModel):

    email: EmailStr

    otp: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$"
    )


# =========================================================
# RESEND REGISTRATION EMAIL OTP
# =========================================================

class ResendEmailOTPRequest(BaseModel):

    email: EmailStr


# =========================================================
# LOGIN
# =========================================================

class LoginRequest(BaseModel):

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=72
    )


# =========================================================
# FORGOT PASSWORD
# =========================================================

class ForgotPasswordRequest(BaseModel):

    email: EmailStr


# =========================================================
# VERIFY FORGOT PASSWORD OTP
# =========================================================

class VerifyForgotPasswordOTPRequest(BaseModel):

    email: EmailStr

    otp: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$"
    )


# =========================================================
# RESEND FORGOT PASSWORD OTP
# =========================================================

class ResendForgotPasswordOTPRequest(BaseModel):

    email: EmailStr


# =========================================================
# RESET PASSWORD
# =========================================================

class ResetPasswordRequest(BaseModel):

    email: EmailStr

    reset_token: str = Field(
        min_length=20,
        max_length=200
    )

    new_password: str = Field(
        min_length=8,
        max_length=72
    )

    confirm_password: str = Field(
        min_length=8,
        max_length=72
    )


# =========================================================
# TOKEN RESPONSE
# =========================================================

class TokenResponse(BaseModel):

    access_token: str

    token_type: str = "bearer"


# =========================================================
# COMMON MESSAGE RESPONSE
# =========================================================

class MessageResponse(BaseModel):

    message: str


# =========================================================
# PROFILE UPDATE
#
# PATCH /api/auth/me
#
# Editable:
# - full_name
# - mobile
# - location
#
# Email changes separately using OTP.
# =========================================================

class ProfileUpdateRequest(BaseModel):

    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    mobile: str | None = Field(
        default=None,
        min_length=7,
        max_length=20,
        pattern=r"^[0-9+\-\s()]+$"
    )

    location: str | None = Field(
        default=None,
        max_length=150
    )


    @field_validator(
        "full_name",
        mode="before"
    )
    @classmethod
    def clean_profile_name(
        cls,
        value
    ):

        if value is None:
            return None

        if isinstance(
            value,
            str
        ):

            value = value.strip()

            if not value:
                return None

        return value


    @field_validator(
        "mobile",
        mode="before"
    )
    @classmethod
    def clean_mobile(
        cls,
        value
    ):

        if value is None:
            return None

        if isinstance(
            value,
            str
        ):

            value = value.strip()

            if not value:
                return None

        return value


    @field_validator(
        "location",
        mode="before"
    )
    @classmethod
    def clean_location(
        cls,
        value
    ):

        if value is None:
            return None

        if isinstance(
            value,
            str
        ):

            value = value.strip()

            if not value:
                return None

        return value


# =========================================================
# SETTINGS UPDATE
#
# PATCH /api/auth/settings
# =========================================================

class SettingsUpdateRequest(BaseModel):

    preferences: UserPreferencesRequest | None = None

    notifications: UserNotificationSettingsRequest | None = None

    privacy: UserPrivacySettingsRequest | None = None


# =========================================================
# CHANGE EMAIL
#
# STEP 1:
# POST /api/auth/change-email/send-otp
# =========================================================

class ChangeEmailRequest(BaseModel):

    new_email: EmailStr


# =========================================================
# VERIFY EMAIL CHANGE OTP
#
# STEP 2:
# POST /api/auth/change-email/verify-otp
# =========================================================

class VerifyChangeEmailRequest(BaseModel):

    new_email: EmailStr

    otp: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$"
    )


# =========================================================
# CHANGE PASSWORD
#
# POST /api/auth/change-password
# =========================================================

class ChangePasswordRequest(BaseModel):

    current_password: str = Field(
        min_length=8,
        max_length=72
    )

    new_password: str = Field(
        min_length=8,
        max_length=72
    )

    confirm_password: str = Field(
        min_length=8,
        max_length=72
    )


# =========================================================
# PROFILE RESPONSE
# =========================================================

class ProfileResponse(BaseModel):

    id: str

    full_name: str

    email: EmailStr

    mobile: str | None = None

    location: str | None = None

    role: str

    status: str = "active"

    is_email_verified: bool = False

    preferences: UserPreferencesRequest = Field(
        default_factory=UserPreferencesRequest
    )

    notifications: UserNotificationSettingsRequest = Field(
        default_factory=UserNotificationSettingsRequest
    )

    privacy: UserPrivacySettingsRequest = Field(
        default_factory=UserPrivacySettingsRequest
    )