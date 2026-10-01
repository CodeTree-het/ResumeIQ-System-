import re
from datetime import datetime, timezone

from bson import ObjectId

from backend.database.mongodb import database
from backend.schemas.chatbot_schema import (
    ChatbotRequest,
)

from backend.services.auth_service import (
    OTP_EXPIRY_MINUTES,
    OTP_RESEND_COOLDOWN_SECONDS,
    email_change_otps_collection,
    ensure_utc_datetime,
    find_authenticated_user,
    normalize_email,
    users_collection,
)


# =========================================================
# COLLECTIONS
# =========================================================

resumes_collection = database["resumes"]


# =========================================================
# CONSTANTS
# =========================================================

EMAIL_PATTERN = re.compile(
    r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
)


# =========================================================
# MAIN CHATBOT SERVICE
# =========================================================

async def process_chatbot_message(
    chatbot_data: ChatbotRequest,
    current_user: dict,
):

    message = str(
        chatbot_data.message
        or
        ""
    ).strip()

    lowered = message.lower()

    context = (
        chatbot_data.context.model_dump()
        if chatbot_data.context
        else {}
    )

    page = str(
        context.get(
            "page"
        )
        or
        ""
    ).lower().strip()

    issue_type = str(
        context.get(
            "issue_type"
        )
        or
        ""
    ).lower().strip()


    # -----------------------------------------------------
    # AUTHENTICATED USER
    # -----------------------------------------------------

    user = await find_authenticated_user(
        current_user
    )


    if not user:

        return build_response(
            message=(
                "I could not identify your ResumeIQ account. "
                "Please login again and then reopen the assistant."
            ),
            response_type="general_help",
            action_required=True,
            action="login_again",
        )


    # -----------------------------------------------------
    # EMAIL CHANGE / OTP DIAGNOSTICS
    # -----------------------------------------------------

    if (
        issue_type
        in {
            "email",
            "email_change",
            "email_otp",
            "otp",
        }
        or
        contains_any(
            lowered,
            [
                "otp",
                "email change",
                "change email",
                "email id",
                "new email",
                "otp not received",
                "otp nathi",
                "otp nahi",
                "wrong email",
                "different email",
            ]
        )
    ):

        return await diagnose_email_change(
            message=message,
            user=user,
        )


    # -----------------------------------------------------
    # SETTINGS
    # -----------------------------------------------------

    if (
        issue_type
        in {
            "settings",
            "preferences",
            "privacy",
            "notifications",
        }
        or
        contains_any(
            lowered,
            [
                "setting",
                "settings",
                "preference",
                "preferences",
                "notification",
                "privacy",
                "location save",
                "not saving",
                "save nathi",
                "save nahi",
            ]
        )
    ):

        return await diagnose_settings(
            message=message,
            user=user,
        )


    # -----------------------------------------------------
    # RESUME UPLOAD
    # -----------------------------------------------------

    if (
        issue_type
        in {
            "resume_upload",
            "upload",
        }
        or
        contains_any(
            lowered,
            [
                "resume upload",
                "upload resume",
                "upload error",
                "upload problem",
                "pdf upload",
                "docx upload",
                "file upload",
                "10 mb",
            ]
        )
    ):

        return await diagnose_resume_upload(
            message=message,
            user=user,
        )


    # -----------------------------------------------------
    # RESUME ANALYSIS
    # -----------------------------------------------------

    if (
        issue_type
        in {
            "analysis",
            "resume_analysis",
        }
        or
        contains_any(
            lowered,
            [
                "analysis",
                "analysis page",
                "analysis blank",
                "analysis not showing",
                "analysis error",
                "ats score",
                "resume score",
            ]
        )
    ):

        return await diagnose_resume_analysis(
            message=message,
            user=user,
        )


    # -----------------------------------------------------
    # LOGIN / SESSION
    # -----------------------------------------------------

    if contains_any(
        lowered,
        [
            "login",
            "session expired",
            "token expired",
            "unauthorized",
            "401",
        ]
    ):

        return build_response(
            message=(
                "Your current chatbot request is authenticated, "
                "so ResumeIQ can identify your account right now. "
                "If another page shows a 401 or session-expired error, "
                "login again so the page receives a fresh access token."
            ),
            response_type="general_help",
            action_required=False,
            action=None,
        )


    # -----------------------------------------------------
    # PASSWORD
    # -----------------------------------------------------

    if contains_any(
        lowered,
        [
            "password",
            "change password",
            "forgot password",
            "reset password",
        ]
    ):

        return diagnose_password(
            message
        )


    # -----------------------------------------------------
    # JOB MATCHING
    # -----------------------------------------------------

    if (
        issue_type
        in {
            "job_match",
            "job_matching",
        }
        or
        contains_any(
            lowered,
            [
                "job match",
                "job matching",
                "matching job",
                "job score",
            ]
        )
    ):

        return build_response(
            message=(
                "Candidate Job Matching is not fully implemented yet. "
                "When that module is connected, this assistant can check "
                "the user's resume, predicted role, matching jobs and "
                "job-match results directly."
            ),
            response_type="general_help",
            action_required=False,
            action="job_matching_pending",
        )


    # -----------------------------------------------------
    # SKILL GAP
    # -----------------------------------------------------

    if (
        issue_type
        in {
            "skill_gap",
            "skills",
        }
        or
        contains_any(
            lowered,
            [
                "skill gap",
                "missing skill",
                "missing skills",
                "future skill",
            ]
        )
    ):

        return build_response(
            message=(
                "The Skill Gap module is still pending final implementation. "
                "After it is connected, the assistant can compare extracted "
                "resume skills with target-role skills and explain the exact "
                "missing skills."
            ),
            response_type="general_help",
            action_required=False,
            action="skill_gap_pending",
        )


    # -----------------------------------------------------
    # RECRUITER
    # -----------------------------------------------------

    if (
        issue_type
        in {
            "recruiter",
            "recruiter_dashboard",
        }
        or
        contains_any(
            lowered,
            [
                "recruiter",
                "candidate search",
                "shortlist",
                "job posting",
            ]
        )
    ):

        return build_response(
            message=(
                "Recruiter-side functionality is still under development. "
                "Once recruiter APIs are ready, this assistant can diagnose "
                "job posting, candidate matching, shortlisting and recruiter "
                "dashboard problems."
            ),
            response_type="general_help",
            action_required=False,
            action="recruiter_module_pending",
        )


    # -----------------------------------------------------
    # COMMON HTTP ERRORS
    # -----------------------------------------------------

    if contains_any(
        lowered,
        [
            "500",
            "internal server error",
        ]
    ):

        return build_response(
            message=(
                "HTTP 500 means the backend encountered an internal error. "
                "Check the Uvicorn terminal and paste the complete traceback "
                "into this chatbot. The traceback usually shows the exact "
                "Python file and line causing the failure."
            ),
            response_type="general_help",
            action_required=True,
            action="check_backend_traceback",
        )


    if contains_any(
        lowered,
        [
            "404",
            "not found",
        ]
    ):

        return build_response(
            message=(
                "HTTP 404 usually means the frontend called an API route "
                "that does not exist, or used a wrong resume/resource ID. "
                "Check the requested URL and compare it with FastAPI /docs."
            ),
            response_type="general_help",
            action_required=True,
            action="check_api_route",
        )


    if contains_any(
        lowered,
        [
            "422",
            "validation error",
        ]
    ):

        return build_response(
            message=(
                "HTTP 422 means the request reached FastAPI but the sent "
                "JSON does not match the backend schema. Check field names, "
                "required values and data types."
            ),
            response_type="general_help",
            action_required=True,
            action="check_request_body",
        )


    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    if contains_any(
        lowered,
        [
            "mongodb",
            "database",
            "where data",
            "where save",
            "users collection",
        ]
    ):

        return await diagnose_database(
            user=user
        )


    # -----------------------------------------------------
    # PAGE CONTEXT
    # -----------------------------------------------------

    if page:

        return build_response(
            message=(
                f"You are asking from the '{page}' area of ResumeIQ. "
                "Tell me the exact problem or paste the exact error message. "
                "I can then check the relevant account state and guide you."
            ),
            response_type="general_help",
            action_required=False,
            action=None,
        )


    # -----------------------------------------------------
    # DEFAULT
    # -----------------------------------------------------

    return build_response(
        message=(
            "I can help diagnose ResumeIQ problems related to account, "
            "email OTP, settings, resume upload, resume analysis, API errors, "
            "database issues and other ResumeIQ workflows. "
            "Describe the exact problem or paste the error message."
        ),
        response_type="general_help",
        action_required=False,
        action=None,
    )


