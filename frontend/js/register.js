// =========================================================
// ResumeIQ - Register + Email OTP Verification
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// =========================================================
// DOM ELEMENTS
// =========================================================

const registrationStep =
    document.getElementById("registrationStep");

const otpVerificationStep =
    document.getElementById("otpVerificationStep");

const registerForm =
    document.getElementById("registerForm");

const otpForm =
    document.getElementById("otpForm");

const registerAlert =
    document.getElementById("registerAlert");

const otpAlert =
    document.getElementById("otpAlert");

const registerButton =
    document.getElementById("registerButton");

const registerButtonText =
    document.getElementById("registerButtonText");

const registerSpinner =
    document.getElementById("registerSpinner");

const registerArrow =
    document.getElementById("registerArrow");

const verifyOtpButton =
    document.getElementById("verifyOtpButton");

const verifyOtpButtonText =
    document.getElementById("verifyOtpButtonText");

const verifyOtpSpinner =
    document.getElementById("verifyOtpSpinner");

const verifyOtpArrow =
    document.getElementById("verifyOtpArrow");

const resendOtpButton =
    document.getElementById("resendOtpButton");

const resendCountdown =
    document.getElementById("resendCountdown");

const changeEmailButton =
    document.getElementById("changeEmailButton");

const otpEmailDisplay =
    document.getElementById("otpEmailDisplay");

const otpTimer =
    document.getElementById("otpTimer");

const otpInputs =
    document.querySelectorAll(".otp-input");


// =========================================================
// STATE
// =========================================================

let pendingEmail = "";

let otpTimerInterval = null;

let resendTimerInterval = null;

let otpSecondsRemaining = 0;

let resendSecondsRemaining = 0;


// =========================================================
// ALERT HELPERS
// =========================================================

function showAlert(
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
        String(
            message
            ||
            "Something went wrong."
        );

    element.classList.remove(
        "d-none"
    );
}


