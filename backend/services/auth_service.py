import asyncio
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId

from backend.database.mongodb import database
from backend.models.user import UserModel

from backend.schemas.auth_schema import (
    ChangeEmailRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    ResendEmailOTPRequest,
    ResendForgotPasswordOTPRequest,
    ResetPasswordRequest,
    SettingsUpdateRequest,
    VerifyChangeEmailRequest,
    VerifyEmailOTPRequest,
    VerifyForgotPasswordOTPRequest,
)

from backend.services.email_service import (
    generate_email_otp,
    send_otp_email,
)

from backend.utils.security import (
    create_access_token,
    hash_password,
    verify_password,
)


users_collection = database["users"]
email_otps_collection = database["email_otps"]
password_reset_otps_collection = database["password_reset_otps"]
email_change_otps_collection = database["email_change_otps"]


OTP_EXPIRY_MINUTES = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5
RESET_TOKEN_EXPIRY_MINUTES = 10


def ensure_utc_datetime(value):

    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(
            tzinfo=timezone.utc
        )

    return value.astimezone(
        timezone.utc
    )


def normalize_email(value) -> str:

    return str(
        value or ""
    ).lower().strip()


def hash_reset_token(
    token: str
) -> str:

    return hashlib.sha256(
        token.encode(
            "utf-8"
        )
    ).hexdigest()


def serialize_user_profile(
    user: dict | None
):

    if not user:
        return None

    return {
        "id":
            str(
                user.get(
                    "_id",
                    ""
                )
            ),

        "full_name":
            user.get(
                "full_name",
                ""
            ),

        "email":
            user.get(
                "email",
                ""
            ),

        "mobile":
            user.get(
                "mobile"
            ),

        "location":
            user.get(
                "location"
            ),

        "role":
            user.get(
                "role",
                ""
            ),

        "status":
            user.get(
                "status",
                "active"
            ),

        "is_email_verified":
            bool(
                user.get(
                    "is_email_verified",
                    True
                )
            ),

        "email_verified_at":
            user.get(
                "email_verified_at"
            ),

        "preferences":
            user.get(
                "preferences",
                {
                    "preferred_role":
                        "",

                    "experience_level":
                        "",

                    "work_mode":
                        "",

                    "analysis_language":
                        "english",

                    "ai_suggestions":
                        True,

                    "ats_suggestions":
                        True,
                }
            ),

        "notifications":
            user.get(
                "notifications",
                {
                    "analysis_complete":
                        True,

                    "job_matches":
                        True,

                    "resume_tips":
                        True,

                    "security_alerts":
                        True,
                }
            ),

        "privacy":
            user.get(
                "privacy",
                {
                    "resume_visibility":
                        "private"
                }
            ),

        "created_at":
            user.get(
                "created_at"
            ),

        "updated_at":
            user.get(
                "updated_at"
            ),
    }


async def find_authenticated_user(
    current_user: dict
):

    if not current_user:
        return None

    possible_id = (
        current_user.get(
            "_id"
        )
        or
        current_user.get(
            "id"
        )
        or
        current_user.get(
            "user_id"
        )
    )

    if possible_id:

        try:

            object_id = None

            if isinstance(
                possible_id,
                ObjectId
            ):
                object_id = possible_id

            elif ObjectId.is_valid(
                str(
                    possible_id
                )
            ):
                object_id = ObjectId(
                    str(
                        possible_id
                    )
                )

            if object_id:

                user = await users_collection.find_one(
                    {
                        "_id":
                            object_id
                    }
                )

                if user:
                    return user

        except Exception:
            pass

    email = normalize_email(
        current_user.get(
            "email"
        )
    )

    if not email:
        return None

    return await users_collection.find_one(
        {
            "email":
                email
        }
    )


async def _send_otp_email_safe(
    email: str,
    otp: str
):

    await asyncio.to_thread(
        send_otp_email,
        email,
        otp
    )


def _get_retry_after(
    last_sent_at,
    now: datetime
):

    last_sent_at = ensure_utc_datetime(
        last_sent_at
    )

    if not last_sent_at:
        return 0

    elapsed = (
        now
        -
        last_sent_at
    ).total_seconds()

    if (
        elapsed
        >=
        OTP_RESEND_COOLDOWN_SECONDS
    ):
        return 0

    return max(
        1,
        int(
            OTP_RESEND_COOLDOWN_SECONDS
            -
            elapsed
        )
    )


