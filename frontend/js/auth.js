// ==========================================
// ResumeIQ Authentication
// ==========================================

const API_BASE_URL =
    "http://127.0.0.1:8000";


// ==========================================
// Get Stored Token
// ==========================================

function getToken() {

    return (
        localStorage.getItem(
            "resumeiq_token"
        )
        ||
        sessionStorage.getItem(
            "resumeiq_token"
        )
    );
}


// ==========================================
// Save Token
// ==========================================

function saveToken(
    token,
    rememberMe = false
) {

    // Remove old authentication token
    localStorage.removeItem(
        "resumeiq_token"
    );

    sessionStorage.removeItem(
        "resumeiq_token"
    );


    if (rememberMe) {

        localStorage.setItem(
            "resumeiq_token",
            token
        );

    } else {

        sessionStorage.setItem(
            "resumeiq_token",
            token
        );
    }
}


// ==========================================
// Clear Authentication
// ==========================================

function clearAuthData() {

    localStorage.removeItem(
        "resumeiq_token"
    );

    sessionStorage.removeItem(
        "resumeiq_token"
    );

    localStorage.removeItem(
        "resumeiq_user"
    );

    sessionStorage.removeItem(
        "resumeiq_user"
    );
}


// ==========================================
// Save Current User
// ==========================================

function saveUser(
    user
) {

    if (!user) {
        return;
    }


    const localToken =
        localStorage.getItem(
            "resumeiq_token"
        );


    if (localToken) {

        localStorage.setItem(
            "resumeiq_user",
            JSON.stringify(user)
        );


        sessionStorage.removeItem(
            "resumeiq_user"
        );

    } else {

        sessionStorage.setItem(
            "resumeiq_user",
            JSON.stringify(user)
        );


        localStorage.removeItem(
            "resumeiq_user"
        );
    }
}


// ==========================================
// Get Saved User
// ==========================================

function getSavedUser() {

    const savedUser =
        localStorage.getItem(
            "resumeiq_user"
        )
        ||
        sessionStorage.getItem(
            "resumeiq_user"
        );


    if (!savedUser) {
        return null;
    }


    try {

        return JSON.parse(
            savedUser
        );

    } catch (error) {

        return null;
    }
}


// ==========================================
// Normalize Backend User Response
// ==========================================

function normalizeUserResponse(
    data
) {

    if (!data) {
        return null;
    }


    // Example:
    // {
    //     message: "...",
    //     user: {...}
    // }

    if (
        data.user
        &&
        typeof data.user === "object"
    ) {

        return data.user;
    }


    // Example:
    // {
    //     data: {...}
    // }

    if (
        data.data
        &&
        typeof data.data === "object"
    ) {

        return data.data;
    }


    // Direct user object
    return data;
}


// ==========================================
// Login Alert
// ==========================================

function showLoginAlert(
    message,
    type = "danger"
) {

    const alertBox =
        document.getElementById(
            "loginAlert"
        );


    if (!alertBox) {
        return;
    }


    alertBox.textContent =
        message;


    alertBox.className =
        `alert alert-${type}`;


    alertBox.classList.remove(
        "d-none"
    );
}


// ==========================================
// Hide Login Alert
// ==========================================

function hideLoginAlert() {

    const alertBox =
        document.getElementById(
            "loginAlert"
        );


    if (!alertBox) {
        return;
    }


    alertBox.classList.add(
        "d-none"
    );
}


// ==========================================
// Login Loading
// ==========================================

function setLoginLoading(
    loading
) {

    const button =
        document.getElementById(
            "loginButton"
        );


    const text =
        document.getElementById(
            "loginButtonText"
        );


    const spinner =
        document.getElementById(
            "loginSpinner"
        );


    const arrow =
        document.getElementById(
            "loginArrow"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    if (text) {

        text.textContent =
            loading
                ? "Signing In..."
                : "Login";
    }


    if (spinner) {

        spinner.classList.toggle(
            "d-none",
            !loading
        );
    }


    if (arrow) {

        arrow.classList.toggle(
            "d-none",
            loading
        );
    }
}


// ==========================================
// Login User
// ==========================================

async function loginUser(
    email,
    password,
    rememberMe
) {

    const response =
        await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        email: email,
                        password: password
                    })
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "Invalid response from server."
        );
    }


    if (!response.ok) {

        throw new Error(
            data.detail
            ||
            data.message
            ||
            "Invalid email or password."
        );
    }


    if (!data.access_token) {

        throw new Error(
            "Authentication token was not received."
        );
    }


    saveToken(
        data.access_token,
        rememberMe
    );


    return data.access_token;
}


// ==========================================
// Get Current Logged-in User
// ==========================================

