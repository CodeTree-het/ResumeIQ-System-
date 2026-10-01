// =========================================================
// ResumeIQ - Forgot Password + Email OTP Verification
// =========================================================

const FORGOT_API_BASE_URL =
    "http://127.0.0.1:8000";


// =========================================================
// DOM ELEMENTS
// =========================================================

const forgotEmailStep =
    document.getElementById(
        "forgotEmailStep"
    );

const forgotOtpStep =
    document.getElementById(
        "forgotOtpStep"
    );

const forgotPasswordStep =
    document.getElementById(
        "forgotPasswordStep"
    );


// Forms

const forgotEmailForm =
    document.getElementById(
        "forgotEmailForm"
    );

const forgotOtpForm =
    document.getElementById(
        "forgotOtpForm"
    );

const resetPasswordForm =
    document.getElementById(
        "resetPasswordForm"
    );


// Alerts

const forgotEmailAlert =
    document.getElementById(
        "forgotEmailAlert"
    );

const forgotOtpAlert =
    document.getElementById(
        "forgotOtpAlert"
    );

const resetPasswordAlert =
    document.getElementById(
        "resetPasswordAlert"
    );


// Email

const forgotEmailInput =
    document.getElementById(
        "forgotEmail"
    );

const forgotOtpEmailDisplay =
    document.getElementById(
        "forgotOtpEmailDisplay"
    );


// Send OTP button

const sendForgotOtpButton =
    document.getElementById(
        "sendForgotOtpButton"
    );

const sendForgotOtpText =
    document.getElementById(
        "sendForgotOtpText"
    );

const sendForgotOtpSpinner =
    document.getElementById(
        "sendForgotOtpSpinner"
    );

const sendForgotOtpArrow =
    document.getElementById(
        "sendForgotOtpArrow"
    );


// Verify OTP button

const verifyForgotOtpButton =
    document.getElementById(
        "verifyForgotOtpButton"
    );

const verifyForgotOtpText =
    document.getElementById(
        "verifyForgotOtpText"
    );

const verifyForgotOtpSpinner =
    document.getElementById(
        "verifyForgotOtpSpinner"
    );

const verifyForgotOtpArrow =
    document.getElementById(
        "verifyForgotOtpArrow"
    );


// OTP

const forgotOtpInputs =
    document.querySelectorAll(
        ".forgot-otp-input"
    );

const forgotOtpTimer =
    document.getElementById(
        "forgotOtpTimer"
    );

const resendForgotOtpButton =
    document.getElementById(
        "resendForgotOtpButton"
    );

const forgotResendCountdown =
    document.getElementById(
        "forgotResendCountdown"
    );

const forgotChangeEmailButton =
    document.getElementById(
        "forgotChangeEmailButton"
    );


// Password

const newPasswordInput =
    document.getElementById(
        "newPassword"
    );

const confirmNewPasswordInput =
    document.getElementById(
        "confirmNewPassword"
    );

const resetPasswordButton =
    document.getElementById(
        "resetPasswordButton"
    );

const resetPasswordButtonText =
    document.getElementById(
        "resetPasswordButtonText"
    );

const resetPasswordSpinner =
    document.getElementById(
        "resetPasswordSpinner"
    );

const resetPasswordArrow =
    document.getElementById(
        "resetPasswordArrow"
    );


// Progress

const progressStep1 =
    document.getElementById(
        "progressStep1"
    );

const progressStep2 =
    document.getElementById(
        "progressStep2"
    );

const progressStep3 =
    document.getElementById(
        "progressStep3"
    );

const progressLine1 =
    document.getElementById(
        "progressLine1"
    );

const progressLine2 =
    document.getElementById(
        "progressLine2"
    );


// =========================================================
// STATE
// =========================================================

let forgotPendingEmail = "";

let passwordResetToken = "";

let otpTimerInterval = null;

let resendTimerInterval = null;


// =========================================================
// SESSION STORAGE KEYS
// =========================================================

const FORGOT_EMAIL_KEY =
    "resumeiq_forgot_email";

