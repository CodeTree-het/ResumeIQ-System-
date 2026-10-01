/* =========================================================
   RESUMEIQ SETTINGS PAGE
========================================================= */

const SETTINGS_API_BASE =
    "http://127.0.0.1:8000";


let settingsCurrentUser = null;

let pendingSettingsEmail = null;


/* =========================================================
   PAGE START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        initSettingsTabs();

        initSettingsFaq();

        initSettingsSearch();

        initEmailChangeUI();

        bindAccountSettings();

        bindPasswordSettings();

        bindPreferenceSettings();

        bindNotificationSettings();

        bindPrivacySettings();

        bindTroubleshootingSettings();

        await loadSettingsUser();
    }
);


/* =========================================================
   TOKEN
========================================================= */

function getSettingsToken() {

    if (
        typeof getToken ===
        "function"
    ) {

        const token =
            getToken();

        if (token) {

            return token;
        }
    }


    return (
        localStorage.getItem(
            "resumeiq_token"
        )
        ||
        localStorage.getItem(
            "access_token"
        )
        ||
        localStorage.getItem(
            "token"
        )
        ||
        sessionStorage.getItem(
            "resumeiq_token"
        )
        ||
        sessionStorage.getItem(
            "access_token"
        )
        ||
        sessionStorage.getItem(
            "token"
        )
        ||
        ""
    );
}


/* =========================================================
   HEADERS
========================================================= */

function getSettingsHeaders() {

    const token =
        getSettingsToken();


    return {
        "Content-Type":
            "application/json",

        "Accept":
            "application/json",

        "Authorization":
            `Bearer ${token}`
    };
}


/* =========================================================
   SAFE JSON
========================================================= */

async function safeJson(
    response
) {

    try {

        return await response.json();

    } catch (error) {

        return {};
    }
}


/* =========================================================
   API ERROR MESSAGE
========================================================= */

async function getSettingsErrorMessage(
    response
) {

    const data =
        await safeJson(
            response
        );


    if (
        data.detail
    ) {

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

            return data.detail
                .map(
                    function (
                        item
                    ) {

                        return (
                            item.msg
                            ||
                            "Validation error"
                        );
                    }
                )
                .join(
                    ", "
                );
        }
    }


    if (
        data.message
    ) {

        return data.message;
    }


    return (
        `Request failed (${response.status})`
    );
}


/* =========================================================
   API REQUEST
========================================================= */

async function settingsApiRequest(
    url,
    options = {}
) {

    const token =
        getSettingsToken();


    if (!token) {

        handleSettingsLogout();

        throw new Error(
            "Authentication token not found."
        );
    }


    const response =
        await fetch(
            `${SETTINGS_API_BASE}${url}`,
            {
                ...options,

                headers: {
                    ...getSettingsHeaders(),

                    ...(
                        options.headers
                        ||
                        {}
                    )
                }
            }
        );


    if (
        response.status ===
        401
    ) {

        handleSettingsLogout();

        throw new Error(
            "Session expired. Please login again."
        );
    }


    if (!response.ok) {

        throw new Error(
            await getSettingsErrorMessage(
                response
            )
        );
    }


    return await safeJson(
        response
    );
}


/* =========================================================
   TOAST
========================================================= */

function showSettingsToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "settingsToast"
        );


    const messageElement =
        document.getElementById(
            "settingsToastMessage"
        );


    if (
        !toast
        ||
        !messageElement
    ) {

        if (
            type ===
            "error"
        ) {

            console.error(
                message
            );

        } else {

            console.log(
                message
            );
        }

        return;
    }


    messageElement.textContent =
        message;


    toast.classList.remove(
        "error"
    );


    const icon =
        toast.querySelector(
            "i"
        );


    if (
        type ===
        "error"
    ) {

        toast.classList.add(
            "error"
        );


        if (icon) {

            icon.className =
                "bi bi-exclamation-circle";
        }

    } else {

        if (icon) {

            icon.className =
                "bi bi-check-circle";
        }
    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.settingsToastTimer
    );


    window.settingsToastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    text = "Please wait..."
) {

    if (!button) {

        return;
    }


    if (loading) {

        if (
            !button.dataset.originalHtml
        ) {

            button.dataset.originalHtml =
                button.innerHTML;
        }


        button.disabled =
            true;


        button.innerHTML =
            `
            <span
                class="spinner-border spinner-border-sm me-2"
            ></span>
            ${text}
            `;

    } else {

        button.disabled =
            false;


        if (
            button.dataset.originalHtml
        ) {

            button.innerHTML =
                button.dataset.originalHtml;
        }
    }
}