# =========================================================
# EMAIL CHANGE DIAGNOSTIC
# =========================================================

async def diagnose_email_change(
    message: str,
    user: dict,
):

    user_id = str(
        user.get(
            "_id"
        )
        or
        ""
    )

    current_email = normalize_email(
        user.get(
            "email"
        )
    )


    pending = await email_change_otps_collection.find_one(
        {
            "user_id":
                user_id
        }
    )


    # -----------------------------------------------------
    # NO PENDING EMAIL CHANGE
    # -----------------------------------------------------

    if not pending:

        return build_response(
            message=(
                "I checked your ResumeIQ account and there is currently "
                "no pending email-change OTP request. "
                "Open Settings → Change Email, enter the new email address "
                "and click Send OTP."
            ),
            response_type="email_diagnostic",
            action_required=True,
            action="request_new_email_otp",
        )


    pending_email = normalize_email(
        pending.get(
            "new_email"
        )
    )

    pending_current_email = normalize_email(
        pending.get(
            "current_email"
        )
    )


    now = datetime.now(
        timezone.utc
    )


    expires_at = ensure_utc_datetime(
        pending.get(
            "expires_at"
        )
    )


    last_sent_at = ensure_utc_datetime(
        pending.get(
            "last_sent_at"
        )
    )


    attempts = int(
        pending.get(
            "attempts",
            0
        )
    )


    # -----------------------------------------------------
    # ACCOUNT EMAIL CHANGED AFTER OTP REQUEST
    # -----------------------------------------------------

    if (
        pending_current_email
        and
        current_email
        and
        pending_current_email
        !=
        current_email
    ):

        return build_response(
            message=(
                "The pending OTP request belongs to an older account-email "
                "state. Please cancel that flow and request a fresh email-change OTP."
            ),
            response_type="email_diagnostic",
            action_required=True,
            action="request_new_email_otp",
        )


    # -----------------------------------------------------
    # EXPIRED OTP
    # -----------------------------------------------------

    if (
        not expires_at
        or
        now > expires_at
    ):

        return build_response(
            message=(
                f"I found a pending email-change request for "
                f"{mask_email(pending_email)}, but its OTP has expired. "
                "Please request a new OTP from Settings → Change Email."
            ),
            response_type="email_diagnostic",
            action_required=True,
            action="resend_email_otp",
        )


    # -----------------------------------------------------
    # ATTEMPTS
    # -----------------------------------------------------

    if attempts >= 5:

        return build_response(
            message=(
                "The maximum OTP verification attempts have been reached. "
                "Please start the Change Email process again and request a new OTP."
            ),
            response_type="email_diagnostic",
            action_required=True,
            action="request_new_email_otp",
        )


    # -----------------------------------------------------
    # EXTRACT EMAIL USER TYPED IN CHAT
    # -----------------------------------------------------

    supplied_email = extract_email(
        message
    )


    if not supplied_email:

        return build_response(
            message=(
                "I found an active email-change OTP request. "
                "Please type the new email address that you believe you entered "
                "when requesting the OTP. I will compare it with the pending request."
            ),
            response_type="email_diagnostic",
            action_required=True,
            action="provide_expected_email",
        )


    supplied_email = normalize_email(
        supplied_email
    )


    # -----------------------------------------------------
    # EMAIL MISMATCH
    # -----------------------------------------------------

    if (
        supplied_email
        !=
        pending_email
    ):

        return build_response(
            message=(
                "The email you just provided does not match the email used "
                "for the pending OTP request. "
                f"The pending OTP was requested for "
                f"{mask_email(pending_email)}, while you provided "
                f"{mask_email(supplied_email)}. "
                "That is why checking the other inbox will not show this OTP. "
                "Use the originally requested email or start Change Email again "
                "with the correct address."
            ),
            response_type="email_diagnostic",
            action_required=True,
            action="correct_email_or_request_new_otp",
        )


    # -----------------------------------------------------
    # MATCHES
    # -----------------------------------------------------

    remaining_seconds = None


    if last_sent_at:

        elapsed = (
            now
            -
            last_sent_at
        ).total_seconds()

        remaining_seconds = max(
            0,
            int(
                OTP_RESEND_COOLDOWN_SECONDS
                -
                elapsed
            )
        )


    if (
        remaining_seconds
        and
        remaining_seconds > 0
    ):

        return build_response(
            message=(
                f"Yes, the email you provided matches the pending OTP request: "
                f"{mask_email(pending_email)}. "
                "The OTP request is still active. "
                f"If you want to resend it, wait about "
                f"{remaining_seconds} more second(s). "
                "Also check Spam/Junk folders."
            ),
            response_type="email_diagnostic",
            action_required=False,
            action="wait_or_check_inbox",
        )


    return build_response(
        message=(
            f"Yes, the email you provided matches the pending OTP request: "
            f"{mask_email(pending_email)}. "
            "The OTP request is still active. "
            "Check Inbox and Spam/Junk. If it did not arrive, "
            "you can request another OTP."
        ),
        response_type="email_diagnostic",
        action_required=False,
        action="resend_if_needed",
    )