const FORGOT_OTP_EXPIRES_KEY =
    "resumeiq_forgot_otp_expires_at";

const FORGOT_RESEND_KEY =
    "resumeiq_forgot_resend_at";

const RESET_TOKEN_KEY =
    "resumeiq_password_reset_token";

const RESET_TOKEN_EXPIRES_KEY =
    "resumeiq_reset_token_expires_at";


// =========================================================
// ALERT HELPERS
// =========================================================

function showForgotAlert(
    element,
    message,
    type = "danger"
) {

    if (!element) {
        return;
    }


    element.className =
        `alert alert-${type}`;


    element.textContent =
        message;


    element.classList.remove(
        "d-none"
    );
}


function hideForgotAlert(
    element
) {

    if (!element) {
        return;
    }


    element.classList.add(
        "d-none"
    );


    element.textContent = "";
}


// =========================================================
// EMAIL VALIDATION
// =========================================================

function isValidForgotEmail(
    email
) {

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return pattern.test(
        email
    );
}


// =========================================================
// PROGRESS
// =========================================================

function setForgotProgress(
    step
) {

    [
        progressStep1,
        progressStep2,
        progressStep3
    ].forEach(
        element => {

            if (!element) {
                return;
            }


            element.classList.remove(
                "active",
                "completed"
            );
        }
    );


    [
        progressLine1,
        progressLine2
    ].forEach(
        element => {

            if (!element) {
                return;
            }


            element.classList.remove(
                "completed"
            );
        }
    );


    if (step === 1) {

        progressStep1?.classList.add(
            "active"
        );

        return;
    }


    if (step === 2) {

        progressStep1?.classList.add(
            "completed"
        );

        progressLine1?.classList.add(
            "completed"
        );

        progressStep2?.classList.add(
            "active"
        );

        return;
    }


    if (step === 3) {

        progressStep1?.classList.add(
            "completed"
        );

        progressStep2?.classList.add(
            "completed"
        );

        progressLine1?.classList.add(
            "completed"
        );

        progressLine2?.classList.add(
            "completed"
        );

        progressStep3?.classList.add(
            "active"
        );
    }
}


// =========================================================
// SHOW EMAIL STEP
// =========================================================

function showForgotEmailStep() {

    forgotEmailStep?.classList.remove(
        "d-none"
    );


    forgotOtpStep?.classList.add(
        "d-none"
    );


    forgotPasswordStep?.classList.add(
        "d-none"
    );


    setForgotProgress(
        1
    );
}


// =========================================================
// SHOW OTP STEP
// =========================================================

function showForgotOtpStep(
    email
) {

    forgotPendingEmail =
        email;


    forgotEmailStep?.classList.add(
        "d-none"
    );


    forgotOtpStep?.classList.remove(
        "d-none"
    );


    forgotPasswordStep?.classList.add(
        "d-none"
    );


    if (
        forgotOtpEmailDisplay
    ) {

        forgotOtpEmailDisplay.textContent =
            email;
    }


    setForgotProgress(
        2
    );


    setTimeout(
        function () {

            if (
                forgotOtpInputs.length > 0
            ) {

                forgotOtpInputs[0].focus();
            }

        },
        150
    );
}


// =========================================================
// SHOW PASSWORD STEP
// =========================================================

function showForgotPasswordStep() {

    forgotEmailStep?.classList.add(
        "d-none"
    );


    forgotOtpStep?.classList.add(
        "d-none"
    );


    forgotPasswordStep?.classList.remove(
        "d-none"
    );


    setForgotProgress(
        3
    );


    setTimeout(
        function () {

            newPasswordInput?.focus();

        },
        150
    );
}


// =========================================================
// SEND OTP LOADING
// =========================================================

function setSendForgotOtpLoading(
    loading
) {

    if (!sendForgotOtpButton) {
        return;
    }


    sendForgotOtpButton.disabled =
        loading;


    if (loading) {

        sendForgotOtpText.textContent =
            "Sending OTP...";


        sendForgotOtpSpinner?.classList.remove(
            "d-none"
        );


        sendForgotOtpArrow?.classList.add(
            "d-none"
        );

    } else {

        sendForgotOtpText.textContent =
            "Send Verification Code";


        sendForgotOtpSpinner?.classList.add(
            "d-none"
        );


        sendForgotOtpArrow?.classList.remove(
            "d-none"
        );
    }
}