function hideAlert(
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
// API RESPONSE / ERROR HELPERS
// =========================================================

async function readApiResponse(
    response
) {

    try {

        return await response.json();

    } catch (error) {

        return null;
    }
}


function getApiErrorMessage(
    data,
    fallback
) {

    if (!data) {
        return fallback;
    }

    if (
        typeof data.detail ===
        "string"
    ) {

        return data.detail;
    }

    if (
        Array.isArray(
            data.detail
        )
    ) {

        const messages =
            data.detail
                .map(
                    function (item) {

                        if (
                            typeof item ===
                            "string"
                        ) {
                            return item;
                        }

                        if (
                            item
                            &&
                            typeof item.msg ===
                            "string"
                        ) {
                            return item.msg;
                        }

                        if (
                            item
                            &&
                            typeof item.message ===
                            "string"
                        ) {
                            return item.message;
                        }

                        return "";
                    }
                )
                .filter(Boolean);

        if (messages.length) {
            return messages.join(" ");
        }
    }

    if (
        data.detail
        &&
        typeof data.detail ===
        "object"
    ) {

        if (
            typeof data.detail.message ===
            "string"
        ) {

            return data.detail.message;
        }

        try {

            return JSON.stringify(
                data.detail
            );

        } catch (error) {

            // Ignore JSON stringify error.
        }
    }

    if (
        typeof data.message ===
        "string"
    ) {

        return data.message;
    }

    return fallback;
}


// =========================================================
// REGISTER BUTTON LOADING
// =========================================================

function setRegisterLoading(
    loading
) {

    if (!registerButton) {
        return;
    }

    registerButton.disabled =
        loading;

    if (registerButtonText) {

        registerButtonText.textContent =
            loading
                ? "Sending OTP..."
                : "Create Account";
    }

    if (registerSpinner) {

        registerSpinner.classList.toggle(
            "d-none",
            !loading
        );
    }

    if (registerArrow) {

        registerArrow.classList.toggle(
            "d-none",
            loading
        );
    }
}


// =========================================================
// VERIFY BUTTON LOADING
// =========================================================

function setVerifyLoading(
    loading
) {

    if (!verifyOtpButton) {
        return;
    }

    verifyOtpButton.disabled =
        loading;

    if (verifyOtpButtonText) {

        verifyOtpButtonText.textContent =
            loading
                ? "Verifying..."
                : "Verify Email";
    }

    if (verifyOtpSpinner) {

        verifyOtpSpinner.classList.toggle(
            "d-none",
            !loading
        );
    }

    if (verifyOtpArrow) {

        verifyOtpArrow.classList.toggle(
            "d-none",
            loading
        );
    }
}


// =========================================================
// GET SELECTED ROLE
// =========================================================

function getSelectedRole() {

    const selectedRole =
        document.querySelector(
            'input[name="role"]:checked'
        );

    return selectedRole
        ? selectedRole.value
        : "candidate";
}


// =========================================================
// VALIDATION HELPERS
// =========================================================

function isValidEmail(
    email
) {

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(
        email
    );
}


function isValidMobile(
    mobile
) {

    if (
        mobile.length < 7
        ||
        mobile.length > 20
    ) {

        return false;
    }

    const pattern =
        /^[0-9+\-\s()]+$/;

    return pattern.test(
        mobile
    );
}


// =========================================================
// REGISTER FORM SUBMIT
// =========================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideAlert(
                registerAlert
            );

            const fullNameInput =
                document.getElementById(
                    "registerName"
                );

            const emailInput =
                document.getElementById(
                    "registerEmail"
                );

            const mobileInput =
                document.getElementById(
                    "registerMobile"
                );

            const passwordInput =
                document.getElementById(
                    "registerPassword"
                );

            const confirmPasswordInput =
                document.getElementById(
                    "confirmPassword"
                );

            const acceptTermsInput =
                document.getElementById(
                    "acceptTerms"
                );

            if (
                !fullNameInput
                ||
                !emailInput
                ||
                !mobileInput
                ||
                !passwordInput
                ||
                !confirmPasswordInput
                ||
                !acceptTermsInput
            ) {

                showAlert(
                    registerAlert,
                    "Registration form is not available."
                );

                return;
            }

            const fullName =
                fullNameInput
                    .value
                    .trim();

            const email =
                emailInput
                    .value
                    .trim()
                    .toLowerCase();

            const mobile =
                mobileInput
                    .value
                    .trim();

            const password =
                passwordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;

            const acceptTerms =
                acceptTermsInput.checked;

            const role =
                getSelectedRole();


            // =============================================
            // VALIDATION
            // =============================================

            if (
                fullName.length < 2
            ) {

                showAlert(
                    registerAlert,
                    "Please enter your full name."
                );

                fullNameInput.focus();

                return;
            }

            if (
                !isValidEmail(
                    email
                )
            ) {

                showAlert(
                    registerAlert,
                    "Please enter a valid email address."
                );

                emailInput.focus();

                return;
            }

            if (!mobile) {

                showAlert(
                    registerAlert,
                    "Please enter your mobile number."
                );

                mobileInput.focus();

                return;
            }

            if (
                !isValidMobile(
                    mobile
                )
            ) {

                showAlert(
                    registerAlert,
                    "Please enter a valid mobile number."
                );

                mobileInput.focus();

                return;
            }

            if (
                role !== "candidate"
                &&
                role !== "recruiter"
            ) {

                showAlert(
                    registerAlert,
                    "Please select a valid account type."
                );

                return;
            }

            if (
                password.length < 8
            ) {

                showAlert(
                    registerAlert,
                    "Password must contain at least 8 characters."
                );

                passwordInput.focus();

                return;
            }

            if (
                password.length > 72
            ) {

                showAlert(
                    registerAlert,
                    "Password cannot exceed 72 characters."
                );

                passwordInput.focus();

                return;
            }

            if (
                password !==
                confirmPassword
            ) {

                showAlert(
                    registerAlert,
                    "Password and confirm password do not match."
                );

                confirmPasswordInput.focus();

                return;
            }

            if (!acceptTerms) {

                showAlert(
                    registerAlert,
                    "Please accept the Terms of Service and Privacy Policy."
                );

                return;
            }


            // =============================================
            // SEND REGISTER REQUEST
            // =============================================

            setRegisterLoading(
                true
            );

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/register`,
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
                                    full_name:
                                        fullName,

                                    email:
                                        email,

                                    mobile:
                                        mobile,

                                    password:
                                        password,

                                    role:
                                        role
                                })
                        }
                    );

                const data =
                    await readApiResponse(
                        response
                    );

                if (
                    !response.ok
                ) {

                    throw new Error(
                        getApiErrorMessage(
                            data,
                            "Unable to create account."
                        )
                    );
                }


                // =========================================
                // OTP SUCCESS
                // =========================================

                pendingEmail =
                    data?.email
                    ||
                    email;

                sessionStorage.setItem(
                    "resumeiq_pending_verification_email",
                    pendingEmail
                );

                showOtpStep(
                    pendingEmail,
                    data?.otp_expires_in_minutes
                    ||
                    5
                );

            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                showAlert(
                    registerAlert,
                    error.message
                    ||
                    "Unable to send verification OTP."
                );

            } finally {

                setRegisterLoading(
                    false
                );
            }
        }
    );
}


// =========================================================
// SHOW OTP STEP
// =========================================================

function showOtpStep(
    email,
    expiryMinutes = 5
) {

    pendingEmail =
        email;

    if (
        registrationStep
    ) {

        registrationStep.classList.add(
            "d-none"
        );
    }

    if (
        otpVerificationStep
    ) {

        otpVerificationStep.classList.remove(
            "d-none"
        );
    }

    if (
        otpEmailDisplay
    ) {

        otpEmailDisplay.textContent =
            email;
    }

    clearOtpInputs();

    hideAlert(
        otpAlert
    );

    startOtpTimer(
        expiryMinutes * 60
    );

    startResendTimer(
        60
    );

    setTimeout(
        function () {

            if (
                otpInputs.length > 0
            ) {

                otpInputs[0].focus();
            }

        },
        150
    );
}


// =========================================================
// OTP INPUT HANDLING
// =========================================================

otpInputs.forEach(
    function (
        input,
        index
    ) {

        input.addEventListener(
            "input",
            function () {

                let value =
                    input.value;

                value =
                    value.replace(
                        /\D/g,
                        ""
                    );

                input.value =
                    value.slice(
                        0,
                        1
                    );

                if (
                    input.value
                    &&
                    index <
                    otpInputs.length - 1
                ) {

                    otpInputs[
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

                    otpInputs[
                        index - 1
                    ].focus();
                }

                if (
                    event.key ===
                    "ArrowLeft"
                    &&
                    index > 0
                ) {

                    otpInputs[
                        index - 1
                    ].focus();
                }

                if (
                    event.key ===
                    "ArrowRight"
                    &&
                    index <
                    otpInputs.length - 1
                ) {

                    otpInputs[
                        index + 1
                    ].focus();
                }
            }
        );


        input.addEventListener(
            "paste",
            function (event) {

                event.preventDefault();

                const pastedText =
                    event.clipboardData
                        .getData("text")
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            6
                        );

                if (
                    pastedText.length ===
                    0
                ) {

                    return;
                }

                pastedText
                    .split("")
                    .forEach(
                        function (
                            digit,
                            digitIndex
                        ) {

                            if (
                                otpInputs[
                                    digitIndex
                                ]
                            ) {

                                otpInputs[
                                    digitIndex
                                ].value =
                                    digit;
                            }
                        }
                    );

                const lastIndex =
                    Math.min(
                        pastedText.length,
                        otpInputs.length
                    )
                    -
                    1;

                if (
                    otpInputs[
                        lastIndex
                    ]
                ) {

                    otpInputs[
                        lastIndex
                    ].focus();
                }
            }
        );
    }
);


// =========================================================
// GET OTP
// =========================================================

function getEnteredOtp() {

    return Array
        .from(
            otpInputs
        )
        .map(
            function (input) {

                return input
                    .value
                    .trim();
            }
        )
        .join("");
}


// =========================================================
// CLEAR OTP
// =========================================================

function clearOtpInputs() {

    otpInputs.forEach(
        function (input) {

            input.value = "";
        }
    );
}


// =========================================================
// VERIFY OTP FORM
// =========================================================

if (otpForm) {

    otpForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideAlert(
                otpAlert
            );

            const otp =
                getEnteredOtp();

            if (
                !pendingEmail
            ) {

                showAlert(
                    otpAlert,
                    "Verification email is missing. Please register again."
                );

                return;
            }

            if (
                !/^\d{6}$/.test(
                    otp
                )
            ) {

                showAlert(
                    otpAlert,
                    "Please enter the complete 6-digit OTP."
                );

                return;
            }

            setVerifyLoading(
                true
            );

            let verificationSucceeded =
                false;

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/verify-email-otp`,
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
                                        pendingEmail,

                                    otp:
                                        otp
                                })
                        }
                    );

                const data =
                    await readApiResponse(
                        response
                    );

                if (
                    !response.ok
                ) {

                    throw new Error(
                        getApiErrorMessage(
                            data,
                            "OTP verification failed."
                        )
                    );
                }


                // =========================================
                // VERIFICATION SUCCESS
                // =========================================

                verificationSucceeded =
                    true;

                clearInterval(
                    otpTimerInterval
                );

                clearInterval(
                    resendTimerInterval
                );

                sessionStorage.removeItem(
                    "resumeiq_pending_verification_email"
                );

                showAlert(
                    otpAlert,
                    data?.message
                    ||
                    "Email verified successfully. Your account has been created.",
                    "success"
                );

                if (
                    verifyOtpButton
                ) {

                    verifyOtpButton.disabled =
                        true;
                }

                if (
                    verifyOtpButtonText
                ) {

                    verifyOtpButtonText.textContent =
                        "Verified";
                }

                if (
                    verifyOtpArrow
                ) {

                    verifyOtpArrow.className =
                        "bi bi-check-circle-fill";
                }

                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1600
                );

            } catch (error) {

                console.error(
                    "OTP verification error:",
                    error
                );

                showAlert(
                    otpAlert,
                    error.message
                    ||
                    "Invalid OTP."
                );

                clearOtpInputs();

                if (
                    otpInputs.length > 0
                ) {

                    otpInputs[0].focus();
                }

            } finally {

                if (
                    !verificationSucceeded
                ) {

                    setVerifyLoading(
                        false
                    );
                } else {

                    if (verifyOtpSpinner) {

                        verifyOtpSpinner.classList.add(
                            "d-none"
                        );
                    }
                }
            }
        }
    );
}