# =========================================================
# SETTINGS DIAGNOSTIC
# =========================================================

async def diagnose_settings(
    message: str,
    user: dict,
):

    preferences = (
        user.get(
            "preferences"
        )
        or
        {}
    )

    notifications = (
        user.get(
            "notifications"
        )
        or
        {}
    )

    privacy = (
        user.get(
            "privacy"
        )
        or
        {}
    )


    location = user.get(
        "location"
    )


    parts = [
        "I checked the settings currently stored for your ResumeIQ account."
    ]


    if location:

        parts.append(
            f"Location is stored as '{location}'."
        )

    else:

        parts.append(
            "No location is currently stored."
        )


    if preferences:

        parts.append(
            "Resume & Job Preferences are present in the user document."
        )

    else:

        parts.append(
            "Resume & Job Preferences are not yet stored for this account."
        )


    if notifications:

        parts.append(
            "Notification settings are present."
        )

    else:

        parts.append(
            "Notification settings are not yet stored."
        )


    if privacy:

        parts.append(
            "Privacy settings are present."
        )

    else:

        parts.append(
            "Privacy settings are not yet stored."
        )


    parts.append(
        "If a value on the Settings page looks different from the database, "
        "the next check should be the PATCH /api/auth/me or "
        "PATCH /api/auth/settings request in the browser Network tab."
    )


    return build_response(
        message=" ".join(
            parts
        ),
        response_type="settings_diagnostic",
        action_required=False,
        action="check_settings_api_if_ui_differs",
    )