async def register_user(
    user_data: RegisterRequest
):

    email = normalize_email(
        user_data.email
    )

    existing_user = await users_collection.find_one(
        {
            "email":
                email
        }
    )

    if existing_user:

        return {
            "success":
                False,

            "message":
                "User with this email already exists."
        }

    full_name = (
        user_data.full_name
        .strip()
    )

    mobile = str(
        user_data.mobile
    ).strip()

    password_hash = hash_password(
        user_data.password
    )

    otp = generate_email_otp()

    otp_hash = hash_password(
        otp
    )

    now = datetime.now(
        timezone.utc
    )

    expires_at = (
        now
        +
        timedelta(
            minutes=
                OTP_EXPIRY_MINUTES
        )
    )

    pending_registration = {
        "email":
            email,

        "full_name":
            full_name,

        "mobile":
            mobile,

        "password_hash":
            password_hash,

        "role":
            user_data.role,

        "otp_hash":
            otp_hash,

        "expires_at":
            expires_at,

        "attempts":
            0,

        "last_sent_at":
            now,

        "created_at":
            now,

        "updated_at":
            now,
    }

    await email_otps_collection.update_one(
        {
            "email":
                email
        },
        {
            "$set":
                pending_registration
        },
        upsert=True
    )

    try:

        await _send_otp_email_safe(
            email,
            otp
        )

    except Exception as error:

        await email_otps_collection.delete_one(
            {
                "email":
                    email
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "Unable to send verification OTP. "
                    "Please try again."
                ),

            "error":
                str(
                    error
                )
        }

    return {
        "success":
            True,

        "message":
            "Verification OTP sent successfully.",

        "email":
            email,

        "otp_expires_in_minutes":
            OTP_EXPIRY_MINUTES
    }


async def verify_email_otp(
    otp_data: VerifyEmailOTPRequest
):

    email = normalize_email(
        otp_data.email
    )

    otp = otp_data.otp.strip()

    existing_user = await users_collection.find_one(
        {
            "email":
                email
        }
    )

    if existing_user:

        return {
            "success":
                False,

            "message":
                "User with this email already exists."
        }

    pending = await email_otps_collection.find_one(
        {
            "email":
                email
        }
    )

    if not pending:

        return {
            "success":
                False,

            "message":
                (
                    "No pending registration found. "
                    "Please register again."
                )
        }

    now = datetime.now(
        timezone.utc
    )

    expires_at = ensure_utc_datetime(
        pending.get(
            "expires_at"
        )
    )

    if (
        not expires_at
        or
        now > expires_at
    ):

        await email_otps_collection.delete_one(
            {
                "email":
                    email
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "OTP has expired. "
                    "Please register again or request a new OTP."
                )
        }

    attempts = int(
        pending.get(
            "attempts",
            0
        )
    )

    if (
        attempts
        >=
        OTP_MAX_ATTEMPTS
    ):

        await email_otps_collection.delete_one(
            {
                "email":
                    email
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "Maximum OTP attempts exceeded. "
                    "Please register again."
                )
        }

    otp_hash = pending.get(
        "otp_hash"
    )

    if (
        not otp_hash
        or
        not verify_password(
            otp,
            otp_hash
        )
    ):

        new_attempts = (
            attempts
            +
            1
        )

        if (
            new_attempts
            >=
            OTP_MAX_ATTEMPTS
        ):

            await email_otps_collection.delete_one(
                {
                    "email":
                        email
                }
            )

            return {
                "success":
                    False,

                "message":
                    (
                        "Invalid OTP. "
                        "Maximum OTP attempts exceeded. "
                        "Please register again."
                    )
            }

        await email_otps_collection.update_one(
            {
                "email":
                    email
            },
            {
                "$set": {
                    "attempts":
                        new_attempts,

                    "updated_at":
                        now
                }
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    f"Invalid OTP. "
                    f"{OTP_MAX_ATTEMPTS - new_attempts} "
                    f"attempt(s) remaining."
                )
        }

    mobile = str(
        pending.get(
            "mobile",
            ""
        )
    ).strip()

    if not mobile:

        return {
            "success":
                False,

            "message":
                (
                    "Mobile number is missing from the "
                    "pending registration. Please register again."
                )
        }

    new_user = UserModel(
        full_name=
            pending[
                "full_name"
            ],

        email=
            email,

        password_hash=
            pending[
                "password_hash"
            ],

        role=
            pending[
                "role"
            ],

        status=
            "active",

        created_at=
            now,

        updated_at=
            now
    )

    user_dict = new_user.model_dump()

    user_dict[
        "mobile"
    ] = mobile

    user_dict[
        "is_email_verified"
    ] = True

    user_dict[
        "email_verified_at"
    ] = now

    existing_user = await users_collection.find_one(
        {
            "email":
                email
        }
    )

    if existing_user:

        await email_otps_collection.delete_one(
            {
                "email":
                    email
            }
        )

        return {
            "success":
                False,

            "message":
                "User with this email already exists."
        }

    result = await users_collection.insert_one(
        user_dict
    )

    await email_otps_collection.delete_one(
        {
            "email":
                email
        }
    )

    return {
        "success":
            True,

        "message":
            (
                "Email verified and account "
                "created successfully."
            ),

        "user_id":
            str(
                result.inserted_id
            )
    }