// =========================================================
// VERIFY OTP LOADING
// =========================================================

function setVerifyForgotOtpLoading(
    loading
) {

    if (!verifyForgotOtpButton) {
        return;
    }


    verifyForgotOtpButton.disabled =
        loading;


    if (loading) {

        verifyForgotOtpText.textContent =
            "Verifying...";


        verifyForgotOtpSpinner?.classList.remove(
            "d-none"
        );


        verifyForgotOtpArrow?.classList.add(
            "d-none"
        );

    } else {

        verifyForgotOtpText.textContent =
            "Verify OTP";


        verifyForgotOtpSpinner?.classList.add(
            "d-none"
        );


        verifyForgotOtpArrow?.classList.remove(
            "d-none"
        );
    }
}


// =========================================================
// RESET PASSWORD LOADING
// =========================================================

function setResetPasswordLoading(
    loading
) {

    if (!resetPasswordButton) {
        return;
    }


    resetPasswordButton.disabled =
        loading;


    if (loading) {

        resetPasswordButtonText.textContent =
            "Resetting Password...";


        resetPasswordSpinner?.classList.remove(
            "d-none"
        );


        resetPasswordArrow?.classList.add(
            "d-none"
        );

    } else {

        resetPasswordButtonText.textContent =
            "Reset Password";


        resetPasswordSpinner?.classList.add(
            "d-none"
        );


        resetPasswordArrow?.classList.remove(
            "d-none"
        );
    }
}


// =========================================================
// STEP 1 - SEND FORGOT PASSWORD OTP
// =========================================================

if (
    forgotEmailForm
) {

    forgotEmailForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            hideForgotAlert(
                forgotEmailAlert
            );


            const email =
                forgotEmailInput
                    ?.value
                    .trim()
                    .toLowerCase()
                ||
                "";


            if (
                !isValidForgotEmail(
                    email
                )
            ) {

                showForgotAlert(
                    forgotEmailAlert,
                    "Please enter a valid registered email address."
                );

                return;
            }


            setSendForgotOtpLoading(
                true
            );


            try {

                const response =
                    await fetch(
                        `${FORGOT_API_BASE_URL}/api/auth/forgot-password`,
                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email:
                                        email
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data?.detail
                        ||
                        data?.message
                        ||
                        "Unable to send password reset OTP."
                    );
                }


                forgotPendingEmail =
                    data.email
                    ||
                    email;


                const expiryMinutes =
                    Number(
                        data.otp_expires_in_minutes
                    )
                    ||
                    5;


                saveOtpSession(
                    forgotPendingEmail,
                    expiryMinutes
                );


                clearForgotOtpInputs();


                showForgotOtpStep(
                    forgotPendingEmail
                );


                startForgotOtpTimer();


                startForgotResendTimer();


            } catch (error) {

                console.error(
                    "Forgot password error:",
                    error
                );


                showForgotAlert(
                    forgotEmailAlert,
                    error.message
                    ||
                    "Unable to send OTP."
                );

            } finally {

                setSendForgotOtpLoading(
                    false
                );
            }
        }
    );
}


// =========================================================
// SAVE OTP SESSION
// =========================================================

function saveOtpSession(
    email,
    expiryMinutes
) {

    const now =
        Date.now();


    const otpExpiresAt =
        now
        +
        (
            expiryMinutes
            *
            60
            *
            1000
        );


    const resendAt =
        now
        +
        (
            60
            *
            1000
        );


    sessionStorage.setItem(
        FORGOT_EMAIL_KEY,
        email
    );


    sessionStorage.setItem(
        FORGOT_OTP_EXPIRES_KEY,
        String(
            otpExpiresAt
        )
    );


    sessionStorage.setItem(
        FORGOT_RESEND_KEY,
        String(
            resendAt
        )
    );
}