# =========================================================
# RESUME UPLOAD DIAGNOSTIC
# =========================================================

async def diagnose_resume_upload(
    message: str,
    user: dict,
):

    resume_count = await count_user_resumes(
        user
    )


    if resume_count > 0:

        return build_response(
            message=(
                f"I found {resume_count} resume record(s) linked to your account. "
                "So ResumeIQ has stored resume data before. "
                "For a new upload problem, make sure the file is PDF or DOCX, "
                "maximum 10 MB, and then check the upload API response."
            ),
            response_type="resume_diagnostic",
            action_required=False,
            action="check_upload_request",
        )


    return build_response(
        message=(
            "I could not find a resume record linked to your current account "
            "using the standard ResumeIQ ownership fields. "
            "For your first upload, use PDF or DOCX, keep the file under 10 MB "
            "and check that POST /api/resumes/upload succeeds."
        ),
        response_type="resume_diagnostic",
        action_required=True,
        action="upload_resume",
    )


# =========================================================
# RESUME ANALYSIS DIAGNOSTIC
# =========================================================

async def diagnose_resume_analysis(
    message: str,
    user: dict,
):

    resume_count = await count_user_resumes(
        user
    )


    if resume_count == 0:

        return build_response(
            message=(
                "I cannot find a resume linked to this account, so Resume Analysis "
                "cannot run yet. Upload a resume first, then open Analysis."
            ),
            response_type="resume_diagnostic",
            action_required=True,
            action="upload_resume_first",
        )


    return build_response(
        message=(
            f"I found {resume_count} resume record(s) for this account. "
            "If the Analysis page is blank, the next check is whether the selected "
            "resume has analysis data and whether "
            "GET /api/resumes/{resume_id}/analysis returns 200. "
            "If you paste that API response or error here, I can diagnose it further."
        ),
        response_type="resume_diagnostic",
        action_required=False,
        action="check_resume_analysis_api",
    )


