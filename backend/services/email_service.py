import os
import secrets
import smtplib

from email.message import EmailMessage

from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()


SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "smtp.gmail.com"
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587"
    )
)

SMTP_EMAIL = os.getenv(
    "SMTP_EMAIL"
)

SMTP_APP_PASSWORD = os.getenv(
    "SMTP_APP_PASSWORD"
)

SMTP_FROM_NAME = os.getenv(
    "SMTP_FROM_NAME",
    "ResumeIQ"
)

OTP_EXPIRY_MINUTES = int(
    os.getenv(
        "OTP_EXPIRY_MINUTES",
        "5"
    )
)


# =========================================================
# GENERATE 6-DIGIT OTP
# =========================================================

def generate_email_otp() -> str:
    """
    Generate secure 6-digit OTP.
    """

    return str(
        secrets.randbelow(
            900000
        )
        +
        100000
    )


# =========================================================
# VALIDATE SMTP CONFIGURATION
# =========================================================

def validate_smtp_configuration():
    """
    Ensure required SMTP values exist.
    """

    if not SMTP_EMAIL:
        raise ValueError(
            "SMTP_EMAIL is missing in .env file."
        )

    if not SMTP_APP_PASSWORD:
        raise ValueError(
            "SMTP_APP_PASSWORD is missing in .env file."
        )


# =========================================================
# SEND OTP EMAIL
# =========================================================

def send_otp_email(
    recipient_email: str,
    otp: str
) -> bool:
    """
    Send ResumeIQ verification OTP
    using Gmail SMTP.
    """

    validate_smtp_configuration()


    if not recipient_email:
        raise ValueError(
            "Recipient email is required."
        )


    # =====================================================
    # EMAIL MESSAGE
    # =====================================================

    message = EmailMessage()


    message["Subject"] = (
        "ResumeIQ Email Verification OTP"
    )


    message["From"] = (
        f"{SMTP_FROM_NAME} <{SMTP_EMAIL}>"
    )


    message["To"] = recipient_email


    # =====================================================
    # PLAIN TEXT VERSION
    # =====================================================

    message.set_content(
        f"""
Hello,

Welcome to ResumeIQ.

Your email verification OTP is:

{otp}

This OTP is valid for {OTP_EXPIRY_MINUTES} minutes.

Do not share this OTP with anyone.

If you did not request this verification,
you can ignore this email.

Regards,
ResumeIQ Team
"""
    )


    # =====================================================
    # HTML VERSION
    # =====================================================

    html_content = f"""
    <!DOCTYPE html>

    <html>

    <body
        style="
            margin: 0;
            padding: 0;
            background-color: #f5f8fc;
            font-family: Arial, sans-serif;
        "
    >

        <div
            style="
                max-width: 520px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 14px;
                overflow: hidden;
                border: 1px solid #e4eaf2;
            "
        >

            <div
                style="
                    padding: 24px 28px;
                    background-color: #0f6cf3;
                    text-align: center;
                "
            >

                <div
                    style="
                        color: #ffffff;
                        font-size: 26px;
                        font-weight: 700;
                    "
                >
                    ResumeIQ
                </div>

                <div
                    style="
                        margin-top: 5px;
                        color: #dbe9ff;
                        font-size: 12px;
                    "
                >
                    AI-Powered Resume Intelligence
                </div>

            </div>


            <div
                style="
                    padding: 32px 30px;
                    text-align: center;
                "
            >

                <h2
                    style="
                        margin: 0 0 10px;
                        color: #17233f;
                    "
                >
                    Verify Your Email
                </h2>


                <p
                    style="
                        margin: 0;
                        color: #6f7f96;
                        font-size: 14px;
                        line-height: 1.6;
                    "
                >
                    Use the verification code below
                    to complete your ResumeIQ registration.
                </p>


                <div
                    style="
                        margin: 28px auto;
                        padding: 18px 20px;
                        max-width: 250px;
                        background-color: #eef5ff;
                        border-radius: 12px;
                        color: #0f6cf3;
                        font-size: 34px;
                        font-weight: 700;
                        letter-spacing: 8px;
                    "
                >
                    {otp}
                </div>


                <p
                    style="
                        color: #64748b;
                        font-size: 13px;
                    "
                >
                    This OTP is valid for
                    <strong>
                        {OTP_EXPIRY_MINUTES} minutes
                    </strong>.
                </p>


                <p
                    style="
                        margin-top: 22px;
                        color: #9aa5b5;
                        font-size: 11px;
                    "
                >
                    Never share your OTP with anyone.
                </p>

            </div>


            <div
                style="
                    padding: 16px;
                    background-color: #f8fafc;
                    text-align: center;
                    color: #98a4b5;
                    font-size: 10px;
                "
            >
                © 2026 ResumeIQ
            </div>

        </div>

    </body>

    </html>
    """


    message.add_alternative(
        html_content,
        subtype="html"
    )


    # =====================================================
    # SEND THROUGH GMAIL SMTP
    # =====================================================

    try:

        with smtplib.SMTP(
            SMTP_HOST,
            SMTP_PORT,
            timeout=30
        ) as server:

            server.ehlo()

            server.starttls()

            server.ehlo()

            server.login(
                SMTP_EMAIL,
                SMTP_APP_PASSWORD
            )

            server.send_message(
                message
            )


        return True


    except smtplib.SMTPAuthenticationError as error:

        raise RuntimeError(
            "Gmail authentication failed. "
            "Check SMTP_EMAIL and Gmail App Password."
        ) from error


    except smtplib.SMTPException as error:

        raise RuntimeError(
            f"Unable to send OTP email: {error}"
        ) from error


    except Exception as error:

        raise RuntimeError(
            f"Email service error: {error}"
        ) from error