async def resend_email_otp(
    resend_data: ResendEmailOTPRequest
):

    email = normalize_email(
        resend_data.email
    )

    existing_user = await users_collection.find_one(
        {
            "email":
                email
        }
    )

    if existing_user:

        return {
            "success":
                False,

            "message":
                "This email is already registered."
        }

    pending = await email_otps_collection.find_one(
        {
            "email":
                email
        }
    )

    if not pending:

        return {
            "success":
                False,

            "message":
                (
                    "No pending registration found. "
                    "Please register again."
                )
        }

    now = datetime.now(
        timezone.utc
    )

    retry_after = _get_retry_after(
        pending.get(
            "last_sent_at"
        ),
        now
    )

    if retry_after:

        return {
            "success":
                False,

            "message":
                (
                    f"Please wait {retry_after} second(s) "
                    f"before requesting another OTP."
                ),

            "retry_after":
                retry_after
        }

    otp = generate_email_otp()

    otp_hash = hash_password(
        otp
    )

    expires_at = (
        now
        +
        timedelta(
            minutes=
                OTP_EXPIRY_MINUTES
        )
    )

    await email_otps_collection.update_one(
        {
            "email":
                email
        },
        {
            "$set": {
                "otp_hash":
                    otp_hash,

                "expires_at":
                    expires_at,

                "attempts":
                    0,

                "last_sent_at":
                    now,

                "updated_at":
                    now
            }
        }
    )

    try:

        await _send_otp_email_safe(
            email,
            otp
        )

    except Exception as error:

        return {
            "success":
                False,

            "message":
                (
                    "Unable to resend OTP. "
                    "Please try again."
                ),

            "error":
                str(
                    error
                )
        }

    return {
        "success":
            True,

        "message":
            "New verification OTP sent successfully.",

        "email":
            email,

        "otp_expires_in_minutes":
            OTP_EXPIRY_MINUTES
    }


async def forgot_password(
    forgot_data: ForgotPasswordRequest
):

    email = normalize_email(
        forgot_data.email
    )

    user = await users_collection.find_one(
        {
            "email":
                email
        }
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "No account found with this email."
        }

    if (
        user.get(
            "status"
        )
        !=
        "active"
    ):

        return {
            "success":
                False,

            "message":
                "User account is inactive."
        }

    otp = generate_email_otp()

    otp_hash = hash_password(
        otp
    )

    now = datetime.now(
        timezone.utc
    )

    expires_at = (
        now
        +
        timedelta(
            minutes=
                OTP_EXPIRY_MINUTES
        )
    )

    reset_data = {
        "email":
            email,

        "otp_hash":
            otp_hash,

        "expires_at":
            expires_at,

        "attempts":
            0,

        "otp_verified":
            False,

        "reset_token_hash":
            None,

        "reset_token_expires_at":
            None,

        "last_sent_at":
            now,

        "created_at":
            now,

        "updated_at":
            now,
    }

    await password_reset_otps_collection.update_one(
        {
            "email":
                email
        },
        {
            "$set":
                reset_data
        },
        upsert=True
    )

    try:

        await _send_otp_email_safe(
            email,
            otp
        )

    except Exception as error:

        await password_reset_otps_collection.delete_one(
            {
                "email":
                    email
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "Unable to send password reset OTP. "
                    "Please try again."
                ),

            "error":
                str(
                    error
                )
        }

    return {
        "success":
            True,

        "message":
            "Password reset OTP sent successfully.",

        "email":
            email,

        "otp_expires_in_minutes":
            OTP_EXPIRY_MINUTES
    }