# =========================================================
# DATABASE DIAGNOSTIC
# =========================================================

async def diagnose_database(
    user: dict,
):

    user_id = str(
        user.get(
            "_id"
        )
        or
        ""
    )


    return build_response(
        message=(
            "Your authenticated ResumeIQ account exists in the MongoDB "
            "'users' collection. "
            f"Current user document ID: {user_id}. "
            "Profile, location, preferences, notifications and privacy "
            "are stored inside that user document when saved."
        ),
        response_type="general_help",
        action_required=False,
        action=None,
    )


# =========================================================
# PASSWORD DIAGNOSTIC
# =========================================================

def diagnose_password(
    message: str,
):

    lowered = message.lower()


    if contains_any(
        lowered,
        [
            "current password",
            "incorrect",
            "wrong password",
        ]
    ):

        return build_response(
            message=(
                "If ResumeIQ says the current password is incorrect, "
                "the password entered in Settings does not match the stored "
                "password hash. Re-enter your current login password. "
                "If you no longer know it, use Forgot Password instead."
            ),
            response_type="general_help",
            action_required=True,
            action="retry_or_reset_password",
        )


    if contains_any(
        lowered,
        [
            "confirm",
            "not match",
            "mismatch",
        ]
    ):

        return build_response(
            message=(
                "The new password and confirm-password values must be identical. "
                "Enter the same new password in both fields."
            ),
            response_type="general_help",
            action_required=True,
            action="match_password_fields",
        )


    return build_response(
        message=(
            "For Change Password, ResumeIQ requires your current password, "
            "a new password of at least 8 characters, and matching confirmation. "
            "The new password must also be different from the current password."
        ),
        response_type="general_help",
        action_required=False,
        action=None,
    )


# =========================================================
# RESUME OWNERSHIP HELPERS
# =========================================================

async def count_user_resumes(
    user: dict,
) -> int:

    user_id = user.get(
        "_id"
    )

    email = normalize_email(
        user.get(
            "email"
        )
    )


    if not user_id:

        return 0


    possible_values = [
        str(
            user_id
        )
    ]


    if isinstance(
        user_id,
        ObjectId
    ):

        possible_values.append(
            user_id
        )


    query_parts = []


    for value in possible_values:

        query_parts.extend(
            [
                {
                    "user_id":
                        value
                },
                {
                    "candidate_id":
                        value
                },
                {
                    "owner_id":
                        value
                },
                {
                    "uploaded_by":
                        value
                },
            ]
        )


    if email:

        query_parts.extend(
            [
                {
                    "email":
                        email
                },
                {
                    "user_email":
                        email
                },
            ]
        )


    if not query_parts:

        return 0


    try:

        return await resumes_collection.count_documents(
            {
                "$or":
                    query_parts
            }
        )

    except Exception:

        return 0


# =========================================================
# TEXT HELPERS
# =========================================================

def contains_any(
    text: str,
    values: list[str],
) -> bool:

    return any(
        value
        in
        text
        for value
        in
        values
    )


def extract_email(
    text: str,
) -> str | None:

    match = EMAIL_PATTERN.search(
        text
    )


    if not match:

        return None


    return match.group(
        0
    )


# =========================================================
# EMAIL MASKING
# =========================================================

def mask_email(
    email: str,
) -> str:

    email = normalize_email(
        email
    )


    if (
        not email
        or
        "@"
        not in
        email
    ):

        return "the requested email address"


    local_part, domain = email.split(
        "@",
        1
    )


    if len(
        local_part
    ) <= 2:

        masked_local = (
            local_part[
                :1
            ]
            +
            "*"
        )

    else:

        masked_local = (
            local_part[
                :2
            ]
            +
            (
                "*"
                *
                max(
                    2,
                    len(
                        local_part
                    )
                    -
                    2
                )
            )
        )


    return (
        f"{masked_local}@{domain}"
    )


# =========================================================
# STANDARD RESPONSE
# =========================================================

def build_response(
    message: str,
    response_type: str = "text",
    action_required: bool = False,
    action: str | None = None,
):

    return {
        "success":
            True,

        "message":
            message,

        "data": {
            "type":
                response_type,

            "action_required":
                action_required,

            "action":
                action,
        },
    }