async function getCurrentUser(
    token = null
) {

    const authToken =
        token || getToken();


    if (!authToken) {

        return null;
    }


    const response =
        await fetch(
            `${API_BASE_URL}/api/auth/me`,
            {
                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${authToken}`,

                    "Accept":
                        "application/json"
                }
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "Invalid response from server."
        );
    }


    if (!response.ok) {

        throw new Error(
            data.detail
            ||
            data.message
            ||
            "Unable to verify user."
        );
    }


    const user =
        normalizeUserResponse(
            data
        );


    if (!user) {

        throw new Error(
            "User information was not received."
        );
    }


    if (!user.role) {

        throw new Error(
            "User role was not received."
        );
    }


    return user;
}


// ==========================================
// Redirect Based On Role
// ==========================================

function redirectByRole(
    role
) {

    const normalizedRole =
        String(
            role || ""
        )
        .trim()
        .toLowerCase();


    if (
        normalizedRole ===
        "candidate"
    ) {

        window.location.href =
            "../candidate/dashboard.html";

        return;
    }


    if (
        normalizedRole ===
        "recruiter"
    ) {

        window.location.href =
            "../recruiter/dashboard.html";

        return;
    }


    if (
        normalizedRole ===
        "admin"
    ) {

        window.location.href =
            "../admin/dashboard.html";

        return;
    }


    showLoginAlert(
        "Unknown user role."
    );
}


// ==========================================
// Handle Login Form
// ==========================================

async function handleLoginSubmit(
    event
) {

    event.preventDefault();


    hideLoginAlert();


    const emailInput =
        document.getElementById(
            "email"
        );


    const passwordInput =
        document.getElementById(
            "password"
        );


    const rememberInput =
        document.getElementById(
            "rememberMe"
        );


    if (
        !emailInput
        ||
        !passwordInput
    ) {

        showLoginAlert(
            "Login form is not available."
        );

        return;
    }


    const email =
        emailInput.value
            .trim()
            .toLowerCase();


    const password =
        passwordInput.value;


    const rememberMe =
        rememberInput
            ? rememberInput.checked
            : false;


    // --------------------------------------
    // Validation
    // --------------------------------------

    if (!email) {

        showLoginAlert(
            "Please enter your email address."
        );

        emailInput.focus();

        return;
    }


    if (!password) {

        showLoginAlert(
            "Please enter your password."
        );

        passwordInput.focus();

        return;
    }


    setLoginLoading(
        true
    );


    try {

        // ----------------------------------
        // Step 1 - Login
        // ----------------------------------

        const token =
            await loginUser(
                email,
                password,
                rememberMe
            );


        // ----------------------------------
        // Step 2 - Current user
        // ----------------------------------

        const user =
            await getCurrentUser(
                token
            );


        // ----------------------------------
        // Step 3 - Save correct user
        // ----------------------------------

        saveUser(
            user
        );


        console.log(
            "Logged in user:",
            user
        );


        // ----------------------------------
        // Step 4 - Success
        // ----------------------------------

        showLoginAlert(
            "Login successful. Redirecting...",
            "success"
        );


        // ----------------------------------
        // Step 5 - Role Redirect
        // ----------------------------------

        setTimeout(
            function () {

                redirectByRole(
                    user.role
                );

            },
            400
        );


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        clearAuthData();


        showLoginAlert(
            error.message
            ||
            "Login failed."
        );


    } finally {

        setLoginLoading(
            false
        );
    }
}


// ==========================================
// Password Toggle
// ==========================================

function setupPasswordToggle() {

    const passwordInput =
        document.getElementById(
            "password"
        );


    const toggleButton =
        document.getElementById(
            "togglePassword"
        );


    const eyeIcon =
        document.getElementById(
            "passwordEyeIcon"
        );


    if (
        !passwordInput
        ||
        !toggleButton
    ) {

        return;
    }


    toggleButton.addEventListener(
        "click",
        function () {

            const hidden =
                passwordInput.type
                === "password";


            passwordInput.type =
                hidden
                    ? "text"
                    : "password";


            if (eyeIcon) {

                eyeIcon.className =
                    hidden
                        ? "bi bi-eye-slash"
                        : "bi bi-eye";
            }


            toggleButton.setAttribute(
                "aria-label",
                hidden
                    ? "Hide password"
                    : "Show password"
            );
        }
    );
}


// ==========================================
// Logout
// ==========================================

function logoutUser() {

    clearAuthData();


    window.location.href =
        "../auth/login.html";
}


// ==========================================
// Check Existing Login
// Used only on login page
// ==========================================

async function checkExistingLogin() {

    const token =
        getToken();


    if (!token) {
        return;
    }


    try {

        const user =
            await getCurrentUser(
                token
            );


        saveUser(
            user
        );


        console.log(
            "Existing login:",
            user
        );


    } catch (error) {

        console.error(
            "Existing login invalid:",
            error
        );


        clearAuthData();
    }
}


// ==========================================
// Initialize
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        // Only login page
        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLoginSubmit
            );


            setupPasswordToggle();


            checkExistingLogin();
        }
    }
);


// ==========================================
// Global Functions
// ==========================================

window.getToken =
    getToken;

window.saveToken =
    saveToken;

window.saveUser =
    saveUser;

window.getSavedUser =
    getSavedUser;

window.getCurrentUser =
    getCurrentUser;

window.redirectByRole =
    redirectByRole;

window.logoutUser =
    logoutUser;

window.clearAuthData =
    clearAuthData;