// =========================================================
// OTP INPUT HANDLING
// =========================================================

forgotOtpInputs.forEach(
    (
        input,
        index
    ) => {

        input.addEventListener(
            "input",
            function () {

                input.value =
                    input.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            1
                        );


                if (
                    input.value
                    &&
                    index
                    <
                    forgotOtpInputs.length - 1
                ) {

                    forgotOtpInputs[
                        index + 1
                    ].focus();
                }
            }
        );


        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Backspace"
                    &&
                    !input.value
                    &&
                    index > 0
                ) {

                    forgotOtpInputs[
                        index - 1
                    ].focus();
                }


                if (
                    event.key ===
                    "ArrowLeft"
                    &&
                    index > 0
                ) {

                    forgotOtpInputs[
                        index - 1
                    ].focus();
                }


                if (
                    event.key ===
                    "ArrowRight"
                    &&
                    index
                    <
                    forgotOtpInputs.length - 1
                ) {

                    forgotOtpInputs[
                        index + 1
                    ].focus();
                }
            }
        );


        input.addEventListener(
            "paste",
            function (event) {

                event.preventDefault();


                const pasted =
                    event.clipboardData
                        .getData(
                            "text"
                        )
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            6
                        );


                pasted
                    .split("")
                    .forEach(
                        (
                            digit,
                            digitIndex
                        ) => {

                            if (
                                forgotOtpInputs[
                                    digitIndex
                                ]
                            ) {

                                forgotOtpInputs[
                                    digitIndex
                                ].value =
                                    digit;
                            }
                        }
                    );


                const lastIndex =
                    Math.min(
                        pasted.length,
                        forgotOtpInputs.length
                    )
                    -
                    1;


                if (
                    lastIndex >= 0
                    &&
                    forgotOtpInputs[
                        lastIndex
                    ]
                ) {

                    forgotOtpInputs[
                        lastIndex
                    ].focus();
                }
            }
        );
    }
);


// =========================================================
// GET ENTERED OTP
// =========================================================

function getForgotEnteredOtp() {

    return Array
        .from(
            forgotOtpInputs
        )
        .map(
            input =>
                input.value
                    .trim()
        )
        .join("");
}


// =========================================================
// CLEAR OTP
// =========================================================

function clearForgotOtpInputs() {

    forgotOtpInputs.forEach(
        input => {

            input.value = "";
        }
    );
}


// =========================================================
// STEP 2 - VERIFY OTP
// =========================================================

if (
    forgotOtpForm
) {

    forgotOtpForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            hideForgotAlert(
                forgotOtpAlert
            );


            const otp =
                getForgotEnteredOtp();


            if (
                !forgotPendingEmail
            ) {

                showForgotAlert(
                    forgotOtpAlert,
                    "Email address is missing. Please start again."
                );

                return;
            }


            if (
                !/^\d{6}$/.test(
                    otp
                )
            ) {

                showForgotAlert(
                    forgotOtpAlert,
                    "Please enter the complete 6-digit OTP."
                );

                return;
            }


            setVerifyForgotOtpLoading(
                true
            );


            try {

                const response =
                    await fetch(
                        `${FORGOT_API_BASE_URL}/api/auth/verify-forgot-password-otp`,
                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    email:
                                        forgotPendingEmail,

                                    otp:
                                        otp
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data?.detail
                        ||
                        data?.message
                        ||
                        "OTP verification failed."
                    );
                }


                passwordResetToken =
                    data.reset_token
                    ||
                    "";


                if (
                    !passwordResetToken
                ) {

                    throw new Error(
                        "Password reset token was not returned by the server."
                    );
                }


                const resetExpiryMinutes =
                    Number(
                        data.reset_token_expires_in_minutes
                    )
                    ||
                    10;


                sessionStorage.setItem(
                    RESET_TOKEN_KEY,
                    passwordResetToken
                );


                sessionStorage.setItem(
                    RESET_TOKEN_EXPIRES_KEY,
                    String(
                        Date.now()
                        +
                        (
                            resetExpiryMinutes
                            *
                            60
                            *
                            1000
                        )
                    )
                );


                clearInterval(
                    otpTimerInterval
                );


                clearInterval(
                    resendTimerInterval
                );


                showForgotPasswordStep();


            } catch (error) {

                console.error(
                    "Forgot OTP verification error:",
                    error
                );


                showForgotAlert(
                    forgotOtpAlert,
                    error.message
                    ||
                    "Invalid OTP."
                );


                clearForgotOtpInputs();


                forgotOtpInputs[0]?.focus();

            } finally {

                setVerifyForgotOtpLoading(
                    false
                );
            }
        }
    );
}