// =========================================================
// RESEND OTP
// =========================================================

if (
    resendOtpButton
) {

    resendOtpButton.addEventListener(
        "click",
        async function () {

            hideAlert(
                otpAlert
            );

            if (
                !pendingEmail
            ) {

                showAlert(
                    otpAlert,
                    "Email address is missing. Please register again."
                );

                return;
            }

            resendOtpButton.disabled =
                true;

            resendOtpButton.textContent =
                "Sending...";

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/resend-email-otp`,
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
                                        pendingEmail
                                })
                        }
                    );

                const data =
                    await readApiResponse(
                        response
                    );

                if (
                    !response.ok
                ) {

                    throw new Error(
                        getApiErrorMessage(
                            data,
                            "Unable to resend OTP."
                        )
                    );
                }

                clearOtpInputs();

                startOtpTimer(
                    (
                        data?.otp_expires_in_minutes
                        ||
                        5
                    )
                    *
                    60
                );

                startResendTimer(
                    60
                );

                showAlert(
                    otpAlert,
                    data?.message
                    ||
                    "A new OTP has been sent to your email.",
                    "success"
                );

                if (
                    otpInputs.length > 0
                ) {

                    otpInputs[0].focus();
                }

            } catch (error) {

                console.error(
                    "Resend OTP error:",
                    error
                );

                showAlert(
                    otpAlert,
                    error.message
                    ||
                    "Unable to resend OTP."
                );

                resendOtpButton.disabled =
                    false;

                resendOtpButton.textContent =
                    "Resend OTP";
            }
        }
    );
}


// =========================================================
// OTP EXPIRY TIMER
// =========================================================

function startOtpTimer(
    totalSeconds
) {

    clearInterval(
        otpTimerInterval
    );

    otpSecondsRemaining =
        Number(
            totalSeconds
        )
        ||
        0;

    updateOtpTimerDisplay();

    otpTimerInterval =
        setInterval(
            function () {

                otpSecondsRemaining--;

                if (
                    otpSecondsRemaining < 0
                ) {

                    otpSecondsRemaining =
                        0;
                }

                updateOtpTimerDisplay();

                if (
                    otpSecondsRemaining <=
                    0
                ) {

                    clearInterval(
                        otpTimerInterval
                    );

                    showAlert(
                        otpAlert,
                        "OTP has expired. Please request a new OTP.",
                        "warning"
                    );
                }

            },
            1000
        );
}


// =========================================================
// OTP TIMER DISPLAY
// =========================================================

function updateOtpTimerDisplay() {

    if (
        !otpTimer
    ) {

        return;
    }

    const minutes =
        Math.floor(
            otpSecondsRemaining
            /
            60
        );

    const seconds =
        otpSecondsRemaining
        %
        60;

    otpTimer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


// =========================================================
// RESEND TIMER
// =========================================================

function startResendTimer(
    totalSeconds
) {

    clearInterval(
        resendTimerInterval
    );

    resendSecondsRemaining =
        Number(
            totalSeconds
        )
        ||
        0;

    if (
        resendOtpButton
    ) {

        resendOtpButton.disabled =
            true;

        resendOtpButton.textContent =
            "Resend OTP";
    }

    updateResendDisplay();

    resendTimerInterval =
        setInterval(
            function () {

                resendSecondsRemaining--;

                if (
                    resendSecondsRemaining < 0
                ) {

                    resendSecondsRemaining =
                        0;
                }

                updateResendDisplay();

                if (
                    resendSecondsRemaining <=
                    0
                ) {

                    clearInterval(
                        resendTimerInterval
                    );

                    if (
                        resendOtpButton
                    ) {

                        resendOtpButton.disabled =
                            false;

                        resendOtpButton.textContent =
                            "Resend OTP";
                    }

                    if (
                        resendCountdown
                    ) {

                        resendCountdown.textContent =
                            "";
                    }
                }

            },
            1000
        );
}


// =========================================================
// RESEND DISPLAY
// =========================================================

function updateResendDisplay() {

    if (
        !resendCountdown
    ) {

        return;
    }

    if (
        resendSecondsRemaining >
        0
    ) {

        resendCountdown.textContent =
            `in ${resendSecondsRemaining}s`;

    } else {

        resendCountdown.textContent =
            "";
    }
}


// =========================================================
// CHANGE EMAIL
// =========================================================

if (
    changeEmailButton
) {

    changeEmailButton.addEventListener(
        "click",
        function () {

            clearInterval(
                otpTimerInterval
            );

            clearInterval(
                resendTimerInterval
            );

            clearOtpInputs();

            pendingEmail = "";

            sessionStorage.removeItem(
                "resumeiq_pending_verification_email"
            );

            hideAlert(
                otpAlert
            );

            if (
                otpVerificationStep
            ) {

                otpVerificationStep.classList.add(
                    "d-none"
                );
            }

            if (
                registrationStep
            ) {

                registrationStep.classList.remove(
                    "d-none"
                );
            }

            const emailInput =
                document.getElementById(
                    "registerEmail"
                );

            if (
                emailInput
            ) {

                emailInput.focus();
            }
        }
    );
}


// =========================================================
// PASSWORD TOGGLE
// =========================================================

function setupPasswordToggle(
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

            const isPassword =
                input.type ===
                "password";

            input.type =
                isPassword
                    ? "text"
                    : "password";

            eye.className =
                isPassword
                    ? "bi bi-eye-slash"
                    : "bi bi-eye";

            button.setAttribute(
                "aria-label",
                isPassword
                    ? "Hide password"
                    : "Show password"
            );
        }
    );
}


setupPasswordToggle(
    "toggleRegisterPassword",
    "registerPassword",
    "registerPasswordEye"
);


setupPasswordToggle(
    "toggleConfirmPassword",
    "confirmPassword",
    "confirmPasswordEye"
);


// =========================================================
// MOBILE INPUT CLEANUP
// =========================================================

const registerMobileInput =
    document.getElementById(
        "registerMobile"
    );

if (
    registerMobileInput
) {

    registerMobileInput.addEventListener(
        "input",
        function () {

            registerMobileInput.value =
                registerMobileInput.value
                    .replace(
                        /[^0-9+\-\s()]/g,
                        ""
                    )
                    .slice(
                        0,
                        20
                    );
        }
    );
}


// =========================================================
// RESTORE PENDING OTP STEP AFTER PAGE REFRESH
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const savedPendingEmail =
            sessionStorage.getItem(
                "resumeiq_pending_verification_email"
            );

        if (
            savedPendingEmail
        ) {

            pendingEmail =
                savedPendingEmail;

            showOtpStep(
                savedPendingEmail,
                5
            );
        }
    }
);