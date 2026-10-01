from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    status,
)

from backend.schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
    VerifyEmailOTPRequest,
    ResendEmailOTPRequest,
    ForgotPasswordRequest,
    VerifyForgotPasswordOTPRequest,
    ResendForgotPasswordOTPRequest,
    ResetPasswordRequest,
    ProfileUpdateRequest,
    SettingsUpdateRequest,
    ChangeEmailRequest,
    VerifyChangeEmailRequest,
    ChangePasswordRequest,
)

from backend.services.auth_service import (
    register_user,
    login_user,
    verify_email_otp,
    resend_email_otp,
    forgot_password,
    verify_forgot_password_otp,
    resend_forgot_password_otp,
    reset_password,
    update_profile,
    update_settings,
    send_change_email_otp,
    verify_change_email_otp,
    find_authenticated_user,
    serialize_user_profile,
    change_password,
)

from backend.utils.auth_dependencies import (
    get_current_user,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# =========================================================
# REGISTER
# =========================================================

@router.post(
    "/register",
    status_code=status.HTTP_200_OK
)
async def register(
    user_data: RegisterRequest = Body(...)
):

    result = await register_user(
        user_data
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "email":
            result["email"],

        "otp_expires_in_minutes":
            result[
                "otp_expires_in_minutes"
            ]
    }


# =========================================================
# VERIFY REGISTRATION EMAIL OTP
# =========================================================

@router.post(
    "/verify-email-otp",
    status_code=status.HTTP_200_OK
)
async def verify_email(
    otp_data: VerifyEmailOTPRequest = Body(...)
):

    result = await verify_email_otp(
        otp_data
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "user_id":
            result["user_id"]
    }


# =========================================================
# RESEND REGISTRATION EMAIL OTP
# =========================================================

@router.post(
    "/resend-email-otp",
    status_code=status.HTTP_200_OK
)
async def resend_otp(
    resend_data: ResendEmailOTPRequest = Body(...)
):

    result = await resend_email_otp(
        resend_data
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "email":
            result["email"],

        "otp_expires_in_minutes":
            result[
                "otp_expires_in_minutes"
            ]
    }


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK
)
async def forgot_password_route(
    forgot_data: ForgotPasswordRequest = Body(...)
):

    result = await forgot_password(
        forgot_data
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "email":
            result["email"],

        "otp_expires_in_minutes":
            result[
                "otp_expires_in_minutes"
            ]
    }


# =========================================================
# VERIFY FORGOT PASSWORD OTP
# =========================================================

@router.post(
    "/verify-forgot-password-otp",
    status_code=status.HTTP_200_OK
)
async def verify_forgot_password_otp_route(
    otp_data: VerifyForgotPasswordOTPRequest = Body(...)
):

    result = await verify_forgot_password_otp(
        otp_data
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "email":
            result["email"],

        "reset_token":
            result["reset_token"],

        "reset_token_expires_in_minutes":
            result[
                "reset_token_expires_in_minutes"
            ]
    }


# =========================================================
# RESEND FORGOT PASSWORD OTP
# =========================================================

@router.post(
    "/resend-forgot-password-otp",
    status_code=status.HTTP_200_OK
)
async def resend_forgot_password_otp_route(
    resend_data: ResendForgotPasswordOTPRequest = Body(...)
):

    result = await resend_forgot_password_otp(
        resend_data
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "email":
            result["email"],

        "otp_expires_in_minutes":
            result[
                "otp_expires_in_minutes"
            ]
    }


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK
)
async def reset_password_route(
    reset_data: ResetPasswordRequest = Body(...)
):

    result = await reset_password(
        reset_data
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"]
    }


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
    status_code=status.HTTP_200_OK
)
async def login(
    login_data: LoginRequest = Body(...)
):

    result = await login_user(
        login_data
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "access_token":
            result["access_token"],

        "token_type":
            result["token_type"],

        "role":
            result["role"]
    }


# =========================================================
# GET CURRENT USER
#
# GET /api/auth/me
# =========================================================