async def verify_forgot_password_otp(
    otp_data: VerifyForgotPasswordOTPRequest
):

    email = normalize_email(
        otp_data.email
    )

    otp = otp_data.otp.strip()

    user = await users_collection.find_one(
        {
            "email":
                email
        }
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "No account found with this email."
        }

    pending = await password_reset_otps_collection.find_one(
        {
            "email":
                email
        }
    )

    if not pending:

        return {
            "success":
                False,

            "message":
                (
                    "No password reset request found. "
                    "Please request a new OTP."
                )
        }

    now = datetime.now(
        timezone.utc
    )

    expires_at = ensure_utc_datetime(
        pending.get(
            "expires_at"
        )
    )

    if (
        not expires_at
        or
        now > expires_at
    ):

        await password_reset_otps_collection.delete_one(
            {
                "email":
                    email
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "OTP has expired. "
                    "Please request a new OTP."
                )
        }

    attempts = int(
        pending.get(
            "attempts",
            0
        )
    )

    if (
        attempts
        >=
        OTP_MAX_ATTEMPTS
    ):

        await password_reset_otps_collection.delete_one(
            {
                "email":
                    email
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "Maximum OTP attempts exceeded. "
                    "Please request a new OTP."
                )
        }

    otp_hash = pending.get(
        "otp_hash"
    )

    if (
        not otp_hash
        or
        not verify_password(
            otp,
            otp_hash
        )
    ):

        new_attempts = (
            attempts
            +
            1
        )

        if (
            new_attempts
            >=
            OTP_MAX_ATTEMPTS
        ):

            await password_reset_otps_collection.delete_one(
                {
                    "email":
                        email
                }
            )

            return {
                "success":
                    False,

                "message":
                    (
                        "Invalid OTP. "
                        "Maximum OTP attempts exceeded. "
                        "Please request a new OTP."
                    )
            }

        await password_reset_otps_collection.update_one(
            {
                "email":
                    email
            },
            {
                "$set": {
                    "attempts":
                        new_attempts,

                    "updated_at":
                        now
                }
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    f"Invalid OTP. "
                    f"{OTP_MAX_ATTEMPTS - new_attempts} "
                    f"attempt(s) remaining."
                )
        }

    reset_token = secrets.token_urlsafe(
        32
    )

    reset_token_hash = hash_reset_token(
        reset_token
    )

    reset_token_expires_at = (
        now
        +
        timedelta(
            minutes=
                RESET_TOKEN_EXPIRY_MINUTES
        )
    )

    await password_reset_otps_collection.update_one(
        {
            "email":
                email
        },
        {
            "$set": {
                "otp_verified":
                    True,

                "reset_token_hash":
                    reset_token_hash,

                "reset_token_expires_at":
                    reset_token_expires_at,

                "updated_at":
                    now
            },

            "$unset": {
                "otp_hash":
                    ""
            }
        }
    )

    return {
        "success":
            True,

        "message":
            (
                "OTP verified successfully. "
                "You can now reset your password."
            ),

        "email":
            email,

        "reset_token":
            reset_token,

        "reset_token_expires_in_minutes":
            RESET_TOKEN_EXPIRY_MINUTES
    }


async def resend_forgot_password_otp(
    resend_data: ResendForgotPasswordOTPRequest
):

    email = normalize_email(
        resend_data.email
    )

    user = await users_collection.find_one(
        {
            "email":
                email
        }
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "No account found with this email."
        }

    pending = await password_reset_otps_collection.find_one(
        {
            "email":
                email
        }
    )

    if not pending:

        return {
            "success":
                False,

            "message":
                (
                    "No password reset request found. "
                    "Please request a new OTP."
                )
        }

    now = datetime.now(
        timezone.utc
    )

    retry_after = _get_retry_after(
        pending.get(
            "last_sent_at"
        ),
        now
    )

    if retry_after:

        return {
            "success":
                False,

            "message":
                (
                    f"Please wait {retry_after} second(s) "
                    f"before requesting another OTP."
                ),

            "retry_after":
                retry_after
        }

    otp = generate_email_otp()

    otp_hash = hash_password(
        otp
    )

    expires_at = (
        now
        +
        timedelta(
            minutes=
                OTP_EXPIRY_MINUTES
        )
    )

    await password_reset_otps_collection.update_one(
        {
            "email":
                email
        },
        {
            "$set": {
                "otp_hash":
                    otp_hash,

                "expires_at":
                    expires_at,

                "attempts":
                    0,

                "otp_verified":
                    False,

                "reset_token_hash":
                    None,

                "reset_token_expires_at":
                    None,

                "last_sent_at":
                    now,

                "updated_at":
                    now
            }
        }
    )

    try:

        await _send_otp_email_safe(
            email,
            otp
        )

    except Exception as error:

        return {
            "success":
                False,

            "message":
                (
                    "Unable to resend password reset OTP. "
                    "Please try again."
                ),

            "error":
                str(
                    error
                )
        }

    return {
        "success":
            True,

        "message":
            "New password reset OTP sent successfully.",

        "email":
            email,

        "otp_expires_in_minutes":
            OTP_EXPIRY_MINUTES
    }