// =========================================================
// RESEND OTP
// =========================================================

if (
    resendForgotOtpButton
) {

    resendForgotOtpButton.addEventListener(
        "click",
        async function () {

            hideForgotAlert(
                forgotOtpAlert
            );


            if (
                !forgotPendingEmail
            ) {

                showForgotAlert(
                    forgotOtpAlert,
                    "Email address is missing."
                );

                return;
            }


            resendForgotOtpButton.disabled =
                true;


            resendForgotOtpButton.textContent =
                "Sending...";


            try {

                const response =
                    await fetch(
                        `${FORGOT_API_BASE_URL}/api/auth/resend-forgot-password-otp`,
                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email:
                                        forgotPendingEmail
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data?.detail
                        ||
                        data?.message
                        ||
                        "Unable to resend OTP."
                    );
                }


                const expiryMinutes =
                    Number(
                        data.otp_expires_in_minutes
                    )
                    ||
                    5;


                saveOtpSession(
                    forgotPendingEmail,
                    expiryMinutes
                );


                passwordResetToken =
                    "";


                sessionStorage.removeItem(
                    RESET_TOKEN_KEY
                );


                sessionStorage.removeItem(
                    RESET_TOKEN_EXPIRES_KEY
                );


                clearForgotOtpInputs();


                startForgotOtpTimer();


                startForgotResendTimer();


                showForgotAlert(
                    forgotOtpAlert,
                    "A new password reset OTP has been sent to your email.",
                    "success"
                );


                forgotOtpInputs[0]?.focus();


            } catch (error) {

                console.error(
                    "Forgot OTP resend error:",
                    error
                );


                showForgotAlert(
                    forgotOtpAlert,
                    error.message
                    ||
                    "Unable to resend OTP."
                );


                resendForgotOtpButton.disabled =
                    false;


                resendForgotOtpButton.textContent =
                    "Resend OTP";
            }
        }
    );
}


// =========================================================
// OTP TIMER
// =========================================================

function startForgotOtpTimer() {

    clearInterval(
        otpTimerInterval
    );


    updateForgotOtpTimer();


    otpTimerInterval =
        setInterval(
            function () {

                updateForgotOtpTimer();

            },
            1000
        );
}


// =========================================================
// UPDATE OTP TIMER
// =========================================================

function updateForgotOtpTimer() {

    const expiresAt =
        Number(
            sessionStorage.getItem(
                FORGOT_OTP_EXPIRES_KEY
            )
        );


    if (
        !expiresAt
    ) {

        if (
            forgotOtpTimer
        ) {

            forgotOtpTimer.textContent =
                "00:00";
        }

        return;
    }


    const remainingMilliseconds =
        Math.max(
            0,
            expiresAt
            -
            Date.now()
        );


    const totalSeconds =
        Math.ceil(
            remainingMilliseconds
            /
            1000
        );


    const minutes =
        Math.floor(
            totalSeconds
            /
            60
        );


    const seconds =
        totalSeconds
        %
        60;


    if (
        forgotOtpTimer
    ) {

        forgotOtpTimer.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }


    if (
        totalSeconds <= 0
    ) {

        clearInterval(
            otpTimerInterval
        );


        showForgotAlert(
            forgotOtpAlert,
            "OTP has expired. Please request a new OTP.",
            "warning"
        );
    }
}


// =========================================================
// RESEND TIMER
// =========================================================