/* =========================================================
   INPUT HELPERS
========================================================= */

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value
            ??
            "";
    }
}


function setCheckedValue(
    id,
    value,
    defaultValue = false
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;
    }


    if (
        value === undefined
        ||
        value === null
    ) {

        element.checked =
            defaultValue;

        return;
    }


    element.checked =
        Boolean(
            value
        );
}


function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";
    }


    return String(
        element.value
        ||
        ""
    ).trim();
}


/* =========================================================
   SETTINGS TABS
========================================================= */

function initSettingsTabs() {

    const buttons =
        document.querySelectorAll(
            ".settings-nav-item"
        );


    const panels =
        document.querySelectorAll(
            ".settings-panel"
        );


    buttons.forEach(
        function (
            button
        ) {

            button.addEventListener(
                "click",
                function () {

                    const target =
                        button.dataset.settingsTab;


                    if (!target) {

                        return;
                    }


                    buttons.forEach(
                        function (
                            item
                        ) {

                            item.classList.remove(
                                "active"
                            );
                        }
                    );


                    panels.forEach(
                        function (
                            panel
                        ) {

                            panel.classList.remove(
                                "active"
                            );
                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    const panel =
                        document.getElementById(
                            `settings-${target}`
                        );


                    if (panel) {

                        panel.classList.add(
                            "active"
                        );
                    }
                }
            );
        }
    );
}


/* =========================================================
   FAQ
========================================================= */

function initSettingsFaq() {

    document
        .querySelectorAll(
            ".settings-faq-question"
        )
        .forEach(
            function (
                question
            ) {

                question.addEventListener(
                    "click",
                    function () {

                        const item =
                            question.closest(
                                ".settings-faq-item"
                            );


                        if (item) {

                            item.classList.toggle(
                                "open"
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   SEARCH
========================================================= */

function initSettingsSearch() {

    const searchInput =
        document.getElementById(
            "settingsSearchInput"
        );


    if (!searchInput) {

        return;
    }


    searchInput.addEventListener(
        "input",
        function () {

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                return;
            }


            const buttons =
                document.querySelectorAll(
                    ".settings-nav-item"
                );


            for (
                const button
                of
                buttons
            ) {

                const text =
                    button.textContent
                        .trim()
                        .toLowerCase();


                if (
                    text.includes(
                        query
                    )
                ) {

                    button.click();

                    break;
                }
            }
        }
    );
}


/* =========================================================
   LOAD USER FROM DATABASE
========================================================= */

async function loadSettingsUser() {

    try {

        const data =
            await settingsApiRequest(
                "/api/auth/me",
                {
                    method:
                        "GET"
                }
            );


        const user =
            data.user
            ||
            data;


        settingsCurrentUser =
            user;


        fillSettingsUser(
            user
        );


        if (
            typeof saveUser ===
            "function"
        ) {

            saveUser(
                user
            );
        }


        if (
            typeof updateCandidateUserUI ===
            "function"
        ) {

            updateCandidateUserUI(
                user
            );
        }


        return user;


    } catch (error) {

        console.error(
            "Settings user load error:",
            error
        );


        showSettingsToast(
            error.message
            ||
            "Unable to load settings.",
            "error"
        );


        return null;
    }
}


/* =========================================================
   FILL ALL SETTINGS
========================================================= */

function fillSettingsUser(
    user
) {

    if (!user) {

        return;
    }


    fillAccountSettings(
        user
    );


    fillPreferenceSettings(
        user.preferences
        ||
        {}
    );


    fillNotificationSettings(
        user.notifications
        ||
        {}
    );


    fillPrivacySettings(
        user.privacy
        ||
        {}
    );
}


/* =========================================================
   ACCOUNT DATA
========================================================= */

function fillAccountSettings(
    user
) {

    const name =
        user.full_name
        ||
        user.name
        ||
        "Candidate";


    setInputValue(
        "settingsName",
        name
    );


    setInputValue(
        "settingsEmail",
        user.email
        ||
        ""
    );


    setInputValue(
        "settingsMobile",
        user.mobile
        ||
        ""
    );


    setInputValue(
        "settingsLocation",
        user.location
        ||
        ""
    );


    const emailInput =
        document.getElementById(
            "settingsEmail"
        );


    if (emailInput) {

        emailInput.readOnly =
            true;


        emailInput.title =
            "Use Change Email to update your email.";
    }


    const profileName =
        document.getElementById(
            "settingsProfileName"
        );


    if (profileName) {

        profileName.textContent =
            name;
    }


    const avatar =
        document.getElementById(
            "settingsAvatar"
        );


    if (avatar) {

        avatar.textContent =
            getSettingsInitials(
                name
            );
    }
}


/* =========================================================
   INITIALS
========================================================= */

function getSettingsInitials(
    name
) {

    const parts =
        String(
            name
            ||
            ""
        )
        .trim()
        .split(
            /\s+/
        )
        .filter(
            Boolean
        );


    if (
        parts.length ===
        0
    ) {

        return "C";
    }


    if (
        parts.length ===
        1
    ) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();
    }


    return (
        parts[0][0]
        +
        parts[
            parts.length - 1
        ][0]
    ).toUpperCase();
}


/* =========================================================
   BIND ACCOUNT
========================================================= */

function bindAccountSettings() {

    const button =
        document.getElementById(
            "saveAccountSettings"
        );


    if (button) {

        button.addEventListener(
            "click",
            saveAccountSettings
        );
    }
}


/* =========================================================
   SAVE ACCOUNT TO DATABASE
========================================================= */

async function saveAccountSettings() {

    const button =
        document.getElementById(
            "saveAccountSettings"
        );


    const name =
        getInputValue(
            "settingsName"
        );


    const mobile =
        getInputValue(
            "settingsMobile"
        );


    const location =
        getInputValue(
            "settingsLocation"
        );


    if (!name) {

        showSettingsToast(
            "Please enter your full name.",
            "error"
        );

        return;
    }


    if (
        name.length <
        2
    ) {

        showSettingsToast(
            "Full name must contain at least 2 characters.",
            "error"
        );

        return;
    }


    if (
        mobile
        &&
        (
            mobile.length < 7
            ||
            mobile.length > 20
        )
    ) {

        showSettingsToast(
            "Please enter a valid mobile number.",
            "error"
        );

        return;
    }


    setButtonLoading(
        button,
        true,
        "Saving..."
    );


    try {

        const data =
            await settingsApiRequest(
                "/api/auth/me",
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify(
                            {
                                full_name:
                                    name,

                                mobile:
                                    mobile
                                    ||
                                    null,

                                location:
                                    location
                                    ||
                                    null
                            }
                        )
                }
            );


        const user =
            data.user
            ||
            data;


        settingsCurrentUser =
            user;


        fillSettingsUser(
            user
        );


        if (
            typeof saveUser ===
            "function"
        ) {

            saveUser(
                user
            );
        }


        if (
            typeof updateCandidateUserUI ===
            "function"
        ) {

            updateCandidateUserUI(
                user
            );
        }


        showSettingsToast(
            "Account information updated successfully."
        );


    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        showSettingsToast(
            error.message
            ||
            "Unable to update account.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   PREFERENCES LOAD
========================================================= */

function fillPreferenceSettings(
    preferences
) {

    setInputValue(
        "preferredRole",
        preferences.preferred_role
        ||
        ""
    );


    setInputValue(
        "experienceLevel",
        preferences.experience_level
        ||
        ""
    );


    setInputValue(
        "workMode",
        preferences.work_mode
        ||
        ""
    );


    setInputValue(
        "analysisLanguage",
        preferences.analysis_language
        ||
        "english"
    );


    setCheckedValue(
        "aiSuggestionsToggle",
        preferences.ai_suggestions,
        true
    );


    setCheckedValue(
        "atsSuggestionsToggle",
        preferences.ats_suggestions,
        true
    );
}


/* =========================================================
   BIND PREFERENCES
========================================================= */

function bindPreferenceSettings() {

    const button =
        document.getElementById(
            "savePreferencesButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            savePreferences
        );
    }
}


/* =========================================================
   SAVE PREFERENCES TO DATABASE
========================================================= */

async function savePreferences() {

    const button =
        document.getElementById(
            "savePreferencesButton"
        );


    const preferences = {

        preferred_role:
            getInputValue(
                "preferredRole"
            ),

        experience_level:
            getInputValue(
                "experienceLevel"
            ),

        work_mode:
            getInputValue(
                "workMode"
            ),

        analysis_language:
            getInputValue(
                "analysisLanguage"
            )
            ||
            "english",

        ai_suggestions:
            Boolean(
                document.getElementById(
                    "aiSuggestionsToggle"
                )
                ?.checked
            ),

        ats_suggestions:
            Boolean(
                document.getElementById(
                    "atsSuggestionsToggle"
                )
                ?.checked
            )
    };


    setButtonLoading(
        button,
        true,
        "Saving..."
    );


    try {

        const data =
            await settingsApiRequest(
                "/api/auth/settings",
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify(
                            {
                                preferences:
                                    preferences
                            }
                        )
                }
            );


        if (
            data.user
        ) {

            settingsCurrentUser =
                data.user;


            fillSettingsUser(
                data.user
            );
        }


        showSettingsToast(
            "Preferences saved successfully."
        );


    } catch (error) {

        console.error(
            "Preference save error:",
            error
        );


        showSettingsToast(
            error.message
            ||
            "Unable to save preferences.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   NOTIFICATION LOAD
========================================================= */

function fillNotificationSettings(
    notifications
) {

    setCheckedValue(
        "analysisNotification",
        notifications.analysis_complete,
        true
    );


    setCheckedValue(
        "jobNotification",
        notifications.job_matches,
        true
    );


    setCheckedValue(
        "tipsNotification",
        notifications.resume_tips,
        true
    );


    setCheckedValue(
        "securityNotification",
        notifications.security_alerts,
        true
    );
}


/* =========================================================
   BIND NOTIFICATIONS
========================================================= */

function bindNotificationSettings() {

    const button =
        document.getElementById(
            "saveNotificationsButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            saveNotifications
        );
    }
}


/* =========================================================
   SAVE NOTIFICATIONS TO DATABASE
========================================================= */

async function saveNotifications() {

    const button =
        document.getElementById(
            "saveNotificationsButton"
        );


    const notifications = {

        analysis_complete:
            Boolean(
                document.getElementById(
                    "analysisNotification"
                )
                ?.checked
            ),

        job_matches:
            Boolean(
                document.getElementById(
                    "jobNotification"
                )
                ?.checked
            ),

        resume_tips:
            Boolean(
                document.getElementById(
                    "tipsNotification"
                )
                ?.checked
            ),

        security_alerts:
            Boolean(
                document.getElementById(
                    "securityNotification"
                )
                ?.checked
            )
    };


    setButtonLoading(
        button,
        true,
        "Saving..."
    );


    try {

        const data =
            await settingsApiRequest(
                "/api/auth/settings",
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify(
                            {
                                notifications:
                                    notifications
                            }
                        )
                }
            );


        if (
            data.user
        ) {

            settingsCurrentUser =
                data.user;


            fillSettingsUser(
                data.user
            );
        }


        showSettingsToast(
            "Notification settings saved."
        );


    } catch (error) {

        console.error(
            "Notification save error:",
            error
        );


        showSettingsToast(
            error.message
            ||
            "Unable to save notifications.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   PRIVACY LOAD
========================================================= */

function fillPrivacySettings(
    privacy
) {

    setInputValue(
        "resumeVisibility",
        privacy.resume_visibility
        ||
        "private"
    );
}


/* =========================================================
   BIND PRIVACY
========================================================= */

function bindPrivacySettings() {

    const visibility =
        document.getElementById(
            "resumeVisibility"
        );


    const saveButton =
        document.getElementById(
            "savePrivacyButton"
        );


    const downloadButton =
        document.getElementById(
            "downloadDataButton"
        );


    const deactivateButton =
        document.getElementById(
            "deactivateAccountButton"
        );


    const deleteButton =
        document.getElementById(
            "deleteAccountButton"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            savePrivacySettings
        );

    } else if (visibility) {

        visibility.addEventListener(
            "change",
            savePrivacySettings
        );
    }


    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            downloadUserData
        );
    }


    if (deactivateButton) {

        deactivateButton.addEventListener(
            "click",
            function () {

                showSettingsToast(
                    "Account deactivation backend is not available yet.",
                    "error"
                );
            }
        );
    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            function () {

                showSettingsToast(
                    "Account deletion backend is not available yet.",
                    "error"
                );
            }
        );
    }
}


/* =========================================================
   SAVE PRIVACY TO DATABASE
========================================================= */

async function savePrivacySettings() {

    const button =
        document.getElementById(
            "savePrivacyButton"
        );


    const privacy = {

        resume_visibility:
            getInputValue(
                "resumeVisibility"
            )
            ||
            "private"
    };


    setButtonLoading(
        button,
        true,
        "Saving..."
    );


    try {

        const data =
            await settingsApiRequest(
                "/api/auth/settings",
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify(
                            {
                                privacy:
                                    privacy
                            }
                        )
                }
            );


        if (
            data.user
        ) {

            settingsCurrentUser =
                data.user;


            fillSettingsUser(
                data.user
            );
        }


        showSettingsToast(
            "Privacy settings updated."
        );


    } catch (error) {

        console.error(
            "Privacy save error:",
            error
        );


        showSettingsToast(
            error.message
            ||
            "Unable to save privacy settings.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   PASSWORD EVENTS
========================================================= */

function bindPasswordSettings() {

    const button =
        document.getElementById(
            "changePasswordButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            changePassword
        );
    }


    const logoutButton =
        document.getElementById(
            "logoutAllButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                const confirmed =
                    window.confirm(
                        "Do you want to logout?"
                    );


                if (confirmed) {

                    handleSettingsLogout();
                }
            }
        );
    }
}


/* =========================================================
   CHANGE PASSWORD
========================================================= */

async function changePassword() {

    const currentPassword =
        document.getElementById(
            "currentPassword"
        )
        ?.value
        ||
        "";


    const newPassword =
        document.getElementById(
            "newPassword"
        )
        ?.value
        ||
        "";


    const confirmPassword =
        document.getElementById(
            "confirmNewPassword"
        )
        ?.value
        ||
        "";


    const button =
        document.getElementById(
            "changePasswordButton"
        );


    if (
        !currentPassword
        ||
        !newPassword
        ||
        !confirmPassword
    ) {

        showSettingsToast(
            "Please complete all password fields.",
            "error"
        );

        return;
    }


    if (
        newPassword.length <
        8
    ) {

        showSettingsToast(
            "New password must contain at least 8 characters.",
            "error"
        );

        return;
    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showSettingsToast(
            "New password and confirm password do not match.",
            "error"
        );

        return;
    }


    if (
        currentPassword ===
        newPassword
    ) {

        showSettingsToast(
            "New password must be different from current password.",
            "error"
        );

        return;
    }


    setButtonLoading(
        button,
        true,
        "Updating..."
    );


    try {

        const data =
            await settingsApiRequest(
                "/api/auth/change-password",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            {
                                current_password:
                                    currentPassword,

                                new_password:
                                    newPassword,

                                confirm_password:
                                    confirmPassword
                            }
                        )
                }
            );


        clearPasswordFields();


        showSettingsToast(
            data.message
            ||
            "Password changed successfully."
        );


    } catch (error) {

        console.error(
            "Password update error:",
            error
        );


        showSettingsToast(
            error.message
            ||
            "Unable to change password.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   CLEAR PASSWORD FIELDS
========================================================= */

function clearPasswordFields() {

    [
        "currentPassword",
        "newPassword",
        "confirmNewPassword"
    ]
    .forEach(
        function (
            id
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value =
                    "";
            }
        }
    );
}


/* =========================================================
   EMAIL CHANGE BUTTON
========================================================= */

function initEmailChangeUI() {

    const emailInput =
        document.getElementById(
            "settingsEmail"
        );


    if (!emailInput) {

        return;
    }


    if (
        document.getElementById(
            "changeEmailButton"
        )
    ) {

        return;
    }


    const parent =
        emailInput.parentElement;


    if (!parent) {

        return;
    }


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.id =
        "changeEmailButton";


    button.className =
        "settings-secondary-button mt-2";


    button.innerHTML =
        `
        <i class="bi bi-envelope"></i>
        Change Email
        `;


    parent.appendChild(
        button
    );


    createEmailChangeModal();


    button.addEventListener(
        "click",
        openEmailChangeModal
    );
}


/* =========================================================
   CREATE EMAIL MODAL
========================================================= */

function createEmailChangeModal() {

    if (
        document.getElementById(
            "emailChangeModal"
        )
    ) {

        return;
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.innerHTML =
        `
        <div
            class="modal fade"
            id="emailChangeModal"
            tabindex="-1"
        >
            <div
                class="modal-dialog modal-dialog-centered"
            >
                <div
                    class="modal-content"
                >

                    <div
                        class="modal-header"
                    >
                        <h5
                            class="modal-title"
                        >
                            Change Email
                        </h5>

                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="modal"
                        ></button>
                    </div>

                    <div
                        class="modal-body"
                    >

                        <div
                            id="emailChangeStepOne"
                        >

                            <label
                                class="form-label"
                            >
                                New Email Address
                            </label>

                            <input
                                id="newSettingsEmail"
                                type="email"
                                class="form-control"
                                placeholder="Enter new email"
                            >

                            <p
                                class="small text-muted mt-2"
                            >
                                OTP will be sent to your new email.
                            </p>

                            <button
                                id="sendEmailOtpButton"
                                type="button"
                                class="settings-primary-button mt-2"
                            >
                                Send OTP
                            </button>

                        </div>


                        <div
                            id="emailChangeStepTwo"
                            style="display:none;"
                        >

                            <label
                                class="form-label"
                            >
                                Enter OTP
                            </label>

                            <input
                                id="emailChangeOtp"
                                type="text"
                                class="form-control"
                                maxlength="6"
                                placeholder="6-digit OTP"
                            >

                            <button
                                id="verifyEmailOtpButton"
                                type="button"
                                class="settings-primary-button mt-3"
                            >
                                Verify & Change Email
                            </button>

                            <button
                                id="resendEmailOtpButton"
                                type="button"
                                class="settings-secondary-button mt-3 ms-2"
                            >
                                Resend OTP
                            </button>

                        </div>

                    </div>

                </div>
            </div>
        </div>
        `;


    document.body.appendChild(
        modal.firstElementChild
    );


    document
        .getElementById(
            "sendEmailOtpButton"
        )
        ?.addEventListener(
            "click",
            sendEmailChangeOtp
        );


    document
        .getElementById(
            "verifyEmailOtpButton"
        )
        ?.addEventListener(
            "click",
            verifyEmailChangeOtp
        );


    document
        .getElementById(
            "resendEmailOtpButton"
        )
        ?.addEventListener(
            "click",
            resendEmailChangeOtp
        );
}


/* =========================================================
   OPEN EMAIL MODAL
========================================================= */

function openEmailChangeModal() {

    const modalElement =
        document.getElementById(
            "emailChangeModal"
        );


    if (!modalElement) {

        return;
    }


    setInputValue(
        "newSettingsEmail",
        ""
    );


    setInputValue(
        "emailChangeOtp",
        ""
    );


    const firstStep =
        document.getElementById(
            "emailChangeStepOne"
        );


    const secondStep =
        document.getElementById(
            "emailChangeStepTwo"
        );


    if (firstStep) {

        firstStep.style.display =
            "block";
    }


    if (secondStep) {

        secondStep.style.display =
            "none";
    }


    pendingSettingsEmail =
        null;


    if (
        typeof bootstrap !==
        "undefined"
    ) {

        const modal =
            bootstrap.Modal
                .getOrCreateInstance(
                    modalElement
                );


        modal.show();

    } else {

        const email =
            window.prompt(
                "Enter new email address:"
            );


        if (email) {

            setInputValue(
                "newSettingsEmail",
                email
            );


            sendEmailChangeOtp();
        }
    }
}


/* =========================================================
   SEND EMAIL OTP
========================================================= */

async function sendEmailChangeOtp() {

    const button =
        document.getElementById(
            "sendEmailOtpButton"
        );


    const newEmail =
        getInputValue(
            "newSettingsEmail"
        )
        .toLowerCase();


    if (!newEmail) {

        showSettingsToast(
            "Please enter your new email.",
            "error"
        );

        return;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(
            newEmail
        )
    ) {

        showSettingsToast(
            "Please enter a valid email address.",
            "error"
        );

        return;
    }


    const currentEmail =
        getInputValue(
            "settingsEmail"
        )
        .toLowerCase();


    if (
        currentEmail ===
        newEmail
    ) {

        showSettingsToast(
            "New email must be different from current email.",
            "error"
        );

        return;
    }


    setButtonLoading(
        button,
        true,
        "Sending..."
    );


    try {

        const data =
            await settingsApiRequest(
                "/api/auth/change-email/send-otp",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            {
                                new_email:
                                    newEmail
                            }
                        )
                }
            );


        pendingSettingsEmail =
            data.new_email
            ||
            newEmail;


        const firstStep =
            document.getElementById(
                "emailChangeStepOne"
            );


        const secondStep =
            document.getElementById(
                "emailChangeStepTwo"
            );


        if (firstStep) {

            firstStep.style.display =
                "none";
        }


        if (secondStep) {

            secondStep.style.display =
                "block";
        }


        showSettingsToast(
            "OTP sent to your new email address."
        );


    } catch (error) {

        console.error(
            "Email OTP send error:",
            error
        );


        showSettingsToast(
            error.message
            ||
            "Unable to send OTP.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   RESEND EMAIL OTP
========================================================= */

async function resendEmailChangeOtp() {

    if (!pendingSettingsEmail) {

        showSettingsToast(
            "Please enter your new email first.",
            "error"
        );

        return;
    }


    setInputValue(
        "newSettingsEmail",
        pendingSettingsEmail
    );


    await sendEmailChangeOtp();
}


/* =========================================================
   VERIFY EMAIL OTP
========================================================= */

async function verifyEmailChangeOtp() {

    const button =
        document.getElementById(
            "verifyEmailOtpButton"
        );


    const otp =
        getInputValue(
            "emailChangeOtp"
        );


    if (!pendingSettingsEmail) {

        showSettingsToast(
            "Please request OTP first.",
            "error"
        );

        return;
    }


    if (
        !/^\d{6}$/.test(
            otp
        )
    ) {

        showSettingsToast(
            "Please enter a valid 6-digit OTP.",
            "error"
        );

        return;
    }


    setButtonLoading(
        button,
        true,
        "Verifying..."
    );


    try {

        const data =
            await settingsApiRequest(
                "/api/auth/change-email/verify-otp",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            {
                                new_email:
                                    pendingSettingsEmail,

                                otp:
                                    otp
                            }
                        )
                }
            );


        if (
            data.user
        ) {

            settingsCurrentUser =
                data.user;


            fillSettingsUser(
                data.user
            );


            if (
                typeof updateCandidateUserUI ===
                "function"
            ) {

                updateCandidateUserUI(
                    data.user
                );
            }
        }


        showSettingsToast(
            "Email updated successfully."
        );


        const modalElement =
            document.getElementById(
                "emailChangeModal"
            );


        if (
            modalElement
            &&
            typeof bootstrap !==
            "undefined"
        ) {

            const modal =
                bootstrap.Modal
                    .getInstance(
                        modalElement
                    );


            if (modal) {

                modal.hide();
            }
        }


        if (
            data.requires_relogin
        ) {

            setTimeout(
                function () {

                    handleSettingsLogout();

                },
                1200
            );
        }


    } catch (error) {

        console.error(
            "Email OTP verification error:",
            error
        );


        showSettingsToast(
            error.message
            ||
            "Unable to verify OTP.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   DOWNLOAD ACCOUNT DATA
========================================================= */

async function downloadUserData() {

    const button =
        document.getElementById(
            "downloadDataButton"
        );


    setButtonLoading(
        button,
        true,
        "Preparing..."
    );


    try {

        const user =
            await loadSettingsUser();


        if (!user) {

            throw new Error(
                "Unable to load user information."
            );
        }


        const exportData = {

            exported_at:
                new Date()
                    .toISOString(),

            account:
                user
        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        exportData,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "resumeiq-account-data.json";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showSettingsToast(
            "Account data downloaded."
        );


    } catch (error) {

        showSettingsToast(
            error.message
            ||
            "Unable to download data.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   TROUBLESHOOTING
========================================================= */

function bindTroubleshootingSettings() {

    bindSettingsClick(
        "refreshAccountButton",
        refreshAccountData
    );


    bindSettingsClick(
        "resumeUploadHelpButton",
        showResumeUploadHelp
    );


    bindSettingsClick(
        "refreshAnalysisButton",
        refreshAnalysisData
    );


    bindSettingsClick(
        "clearCacheButton",
        clearResumeIQCache
    );


    bindSettingsClick(
        "checkServerButton",
        checkServerStatus
    );
}


function bindSettingsClick(
    id,
    callback
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.addEventListener(
            "click",
            callback
        );
    }
}


/* =========================================================
   REFRESH ACCOUNT
========================================================= */

async function refreshAccountData() {

    const button =
        document.getElementById(
            "refreshAccountButton"
        );


    setButtonLoading(
        button,
        true,
        "Refreshing..."
    );


    try {

        const user =
            await loadSettingsUser();


        if (!user) {

            throw new Error(
                "Unable to refresh account."
            );
        }


        const sync =
            document.getElementById(
                "settingsLastSync"
            );


        if (sync) {

            sync.textContent =
                new Date()
                    .toLocaleString();
        }


        showSettingsToast(
            "Account data refreshed from database."
        );


    } catch (error) {

        showSettingsToast(
            error.message,
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   RESUME HELP
========================================================= */

function showResumeUploadHelp() {

    window.alert(
        [
            "Resume Upload Help",
            "",
            "Supported formats: PDF, DOCX",
            "Maximum size: 10 MB",
            "",
            "If upload fails:",
            "1. Check file type",
            "2. Check file size",
            "3. Refresh page",
            "4. Check API status"
        ]
        .join(
            "\n"
        )
    );
}


/* =========================================================
   ANALYSIS PAGE
========================================================= */

function refreshAnalysisData() {

    window.location.href =
        "analysis.html";
}


/* =========================================================
   CLEAR TEMPORARY CACHE
========================================================= */

function clearResumeIQCache() {

    const confirmed =
        window.confirm(
            "Clear temporary ResumeIQ cache?"
        );


    if (!confirmed) {

        return;
    }


    /*
     * IMPORTANT:
     * Database settings are NOT deleted.
     *
     * Only temporary session information
     * is removed.
     */

    sessionStorage.removeItem(
        "resumeiq_current_resume_id"
    );


    sessionStorage.removeItem(
        "resumeiq_current_analysis"
    );


    showSettingsToast(
        "Temporary cache cleared."
    );
}


/* =========================================================
   SERVER STATUS
========================================================= */

async function checkServerStatus() {

    const button =
        document.getElementById(
            "checkServerButton"
        );


    const statusElement =
        document.getElementById(
            "settingsApiStatus"
        );


    setButtonLoading(
        button,
        true,
        "Checking..."
    );


    if (statusElement) {

        statusElement.textContent =
            "Checking...";
    }


    try {

        const response =
            await fetch(
                `${SETTINGS_API_BASE}/health`
            );


        if (!response.ok) {

            throw new Error(
                "API unavailable."
            );
        }


        if (statusElement) {

            statusElement.textContent =
                "Online";
        }


        showSettingsToast(
            "ResumeIQ API is online."
        );


    } catch (error) {

        if (statusElement) {

            statusElement.textContent =
                "Offline";
        }


        showSettingsToast(
            "ResumeIQ API is offline.",
            "error"
        );


    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function handleSettingsLogout() {

    sessionStorage.removeItem(
        "resumeiq_current_resume_id"
    );


    sessionStorage.removeItem(
        "resumeiq_current_analysis"
    );


    if (
        typeof logoutUser ===
        "function"
    ) {

        logoutUser();

        return;
    }


    if (
        typeof clearAuthData ===
        "function"
    ) {

        clearAuthData();
    }


    localStorage.removeItem(
        "resumeiq_token"
    );


    localStorage.removeItem(
        "access_token"
    );


    localStorage.removeItem(
        "token"
    );


    sessionStorage.removeItem(
        "resumeiq_token"
    );


    sessionStorage.removeItem(
        "access_token"
    );


    sessionStorage.removeItem(
        "token"
    );


    window.location.replace(
        "../auth/login.html"
    );
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.loadSettingsUser =
    loadSettingsUser;


window.saveAccountSettings =
    saveAccountSettings;


window.savePreferences =
    savePreferences;


window.saveNotifications =
    saveNotifications;


window.savePrivacySettings =
    savePrivacySettings;


window.changePassword =
    changePassword;