async def reset_password(
    reset_data: ResetPasswordRequest
):

    email = normalize_email(
        reset_data.email
    )

    if (
        reset_data.new_password
        !=
        reset_data.confirm_password
    ):

        return {
            "success":
                False,

            "message":
                (
                    "New password and confirm password "
                    "do not match."
                )
        }

    user = await users_collection.find_one(
        {
            "email":
                email
        }
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "No account found with this email."
        }

    pending = await password_reset_otps_collection.find_one(
        {
            "email":
                email
        }
    )

    if not pending:

        return {
            "success":
                False,

            "message":
                (
                    "Password reset session "
                    "not found or expired."
                )
        }

    if (
        pending.get(
            "otp_verified"
        )
        is not True
    ):

        return {
            "success":
                False,

            "message":
                "Please verify your OTP first."
        }

    stored_token_hash = pending.get(
        "reset_token_hash"
    )

    if not stored_token_hash:

        return {
            "success":
                False,

            "message":
                "Invalid password reset session."
        }

    now = datetime.now(
        timezone.utc
    )

    token_expires_at = ensure_utc_datetime(
        pending.get(
            "reset_token_expires_at"
        )
    )

    if (
        not token_expires_at
        or
        now > token_expires_at
    ):

        await password_reset_otps_collection.delete_one(
            {
                "email":
                    email
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "Password reset session has expired. "
                    "Please request a new OTP."
                )
        }

    provided_token_hash = hash_reset_token(
        reset_data.reset_token
    )

    if not secrets.compare_digest(
        provided_token_hash,
        stored_token_hash
    ):

        return {
            "success":
                False,

            "message":
                "Invalid password reset token."
        }

    if verify_password(
        reset_data.new_password,
        user[
            "password_hash"
        ]
    ):

        return {
            "success":
                False,

            "message":
                (
                    "New password must be different "
                    "from your current password."
                )
        }

    new_password_hash = hash_password(
        reset_data.new_password
    )

    await users_collection.update_one(
        {
            "_id":
                user[
                    "_id"
                ]
        },
        {
            "$set": {
                "password_hash":
                    new_password_hash,

                "updated_at":
                    now
            }
        }
    )

    await password_reset_otps_collection.delete_one(
        {
            "email":
                email
        }
    )

    return {
        "success":
            True,

        "message":
            (
                "Password reset successfully. "
                "You can now login with your new password."
            )
    }


async def login_user(
    login_data: LoginRequest
):

    email = normalize_email(
        login_data.email
    )

    user = await users_collection.find_one(
        {
            "email":
                email
        }
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "Invalid email or password."
        }

    if (
        user.get(
            "status"
        )
        !=
        "active"
    ):

        return {
            "success":
                False,

            "message":
                "User account is inactive."
        }

    if (
        user.get(
            "is_email_verified"
        )
        is False
    ):

        return {
            "success":
                False,

            "message":
                (
                    "Please verify your email "
                    "before login."
                )
        }

    if not verify_password(
        login_data.password,
        user[
            "password_hash"
        ]
    ):

        return {
            "success":
                False,

            "message":
                "Invalid email or password."
        }

    access_token = create_access_token(
        {
            "sub":
                str(
                    user[
                        "_id"
                    ]
                ),

            "email":
                user[
                    "email"
                ],

            "role":
                user[
                    "role"
                ],
        }
    )

    return {
        "success":
            True,

        "message":
            "Login successful.",

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "role":
            user[
                "role"
            ]
    }