@router.get(
    "/me",
    status_code=status.HTTP_200_OK
)
async def get_my_profile(
    current_user: dict = Depends(
        get_current_user
    )
):

    user = await find_authenticated_user(
        current_user
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authenticated user not found."
        )

    return {
        "message":
            "Current user fetched successfully.",

        "user":
            serialize_user_profile(
                user
            )
    }


# =========================================================
# UPDATE PROFILE
#
# PATCH /api/auth/me
#
# Updates:
# - full_name
# - mobile
# - location
# =========================================================

@router.patch(
    "/me",
    status_code=status.HTTP_200_OK
)
async def update_my_profile(

    profile_data: ProfileUpdateRequest = Body(
        ...,
        examples=[
            {
                "full_name":
                    "Het Patel",

                "mobile":
                    "9876543210",

                "location":
                    "Surat, Gujarat"
            }
        ]
    ),

    current_user: dict = Depends(
        get_current_user
    )
):

    result = await update_profile(
        profile_data,
        current_user
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "user":
            result["user"]
    }


# =========================================================
# UPDATE SETTINGS
#
# PATCH /api/auth/settings
#
# Updates:
# - preferences
# - notifications
# - privacy
# =========================================================

@router.patch(
    "/settings",
    status_code=status.HTTP_200_OK
)
async def update_my_settings(

    settings_data: SettingsUpdateRequest = Body(
        ...,
        examples=[
            {
                "preferences": {
                    "preferred_role":
                        "UI/UX Designer",

                    "experience_level":
                        "Fresher",

                    "work_mode":
                        "Remote",

                    "analysis_language":
                        "english",

                    "ai_suggestions":
                        True,

                    "ats_suggestions":
                        True
                },

                "notifications": {
                    "analysis_complete":
                        True,

                    "job_matches":
                        True,

                    "resume_tips":
                        True,

                    "security_alerts":
                        True
                },

                "privacy": {
                    "resume_visibility":
                        "private"
                }
            }
        ]
    ),

    current_user: dict = Depends(
        get_current_user
    )
):

    result = await update_settings(
        settings_data,
        current_user
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "user":
            result["user"]
    }


# =========================================================
# CHANGE PASSWORD
#
# POST /api/auth/change-password
# =========================================================

@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK
)
async def change_password_route(

    password_data: ChangePasswordRequest = Body(
        ...,
        examples=[
            {
                "current_password":
                    "CurrentPassword123",

                "new_password":
                    "NewPassword123",

                "confirm_password":
                    "NewPassword123"
            }
        ]
    ),

    current_user: dict = Depends(
        get_current_user
    )
):

    result = await change_password(
        password_data,
        current_user
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"]
    }


# =========================================================
# CHANGE EMAIL - SEND OTP
#
# POST /api/auth/change-email/send-otp
# =========================================================

@router.post(
    "/change-email/send-otp",
    status_code=status.HTTP_200_OK
)
async def change_email_send_otp(

    email_data: ChangeEmailRequest = Body(
        ...,
        examples=[
            {
                "new_email":
                    "newemail@gmail.com"
            }
        ]
    ),

    current_user: dict = Depends(
        get_current_user
    )
):

    result = await send_change_email_otp(
        email_data,
        current_user
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "new_email":
            result["new_email"],

        "otp_expires_in_minutes":
            result[
                "otp_expires_in_minutes"
            ]
    }


# =========================================================
# CHANGE EMAIL - VERIFY OTP
#
# POST /api/auth/change-email/verify-otp
# =========================================================

@router.post(
    "/change-email/verify-otp",
    status_code=status.HTTP_200_OK
)
async def change_email_verify_otp(

    otp_data: VerifyChangeEmailRequest = Body(
        ...,
        examples=[
            {
                "new_email":
                    "newemail@gmail.com",

                "otp":
                    "123456"
            }
        ]
    ),

    current_user: dict = Depends(
        get_current_user
    )
):

    result = await verify_change_email_otp(
        otp_data,
        current_user
    )

    if not result["success"]:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    return {
        "message":
            result["message"],

        "user":
            result["user"],

        "requires_relogin":
            result.get(
                "requires_relogin",
                True
            )
    }