function startForgotResendTimer() {

    clearInterval(
        resendTimerInterval
    );


    updateForgotResendTimer();


    resendTimerInterval =
        setInterval(
            function () {

                updateForgotResendTimer();

            },
            1000
        );
}


// =========================================================
// UPDATE RESEND TIMER
// =========================================================

function updateForgotResendTimer() {

    const resendAt =
        Number(
            sessionStorage.getItem(
                FORGOT_RESEND_KEY
            )
        );


    const remainingMilliseconds =
        Math.max(
            0,
            resendAt
            -
            Date.now()
        );


    const seconds =
        Math.ceil(
            remainingMilliseconds
            /
            1000
        );


    if (
        seconds > 0
    ) {

        resendForgotOtpButton.disabled =
            true;


        resendForgotOtpButton.textContent =
            "Resend OTP";


        if (
            forgotResendCountdown
        ) {

            forgotResendCountdown.textContent =
                `in ${seconds}s`;
        }

    } else {

        clearInterval(
            resendTimerInterval
        );


        resendForgotOtpButton.disabled =
            false;


        resendForgotOtpButton.textContent =
            "Resend OTP";


        if (
            forgotResendCountdown
        ) {

            forgotResendCountdown.textContent =
                "";
        }
    }
}


// =========================================================
// CHANGE EMAIL
// =========================================================

if (
    forgotChangeEmailButton
) {

    forgotChangeEmailButton.addEventListener(
        "click",
        function () {

            clearForgotPasswordSession();


            clearForgotOtpInputs();


            hideForgotAlert(
                forgotOtpAlert
            );


            forgotPendingEmail =
                "";


            passwordResetToken =
                "";


            showForgotEmailStep();


            forgotEmailInput?.focus();
        }
    );
}


// =========================================================
// STEP 3 - RESET PASSWORD
// =========================================================

if (
    resetPasswordForm
) {

    resetPasswordForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            hideForgotAlert(
                resetPasswordAlert
            );


            const newPassword =
                newPasswordInput
                    ?.value
                ||
                "";


            const confirmPassword =
                confirmNewPasswordInput
                    ?.value
                ||
                "";


            if (
                newPassword.length < 8
            ) {

                showForgotAlert(
                    resetPasswordAlert,
                    "New password must contain at least 8 characters."
                );

                return;
            }


            if (
                newPassword.length > 72
            ) {

                showForgotAlert(
                    resetPasswordAlert,
                    "Password cannot exceed 72 characters."
                );

                return;
            }


            if (
                newPassword
                !==
                confirmPassword
            ) {

                showForgotAlert(
                    resetPasswordAlert,
                    "New password and confirm password do not match."
                );

                return;
            }


            if (
                !forgotPendingEmail
            ) {

                showForgotAlert(
                    resetPasswordAlert,
                    "Password reset email is missing. Please start again."
                );

                return;
            }


            if (
                !passwordResetToken
            ) {

                showForgotAlert(
                    resetPasswordAlert,
                    "Your password reset session has expired. Please request a new OTP."
                );

                return;
            }


            const tokenExpiresAt =
                Number(
                    sessionStorage.getItem(
                        RESET_TOKEN_EXPIRES_KEY
                    )
                );


            if (
                tokenExpiresAt
                &&
                Date.now()
                >
                tokenExpiresAt
            ) {

                showForgotAlert(
                    resetPasswordAlert,
                    "Password reset session has expired. Please request a new OTP.",
                    "warning"
                );

                return;
            }


            setResetPasswordLoading(
                true
            );


            try {

                const response =
                    await fetch(
                        `${FORGOT_API_BASE_URL}/api/auth/reset-password`,
                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    email:
                                        forgotPendingEmail,

                                    reset_token:
                                        passwordResetToken,

                                    new_password:
                                        newPassword,

                                    confirm_password:
                                        confirmPassword
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        data?.detail
                        ||
                        data?.message
                        ||
                        "Unable to reset password."
                    );
                }


                clearForgotPasswordSession();


                passwordResetToken =
                    "";


                showForgotAlert(
                    resetPasswordAlert,
                    data?.message
                    ||
                    "Password reset successfully.",
                    "success"
                );


                resetPasswordButton.disabled =
                    true;


                resetPasswordButtonText.textContent =
                    "Password Reset Successfully";


                resetPasswordArrow.className =
                    "bi bi-check-circle-fill";


                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1800
                );


            } catch (error) {

                console.error(
                    "Reset password error:",
                    error
                );


                showForgotAlert(
                    resetPasswordAlert,
                    error.message
                    ||
                    "Unable to reset password."
                );

            } finally {

                setResetPasswordLoading(
                    false
                );
            }
        }
    );
}