async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: dict
):

    user = await find_authenticated_user(
        current_user
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "Authenticated user not found."
        }

    if (
        user.get(
            "status",
            "active"
        )
        !=
        "active"
    ):

        return {
            "success":
                False,

            "message":
                "User account is inactive."
        }

    request_data = profile_data.model_dump(
        exclude_unset=True
    )

    set_fields = {}
    unset_fields = {}

    if (
        "full_name"
        in
        request_data
    ):

        full_name = request_data.get(
            "full_name"
        )

        if full_name is None:

            return {
                "success":
                    False,

                "message":
                    "Full name cannot be empty."
            }

        full_name = str(
            full_name
        ).strip()

        if (
            len(
                full_name
            )
            <
            2
        ):

            return {
                "success":
                    False,

                "message":
                    (
                        "Full name must contain "
                        "at least 2 characters."
                    )
            }

        set_fields[
            "full_name"
        ] = full_name

    if (
        "mobile"
        in
        request_data
    ):

        mobile = request_data.get(
            "mobile"
        )

        if mobile is None:

            unset_fields[
                "mobile"
            ] = ""

        else:

            mobile = str(
                mobile
            ).strip()

            if mobile:

                set_fields[
                    "mobile"
                ] = mobile

            else:

                unset_fields[
                    "mobile"
                ] = ""

    if (
        "location"
        in
        request_data
    ):

        location = request_data.get(
            "location"
        )

        if location is None:

            unset_fields[
                "location"
            ] = ""

        else:

            location = str(
                location
            ).strip()

            if location:

                set_fields[
                    "location"
                ] = location

            else:

                unset_fields[
                    "location"
                ] = ""

    if (
        not set_fields
        and
        not unset_fields
    ):

        return {
            "success":
                True,

            "message":
                "Profile is already up to date.",

            "user":
                serialize_user_profile(
                    user
                )
        }

    now = datetime.now(
        timezone.utc
    )

    set_fields[
        "updated_at"
    ] = now

    update_document = {
        "$set":
            set_fields
    }

    if unset_fields:

        update_document[
            "$unset"
        ] = unset_fields

    result = await users_collection.update_one(
        {
            "_id":
                user[
                    "_id"
                ]
        },
        update_document
    )

    if (
        result.matched_count
        !=
        1
    ):

        return {
            "success":
                False,

            "message":
                "Unable to update profile."
        }

    updated_user = await users_collection.find_one(
        {
            "_id":
                user[
                    "_id"
                ]
        }
    )

    if not updated_user:

        return {
            "success":
                False,

            "message":
                (
                    "Profile updated but "
                    "unable to reload user."
                )
        }

    return {
        "success":
            True,

        "message":
            "Profile updated successfully.",

        "user":
            serialize_user_profile(
                updated_user
            )
    }


async def update_settings(
    settings_data: SettingsUpdateRequest,
    current_user: dict
):

    user = await find_authenticated_user(
        current_user
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "Authenticated user not found."
        }

    if (
        user.get(
            "status",
            "active"
        )
        !=
        "active"
    ):

        return {
            "success":
                False,

            "message":
                "User account is inactive."
        }

    request_data = settings_data.model_dump(
        exclude_unset=True,
        exclude_none=True
    )

    set_fields = {}

    if (
        "preferences"
        in
        request_data
    ):

        set_fields[
            "preferences"
        ] = request_data[
            "preferences"
        ]

    if (
        "notifications"
        in
        request_data
    ):

        set_fields[
            "notifications"
        ] = request_data[
            "notifications"
        ]

    if (
        "privacy"
        in
        request_data
    ):

        set_fields[
            "privacy"
        ] = request_data[
            "privacy"
        ]

    if not set_fields:

        return {
            "success":
                True,

            "message":
                "Settings are already up to date.",

            "user":
                serialize_user_profile(
                    user
                )
        }

    set_fields[
        "updated_at"
    ] = datetime.now(
        timezone.utc
    )

    result = await users_collection.update_one(
        {
            "_id":
                user[
                    "_id"
                ]
        },
        {
            "$set":
                set_fields
        }
    )

    if (
        result.matched_count
        !=
        1
    ):

        return {
            "success":
                False,

            "message":
                "Unable to update settings."
        }

    updated_user = await users_collection.find_one(
        {
            "_id":
                user[
                    "_id"
                ]
        }
    )

    if not updated_user:

        return {
            "success":
                False,

            "message":
                (
                    "Settings updated but "
                    "unable to reload user."
                )
        }

    return {
        "success":
            True,

        "message":
            "Settings updated successfully.",

        "user":
            serialize_user_profile(
                updated_user
            )
    }


async def send_change_email_otp(
    email_data: ChangeEmailRequest,
    current_user: dict
):

    user = await find_authenticated_user(
        current_user
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "Authenticated user not found."
        }

    if (
        user.get(
            "status",
            "active"
        )
        !=
        "active"
    ):

        return {
            "success":
                False,

            "message":
                "User account is inactive."
        }

    current_email = normalize_email(
        user.get(
            "email"
        )
    )

    new_email = normalize_email(
        email_data.new_email
    )

    if (
        current_email
        ==
        new_email
    ):

        return {
            "success":
                False,

            "message":
                (
                    "New email must be different "
                    "from your current email."
                )
        }

    existing_user = await users_collection.find_one(
        {
            "email":
                new_email
        }
    )

    if (
        existing_user
        and
        str(
            existing_user.get(
                "_id"
            )
        )
        !=
        str(
            user.get(
                "_id"
            )
        )
    ):

        return {
            "success":
                False,

            "message":
                (
                    "This email address is "
                    "already registered."
                )
        }

    user_id = str(
        user[
            "_id"
        ]
    )

    pending = await email_change_otps_collection.find_one(
        {
            "user_id":
                user_id
        }
    )

    now = datetime.now(
        timezone.utc
    )

    if pending:

        pending_email = normalize_email(
            pending.get(
                "new_email"
            )
        )

        if (
            pending_email
            ==
            new_email
        ):

            retry_after = _get_retry_after(
                pending.get(
                    "last_sent_at"
                ),
                now
            )

            if retry_after:

                return {
                    "success":
                        False,

                    "message":
                        (
                            f"Please wait {retry_after} second(s) "
                            f"before requesting another OTP."
                        ),

                    "retry_after":
                        retry_after
                }

    otp = generate_email_otp()

    otp_hash = hash_password(
        otp
    )

    expires_at = (
        now
        +
        timedelta(
            minutes=
                OTP_EXPIRY_MINUTES
        )
    )

    pending_data = {
        "user_id":
            user_id,

        "current_email":
            current_email,

        "new_email":
            new_email,

        "otp_hash":
            otp_hash,

        "expires_at":
            expires_at,

        "attempts":
            0,

        "last_sent_at":
            now,

        "created_at":
            (
                pending.get(
                    "created_at"
                )
                if pending
                else now
            ),

        "updated_at":
            now,
    }

    await email_change_otps_collection.update_one(
        {
            "user_id":
                user_id
        },
        {
            "$set":
                pending_data
        },
        upsert=True
    )

    try:

        await _send_otp_email_safe(
            new_email,
            otp
        )

    except Exception as error:

        await email_change_otps_collection.delete_one(
            {
                "user_id":
                    user_id
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "Unable to send email change OTP. "
                    "Please try again."
                ),

            "error":
                str(
                    error
                )
        }

    return {
        "success":
            True,

        "message":
            (
                "Verification OTP sent "
                "to your new email address."
            ),

        "new_email":
            new_email,

        "otp_expires_in_minutes":
            OTP_EXPIRY_MINUTES
    }