// =========================================================
// PASSWORD TOGGLE
// =========================================================

function setupForgotPasswordToggle(
    buttonId,
    inputId,
    eyeId
) {

    const button =
        document.getElementById(
            buttonId
        );


    const input =
        document.getElementById(
            inputId
        );


    const eye =
        document.getElementById(
            eyeId
        );


    if (
        !button
        ||
        !input
        ||
        !eye
    ) {

        return;
    }


    button.addEventListener(
        "click",
        function () {

            const hidden =
                input.type ===
                "password";


            input.type =
                hidden
                    ?
                    "text"
                    :
                    "password";


            eye.className =
                hidden
                    ?
                    "bi bi-eye-slash"
                    :
                    "bi bi-eye";
        }
    );
}


setupForgotPasswordToggle(
    "toggleNewPassword",
    "newPassword",
    "newPasswordEye"
);


setupForgotPasswordToggle(
    "toggleConfirmNewPassword",
    "confirmNewPassword",
    "confirmNewPasswordEye"
);


// =========================================================
// CLEAR SESSION
// =========================================================

function clearForgotPasswordSession() {

    clearInterval(
        otpTimerInterval
    );


    clearInterval(
        resendTimerInterval
    );


    sessionStorage.removeItem(
        FORGOT_EMAIL_KEY
    );


    sessionStorage.removeItem(
        FORGOT_OTP_EXPIRES_KEY
    );


    sessionStorage.removeItem(
        FORGOT_RESEND_KEY
    );


    sessionStorage.removeItem(
        RESET_TOKEN_KEY
    );


    sessionStorage.removeItem(
        RESET_TOKEN_EXPIRES_KEY
    );
}


// =========================================================
// RESTORE STATE AFTER REFRESH
// =========================================================

function restoreForgotPasswordState() {

    const savedEmail =
        sessionStorage.getItem(
            FORGOT_EMAIL_KEY
        );


    const savedResetToken =
        sessionStorage.getItem(
            RESET_TOKEN_KEY
        );


    const resetTokenExpiresAt =
        Number(
            sessionStorage.getItem(
                RESET_TOKEN_EXPIRES_KEY
            )
        );


    if (
        savedEmail
    ) {

        forgotPendingEmail =
            savedEmail;
    }


    // -----------------------------------------------------
    // STEP 3 RESTORE
    // -----------------------------------------------------

    if (
        savedEmail
        &&
        savedResetToken
        &&
        resetTokenExpiresAt
        &&
        Date.now()
        <
        resetTokenExpiresAt
    ) {

        passwordResetToken =
            savedResetToken;


        showForgotPasswordStep();


        return;
    }


    // Expired reset token cleanup

    if (
        savedResetToken
        &&
        resetTokenExpiresAt
        &&
        Date.now()
        >=
        resetTokenExpiresAt
    ) {

        sessionStorage.removeItem(
            RESET_TOKEN_KEY
        );


        sessionStorage.removeItem(
            RESET_TOKEN_EXPIRES_KEY
        );


        passwordResetToken =
            "";
    }


    // -----------------------------------------------------
    // STEP 2 RESTORE
    // -----------------------------------------------------

    if (
        savedEmail
    ) {

        showForgotOtpStep(
            savedEmail
        );


        startForgotOtpTimer();


        startForgotResendTimer();


        return;
    }


    // -----------------------------------------------------
    // STEP 1
    // -----------------------------------------------------

    showForgotEmailStep();
}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        restoreForgotPasswordState();

    }
);