async def verify_change_email_otp(
    otp_data: VerifyChangeEmailRequest,
    current_user: dict
):

    user = await find_authenticated_user(
        current_user
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "Authenticated user not found."
        }

    if (
        user.get(
            "status",
            "active"
        )
        !=
        "active"
    ):

        return {
            "success":
                False,

            "message":
                "User account is inactive."
        }

    user_id = str(
        user[
            "_id"
        ]
    )

    current_email = normalize_email(
        user.get(
            "email"
        )
    )

    new_email = normalize_email(
        otp_data.new_email
    )

    otp = str(
        otp_data.otp
    ).strip()

    pending = await email_change_otps_collection.find_one(
        {
            "user_id":
                user_id
        }
    )

    if not pending:

        return {
            "success":
                False,

            "message":
                (
                    "No pending email change request found. "
                    "Please request a new OTP."
                )
        }

    pending_new_email = normalize_email(
        pending.get(
            "new_email"
        )
    )

    pending_current_email = normalize_email(
        pending.get(
            "current_email"
        )
    )

    if (
        pending_new_email
        !=
        new_email
    ):

        return {
            "success":
                False,

            "message":
                (
                    "Email does not match the pending "
                    "email change request."
                )
        }

    if (
        pending_current_email
        and
        pending_current_email
        !=
        current_email
    ):

        await email_change_otps_collection.delete_one(
            {
                "user_id":
                    user_id
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "Your account email changed after "
                    "this OTP was requested. "
                    "Please start again."
                )
        }

    now = datetime.now(
        timezone.utc
    )

    expires_at = ensure_utc_datetime(
        pending.get(
            "expires_at"
        )
    )

    if (
        not expires_at
        or
        now > expires_at
    ):

        await email_change_otps_collection.delete_one(
            {
                "user_id":
                    user_id
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "OTP has expired. "
                    "Please request a new OTP."
                )
        }

    attempts = int(
        pending.get(
            "attempts",
            0
        )
    )

    if (
        attempts
        >=
        OTP_MAX_ATTEMPTS
    ):

        await email_change_otps_collection.delete_one(
            {
                "user_id":
                    user_id
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "Maximum OTP attempts exceeded. "
                    "Please request a new OTP."
                )
        }

    otp_hash = pending.get(
        "otp_hash"
    )

    if (
        not otp_hash
        or
        not verify_password(
            otp,
            otp_hash
        )
    ):

        new_attempts = (
            attempts
            +
            1
        )

        if (
            new_attempts
            >=
            OTP_MAX_ATTEMPTS
        ):

            await email_change_otps_collection.delete_one(
                {
                    "user_id":
                        user_id
                }
            )

            return {
                "success":
                    False,

                "message":
                    (
                        "Invalid OTP. "
                        "Maximum OTP attempts exceeded. "
                        "Please request a new OTP."
                    )
            }

        await email_change_otps_collection.update_one(
            {
                "user_id":
                    user_id
            },
            {
                "$set": {
                    "attempts":
                        new_attempts,

                    "updated_at":
                        now
                }
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    f"Invalid OTP. "
                    f"{OTP_MAX_ATTEMPTS - new_attempts} "
                    f"attempt(s) remaining."
                )
        }

    existing_user = await users_collection.find_one(
        {
            "email":
                new_email
        }
    )

    if (
        existing_user
        and
        str(
            existing_user.get(
                "_id"
            )
        )
        !=
        user_id
    ):

        await email_change_otps_collection.delete_one(
            {
                "user_id":
                    user_id
            }
        )

        return {
            "success":
                False,

            "message":
                (
                    "This email address is "
                    "already registered."
                )
        }

    update_result = await users_collection.update_one(
        {
            "_id":
                user[
                    "_id"
                ]
        },
        {
            "$set": {
                "email":
                    new_email,

                "is_email_verified":
                    True,

                "email_verified_at":
                    now,

                "updated_at":
                    now
            }
        }
    )

    if (
        update_result.matched_count
        !=
        1
    ):

        return {
            "success":
                False,

            "message":
                "Unable to update email address."
        }

    await email_change_otps_collection.delete_one(
        {
            "user_id":
                user_id
        }
    )

    if current_email:

        await password_reset_otps_collection.delete_many(
            {
                "email":
                    current_email
            }
        )

    await email_otps_collection.delete_many(
        {
            "email":
                new_email
        }
    )

    updated_user = await users_collection.find_one(
        {
            "_id":
                user[
                    "_id"
                ]
        }
    )

    if not updated_user:

        return {
            "success":
                False,

            "message":
                (
                    "Email updated, but unable "
                    "to reload user profile."
                )
        }

    return {
        "success":
            True,

        "message":
            "Email verified and updated successfully.",

        "user":
            serialize_user_profile(
                updated_user
            ),

        "requires_relogin":
            True
    }


async def change_password(
    password_data: ChangePasswordRequest,
    current_user: dict
):

    user = await find_authenticated_user(
        current_user
    )

    if not user:

        return {
            "success":
                False,

            "message":
                "Authenticated user not found."
        }

    if (
        user.get(
            "status",
            "active"
        )
        !=
        "active"
    ):

        return {
            "success":
                False,

            "message":
                "User account is inactive."
        }

    if (
        password_data.new_password
        !=
        password_data.confirm_password
    ):

        return {
            "success":
                False,

            "message":
                (
                    "New password and confirm "
                    "password do not match."
                )
        }

    current_password_hash = user.get(
        "password_hash"
    )

    if not current_password_hash:

        return {
            "success":
                False,

            "message":
                "Password information not found."
        }

    if not verify_password(
        password_data.current_password,
        current_password_hash
    ):

        return {
            "success":
                False,

            "message":
                "Current password is incorrect."
        }

    if verify_password(
        password_data.new_password,
        current_password_hash
    ):

        return {
            "success":
                False,

            "message":
                (
                    "New password must be different "
                    "from current password."
                )
        }

    new_password_hash = hash_password(
        password_data.new_password
    )

    now = datetime.now(
        timezone.utc
    )

    result = await users_collection.update_one(
        {
            "_id":
                user[
                    "_id"
                ]
        },
        {
            "$set": {
                "password_hash":
                    new_password_hash,

                "updated_at":
                    now
            }
        }
    )

    if (
        result.matched_count
        !=
        1
    ):

        return {
            "success":
                False,

            "message":
                "Unable to update password."
        }

    return {
        "success":
            True,

        "message":
            "Password changed successfully."
    }