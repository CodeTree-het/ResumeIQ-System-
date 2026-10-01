const PROFILE_API_BASE_URL =
    "http://127.0.0.1:8000";

let currentProfileUser =
    null;

let pendingProfileEmailChange =
    null;

document.addEventListener(
    "DOMContentLoaded",
    function () {
        initializeProfileDropdown();
        initializeProfileEdit();
        loadCandidateProfile();
    }
);

async function loadCandidateProfile() {
    try {
        const token =
            getToken();

        if (!token) {
            window.location.replace(
                "../auth/login.html"
            );
            return;
        }

        const user =
            await getCurrentUser(
                token
            );

        if (!user) {
            window.location.replace(
                "../auth/login.html"
            );
            return;
        }

        const role =
            String(
                user.role
                ||
                ""
            )
            .trim()
            .toLowerCase();

        if (
            role !==
            "candidate"
        ) {
            redirectByRole(
                role
            );
            return;
        }

        currentProfileUser =
            user;

        renderProfileUser(
            user
        );

        const resumes =
            await getProfileResumes(
                token
            );

        await renderProfileResumeData(
            resumes,
            token
        );

        document.body.style.visibility =
            "visible";

    } catch (error) {
        console.error(
            "Profile loading failed:",
            error
        );

        document.body.style.visibility =
            "visible";
    }
}

function renderProfileUser(
    user
) {
    currentProfileUser =
        user;

    const fullName =
        user.full_name
        ||
        user.name
        ||
        user.username
        ||
        "Candidate";

    const email =
        user.email
        ||
        "Not provided";

    const mobile =
        user.mobile
        ||
        user.phone
        ||
        user.phone_number
        ||
        "Not provided";

    const role =
        String(
            user.role
            ||
            "candidate"
        );

    const roleLabel =
        capitalizeProfileValue(
            role
        );

    const initials =
        getProfileInitials(
            fullName
        );

    const verified =
        Boolean(
            user.is_email_verified
            ??
            user.email_verified
            ??
            false
        );

    const createdAt =
        user.created_at
        ||
        user.registered_at
        ||
        user.createdAt
        ||
        null;

    const accountStatus =
        String(
            user.status
            ||
            "active"
        )
        .trim()
        .toLowerCase();

    document
        .querySelectorAll(
            "[data-candidate-name]"
        )
        .forEach(
            function (
                element
            ) {
                element.textContent =
                    fullName;
            }
        );

    document
        .querySelectorAll(
            "[data-candidate-role]"
        )
        .forEach(
            function (
                element
            ) {
                element.textContent =
                    roleLabel;
            }
        );

    document
        .querySelectorAll(
            "[data-candidate-avatar]"
        )
        .forEach(
            function (
                element
            ) {
                element.textContent =
                    initials;
            }
        );

    document
        .querySelectorAll(
            "[data-candidate-email]"
        )
        .forEach(
            function (
                element
            ) {
                element.textContent =
                    email;
            }
        );

    setProfileText(
        "profileLargeAvatar",
        initials
    );

    setProfileText(
        "profileFullName",
        fullName
    );

    setProfileText(
        "profileHeroEmail",
        email
    );

    setProfileText(
        "profileHeroRole",
        roleLabel
    );

    renderAccountStatus(
        accountStatus
    );

    setProfileText(
        "profileStatRole",
        roleLabel
    );

    setProfileText(
        "profileName",
        fullName
    );

    setProfileText(
        "profileEmail",
        email
    );

    setProfileText(
        "profileMobile",
        mobile
    );

    setProfileText(
        "profileRole",
        roleLabel
    );

    setProfileText(
        "profileMemberSince",
        formatProfileDate(
            createdAt
        )
        ||
        "Not available"
    );

    renderVerificationStatus(
        verified
    );
}

function renderAccountStatus(
    statusValue
) {
    const element =
        document.getElementById(
            "profileAccountStatus"
        );

    const dot =
        document.getElementById(
            "profileStatusDot"
        );

    if (!element) {
        return;
    }

    const status =
        String(
            statusValue
            ||
            "active"
        )
        .trim()
        .toLowerCase();

    if (
        status ===
        "active"
    ) {
        element.innerHTML =
            `
                <i class="bi bi-check-circle-fill"></i>
                Active
            `;

        element.style.color =
            "#079d79";

        if (dot) {
            dot.style.background =
                "#0db58b";
        }

        return;
    }

    element.textContent =
        capitalizeProfileValue(
            status
        );

    element.style.color =
        "#ce8b20";

    if (dot) {
        dot.style.background =
            "#ce8b20";
    }
}

function renderVerificationStatus(
    verified
) {
    const verification =
        document.getElementById(
            "profileVerification"
        );

    const badge =
        document.getElementById(
            "profileVerifiedBadge"
        );

    const overview =
        document.getElementById(
            "profileOverviewVerification"
        );

    if (verified) {
        if (verification) {
            verification.textContent =
                "Verified";

            verification.classList.remove(
                "unverified"
            );

            verification.classList.add(
                "verified"
            );
        }

        if (badge) {
            badge.innerHTML =
                `
                    <i class="bi bi-patch-check-fill"></i>
                    Verified
                `;

            badge.style.background =
                "#e5f8f2";

            badge.style.color =
                "#079d79";
        }

        if (overview) {
            overview.textContent =
                "Verified";

            overview.classList.remove(
                "pending"
            );
        }

        return;
    }

    if (verification) {
        verification.textContent =
            "Not Verified";

        verification.classList.remove(
            "verified"
        );

        verification.classList.add(
            "unverified"
        );
    }

    if (badge) {
        badge.innerHTML =
            `
                <i class="bi bi-exclamation-circle-fill"></i>
                Pending
            `;

        badge.style.background =
            "#fff4df";

        badge.style.color =
            "#c58119";
    }

    if (overview) {
        overview.textContent =
            "Pending";

        overview.classList.add(
            "pending"
        );
    }
}

async function getProfileResumes(
    token
) {
    try {
        const response =
            await fetch(
                `${PROFILE_API_BASE_URL}/api/resumes`,
                {
                    method:
                        "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );

        if (!response.ok) {
            return [];
        }

        const data =
            await response.json();

        if (
            Array.isArray(
                data
            )
        ) {
            return data;
        }

        if (
            Array.isArray(
                data.resumes
            )
        ) {
            return data.resumes;
        }

        if (
            Array.isArray(
                data.data
            )
        ) {
            return data.data;
        }

        return [];

    } catch (error) {
        console.error(
            "Unable to load profile resumes:",
            error
        );

        return [];
    }
}

async function renderProfileResumeData(
    resumes,
    token
) {
    const validResumes =
        Array.isArray(
            resumes
        )
            ?
            resumes.filter(
                function (
                    resume
                ) {
                    return (
                        resume.is_deleted
                        !==
                        true
                    );
                }
            )
            :
            [];

    setProfileText(
        "profileResumeCount",
        String(
            validResumes.length
        )
    );

    const resumeStatus =
        document.getElementById(
            "profileResumeStatusText"
        );

    if (
        validResumes.length ===
        0
    ) {
        if (resumeStatus) {
            resumeStatus.textContent =
                "No resume uploaded";
        }

        setProfileText(
            "profileResumeScore",
            "--"
        );

        setProfileText(
            "profileSkillCount",
            "--"
        );

        setProfileText(
            "profileAnalysisStatusText",
            "Analysis not available"
        );

        return;
    }

    if (resumeStatus) {
        resumeStatus.textContent =
            `${validResumes.length} resume${validResumes.length === 1 ? "" : "s"} available`;
    }

    const activeResume =
        getProfileActiveResume(
            validResumes
        );

    if (!activeResume) {
        return;
    }

    const resumeId =
        getProfileResumeId(
            activeResume
        );

    if (!resumeId) {
        return;
    }

    const analysis =
        await getProfileAnalysis(
            resumeId,
            token
        );

    if (!analysis) {
        setProfileText(
            "profileResumeScore",
            "--"
        );

        setProfileText(
            "profileSkillCount",
            "--"
        );

        setProfileText(
            "profileAnalysisStatusText",
            "Latest resume not analyzed"
        );

        return;
    }

    const score =
        Number(
            analysis.resume_score
            ??
            analysis.ats_score?.rule_score
            ??
            analysis.score
            ??
            0
        );

    if (
        Number.isFinite(
            score
        )
    ) {
        setProfileText(
            "profileResumeScore",
            `${Math.round(score)}/100`
        );
    } else {
        setProfileText(
            "profileResumeScore",
            "--"
        );
    }

    const skills =
        Array.isArray(
            analysis.skills
        )
            ?
            analysis.skills
            :
        Array.isArray(
            analysis.extracted_data?.skills
        )
            ?
            analysis.extracted_data.skills
            :
        Array.isArray(
            analysis.extracted_skills
        )
            ?
            analysis.extracted_skills
            :
            [];

    setProfileText(
        "profileSkillCount",
        String(
            skills.length
        )
    );

    setProfileText(
        "profileAnalysisStatusText",
        "Latest resume analyzed successfully"
    );
}

function getProfileActiveResume(
    resumes
) {
    if (
        !Array.isArray(
            resumes
        )
        ||
        resumes.length ===
        0
    ) {
        return null;
    }

    const active =
        resumes.find(
            function (
                resume
            ) {
                return (
                    resume.is_active
                    ===
                    true
                );
            }
        );

    if (active) {
        return active;
    }

    const sorted = [
        ...resumes
    ];

    sorted.sort(
        function (
            a,
            b
        ) {
            return (
                new Date(
                    b.uploaded_at
                    ||
                    b.created_at
                    ||
                    0
                )
                -
                new Date(
                    a.uploaded_at
                    ||
                    a.created_at
                    ||
                    0
                )
            );
        }
    );

    return sorted[0];
}

function getProfileResumeId(
    resume
) {
    return (
        resume?.resume_id
        ||
        resume?.id
        ||
        resume?._id
        ||
        null
    );
}

async function getProfileAnalysis(
    resumeId,
    token
) {
    try {
        const response =
            await fetch(
                `${PROFILE_API_BASE_URL}/api/resumes/${encodeURIComponent(resumeId)}/analysis`,
                {
                    method:
                        "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );

        if (!response.ok) {
            return null;
        }

        const data =
            await response.json();

        if (
            data?.analysis
            &&
            typeof data.analysis ===
            "object"
        ) {
            return data.analysis;
        }

        if (
            data
            &&
            typeof data ===
            "object"
            &&
            (
                data.resume_score !==
                undefined
                ||
                data.ats_score !==
                undefined
                ||
                data.skills !==
                undefined
                ||
                data.extracted_data !==
                undefined
            )
        ) {
            return data;
        }

        return null;

    } catch (error) {
        console.error(
            "Unable to load profile analysis:",
            error
        );

        return null;
    }
}

function initializeProfileEdit() {
    const editButton =
        document.getElementById(
            "editProfileButton"
        );

    const modal =
        document.getElementById(
            "profileEditModal"
        );

    const form =
        document.getElementById(
            "profileEditForm"
        );

    const closeButton =
        document.getElementById(
            "profileEditCloseButton"
        );

    const cancelButton =
        document.getElementById(
            "profileEditCancelButton"
        );

    const sendEmailOtpButton =
        document.getElementById(
            "sendEmailChangeOtpButton"
        );

    const verifyEmailOtpButton =
        document.getElementById(
            "verifyEmailChangeOtpButton"
        );

    const resendEmailOtpButton =
        document.getElementById(
            "resendEmailChangeOtpButton"
        );

    const emailInput =
        document.getElementById(
            "editProfileEmail"
        );

    const otpInput =
        document.getElementById(
            "editProfileEmailOtp"
        );

    if (
        !modal
        ||
        !form
    ) {
        return;
    }

    if (editButton) {
        editButton.addEventListener(
            "click",
            function () {
                openProfileEditModal();
            }
        );
    }

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            function () {
                closeProfileEditModal();
            }
        );
    }

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            function () {
                closeProfileEditModal();
            }
        );
    }

    modal
        .querySelectorAll(
            "[data-profile-modal-close]"
        )
        .forEach(
            function (
                element
            ) {
                element.addEventListener(
                    "click",
                    function () {
                        closeProfileEditModal();
                    }
                );
            }
        );

    form.addEventListener(
        "submit",
        handleProfileEditSubmit
    );

    if (sendEmailOtpButton) {
        sendEmailOtpButton.addEventListener(
            "click",
            function () {
                sendProfileEmailChangeOtp(
                    false
                );
            }
        );
    }

    if (verifyEmailOtpButton) {
        verifyEmailOtpButton.addEventListener(
            "click",
            verifyProfileEmailChangeOtp
        );
    }

    if (resendEmailOtpButton) {
        resendEmailOtpButton.addEventListener(
            "click",
            function () {
                sendProfileEmailChangeOtp(
                    true
                );
            }
        );
    }

    if (emailInput) {
        emailInput.addEventListener(
            "input",
            function () {
                const typedEmail =
                    normalizeProfileEmail(
                        emailInput.value
                    );

                if (
                    pendingProfileEmailChange
                    &&
                    typedEmail !==
                    pendingProfileEmailChange
                ) {
                    resetProfileEmailOtpState(
                        true
                    );
                }
            }
        );
    }

    if (otpInput) {
        otpInput.addEventListener(
            "input",
            function () {
                otpInput.value =
                    String(
                        otpInput.value
                        ||
                        ""
                    )
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        6
                    );
            }
        );

        otpInput.addEventListener(
            "keydown",
            function (
                event
            ) {
                if (
                    event.key ===
                    "Enter"
                ) {
                    event.preventDefault();

                    verifyProfileEmailChangeOtp();
                }
            }
        );
    }

    document.addEventListener(
        "keydown",
        function (
            event
        ) {
            if (
                event.key ===
                "Escape"
                &&
                modal.classList.contains(
                    "show"
                )
            ) {
                closeProfileEditModal();
            }
        }
    );
}

function openProfileEditModal() {
    const modal =
        document.getElementById(
            "profileEditModal"
        );

    const fullNameInput =
        document.getElementById(
            "editProfileFullName"
        );

    const emailInput =
        document.getElementById(
            "editProfileEmail"
        );

    const mobileInput =
        document.getElementById(
            "editProfileMobile"
        );

    if (!modal) {
        return;
    }

    const user =
        currentProfileUser
        ||
        {};

    if (fullNameInput) {
        fullNameInput.value =
            user.full_name
            ||
            user.name
            ||
            "";
    }

    if (emailInput) {
        emailInput.value =
            user.email
            ||
            "";
    }

    if (mobileInput) {
        mobileInput.value =
            user.mobile
            ||
            user.phone
            ||
            user.phone_number
            ||
            "";
    }

    resetProfileEmailOtpState(
        true
    );

    clearProfileEditMessage();

    modal.classList.add(
        "show"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "profile-modal-open"
    );

    setTimeout(
        function () {
            fullNameInput?.focus();
        },
        50
    );
}

function closeProfileEditModal() {
    const modal =
        document.getElementById(
            "profileEditModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "show"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "profile-modal-open"
    );

    resetProfileEmailOtpState(
        true
    );

    clearProfileEditMessage();
}

async function handleProfileEditSubmit(
    event
) {
    event.preventDefault();

    const fullNameInput =
        document.getElementById(
            "editProfileFullName"
        );

    const emailInput =
        document.getElementById(
            "editProfileEmail"
        );

    const mobileInput =
        document.getElementById(
            "editProfileMobile"
        );

    const saveButton =
        document.getElementById(
            "profileEditSaveButton"
        );

    const fullName =
        String(
            fullNameInput?.value
            ||
            ""
        )
        .trim();

    const mobile =
        String(
            mobileInput?.value
            ||
            ""
        )
        .trim();

    const typedEmail =
        normalizeProfileEmail(
            emailInput?.value
        );

    const currentEmail =
        normalizeProfileEmail(
            currentProfileUser?.email
        );

    if (
        fullName.length <
        2
    ) {
        showProfileEditMessage(
            "Please enter a valid full name.",
            "error"
        );

        fullNameInput?.focus();

        return;
    }

    if (
        mobile
        &&
        (
            mobile.length < 7
            ||
            mobile.length > 20
            ||
            !/^[0-9+\-\s()]+$/.test(
                mobile
            )
        )
    ) {
        showProfileEditMessage(
            "Please enter a valid mobile number.",
            "error"
        );

        mobileInput?.focus();

        return;
    }

    if (
        typedEmail
        &&
        !isValidProfileEmail(
            typedEmail
        )
    ) {
        showProfileEditMessage(
            "Please enter a valid email address.",
            "error"
        );

        emailInput?.focus();

        return;
    }

    const token =
        getToken();

    if (!token) {
        window.location.replace(
            "../auth/login.html"
        );

        return;
    }

    try {
        setProfileEditLoading(
            saveButton,
            true
        );

        clearProfileEditMessage();

        const updatedUser =
            await updateCandidateProfile(
                token,
                {
                    full_name:
                        fullName,

                    mobile:
                        mobile
                        ||
                        null
                }
            );

        currentProfileUser =
            updatedUser;

        renderProfileUser(
            updatedUser
        );

        if (
            typedEmail
            &&
            typedEmail !==
            currentEmail
        ) {
            showProfileEditMessage(
                "Name/mobile saved. For the new email, click Send OTP and verify the 6-digit OTP.",
                "success"
            );

            return;
        }

        showProfileEditMessage(
            "Profile updated successfully.",
            "success"
        );

        setTimeout(
            function () {
                closeProfileEditModal();
            },
            700
        );

    } catch (error) {
        console.error(
            "Profile update failed:",
            error
        );

        showProfileEditMessage(
            error.message
            ||
            "Unable to update profile.",
            "error"
        );

    } finally {
        setProfileEditLoading(
            saveButton,
            false
        );
    }
}

async function updateCandidateProfile(
    token,
    payload
) {
    const response =
        await fetch(
            `${PROFILE_API_BASE_URL}/api/auth/me`,
            {
                method:
                    "PATCH",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

    const data =
        await readProfileApiResponse(
            response
        );

    if (
        response.status ===
        401
    ) {
        throw new Error(
            "Your session has expired. Please login again."
        );
    }

    if (!response.ok) {
        throw new Error(
            getProfileApiErrorMessage(
                data,
                "Unable to update profile."
            )
        );
    }

    const user =
        data?.user
        ||
        data?.data
        ||
        null;

    if (
        !user
        ||
        typeof user !==
        "object"
    ) {
        throw new Error(
            "Updated profile was not returned by the server."
        );
    }

    return user;
}

async function sendProfileEmailChangeOtp(
    isResend = false
) {
    const emailInput =
        document.getElementById(
            "editProfileEmail"
        );

    const sendButton =
        document.getElementById(
            "sendEmailChangeOtpButton"
        );

    const resendButton =
        document.getElementById(
            "resendEmailChangeOtpButton"
        );

    const newEmail =
        normalizeProfileEmail(
            emailInput?.value
        );

    const currentEmail =
        normalizeProfileEmail(
            currentProfileUser?.email
        );

    if (
        !newEmail
        ||
        !isValidProfileEmail(
            newEmail
        )
    ) {
        showProfileEditMessage(
            "Please enter a valid new email address.",
            "error"
        );

        emailInput?.focus();

        return;
    }

    if (
        newEmail ===
        currentEmail
    ) {
        showProfileEditMessage(
            "New email must be different from your current email.",
            "error"
        );

        emailInput?.focus();

        return;
    }

    const token =
        getToken();

    if (!token) {
        window.location.replace(
            "../auth/login.html"
        );

        return;
    }

    const activeButton =
        isResend
        ?
        resendButton
        :
        sendButton;

    try {
        setProfileEmailButtonLoading(
            activeButton,
            true,
            isResend
                ?
                "Resending..."
                :
                "Sending..."
        );

        clearProfileEditMessage();

        const response =
            await fetch(
                `${PROFILE_API_BASE_URL}/api/auth/change-email/send-otp`,
                {
                    method:
                        "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            new_email:
                                newEmail
                        })
                }
            );

        const data =
            await readProfileApiResponse(
                response
            );

        if (
            response.status ===
            401
        ) {
            throw new Error(
                "Your session has expired. Please login again."
            );
        }

        if (!response.ok) {
            throw new Error(
                getProfileApiErrorMessage(
                    data,
                    "Unable to send email verification OTP."
                )
            );
        }

        pendingProfileEmailChange =
            normalizeProfileEmail(
                data?.new_email
                ||
                newEmail
            );

        showProfileEmailOtpSection();

        const otpInput =
            document.getElementById(
                "editProfileEmailOtp"
            );

        if (otpInput) {
            otpInput.value =
                "";

            setTimeout(
                function () {
                    otpInput.focus();
                },
                50
            );
        }

        const minutes =
            Number(
                data?.otp_expires_in_minutes
                ||
                5
            );

        setProfileEmailOtpHint(
            `OTP sent to ${pendingProfileEmailChange}. It is valid for ${minutes} minute${minutes === 1 ? "" : "s"}.`
        );

        showProfileEditMessage(
            data?.message
            ||
            "Verification OTP sent to your new email address.",
            "success"
        );

    } catch (error) {
        console.error(
            "Email change OTP send failed:",
            error
        );

        showProfileEditMessage(
            error.message
            ||
            "Unable to send email verification OTP.",
            "error"
        );

    } finally {
        setProfileEmailButtonLoading(
            activeButton,
            false
        );
    }
}

async function verifyProfileEmailChangeOtp() {
    const emailInput =
        document.getElementById(
            "editProfileEmail"
        );

    const otpInput =
        document.getElementById(
            "editProfileEmailOtp"
        );

    const verifyButton =
        document.getElementById(
            "verifyEmailChangeOtpButton"
        );

    const newEmail =
        normalizeProfileEmail(
            pendingProfileEmailChange
            ||
            emailInput?.value
        );

    const otp =
        String(
            otpInput?.value
            ||
            ""
        )
        .replace(
            /\D/g,
            ""
        )
        .slice(
            0,
            6
        );

    if (
        !pendingProfileEmailChange
    ) {
        showProfileEditMessage(
            "Please click Send OTP first.",
            "error"
        );

        return;
    }

    if (
        !/^\d{6}$/.test(
            otp
        )
    ) {
        showProfileEditMessage(
            "Please enter the 6-digit OTP.",
            "error"
        );

        otpInput?.focus();

        return;
    }

    const token =
        getToken();

    if (!token) {
        window.location.replace(
            "../auth/login.html"
        );

        return;
    }

    try {
        setProfileEmailButtonLoading(
            verifyButton,
            true,
            "Verifying..."
        );

        clearProfileEditMessage();

        const response =
            await fetch(
                `${PROFILE_API_BASE_URL}/api/auth/change-email/verify-otp`,
                {
                    method:
                        "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            new_email:
                                newEmail,

                            otp:
                                otp
                        })
                }
            );

        const data =
            await readProfileApiResponse(
                response
            );

        if (
            response.status ===
            401
        ) {
            throw new Error(
                "Your session has expired. Please login again."
            );
        }

        if (!response.ok) {
            throw new Error(
                getProfileApiErrorMessage(
                    data,
                    "Unable to verify email OTP."
                )
            );
        }

        if (
            data?.user
            &&
            typeof data.user ===
            "object"
        ) {
            currentProfileUser =
                data.user;

            renderProfileUser(
                data.user
            );
        }

        if (emailInput) {
            emailInput.value =
                newEmail;
        }

        setProfileEmailOtpHint(
            "Email verified successfully."
        );

        showProfileEditMessage(
            data?.message
            ||
            "Email verified and updated successfully. Please login again with your new email.",
            "success"
        );

        pendingProfileEmailChange =
            null;

        if (verifyButton) {
            verifyButton.disabled =
                true;

            const text =
                verifyButton.querySelector(
                    "span"
                );

            if (text) {
                text.textContent =
                    "Verified";
            }
        }

        if (
            data?.requires_relogin !==
            false
        ) {
            setTimeout(
                function () {
                    logoutProfileUser();
                },
                1500
            );
        }

    } catch (error) {
        console.error(
            "Email change OTP verification failed:",
            error
        );

        showProfileEditMessage(
            error.message
            ||
            "Unable to verify email OTP.",
            "error"
        );

    } finally {
        if (
            pendingProfileEmailChange
        ) {
            setProfileEmailButtonLoading(
                verifyButton,
                false
            );
        }
    }
}

function showProfileEmailOtpSection() {
    const section =
        document.getElementById(
            "emailChangeOtpSection"
        );

    if (section) {
        section.hidden =
            false;
    }
}

function resetProfileEmailOtpState(
    clearPending = true
) {
    const section =
        document.getElementById(
            "emailChangeOtpSection"
        );

    const otpInput =
        document.getElementById(
            "editProfileEmailOtp"
        );

    const verifyButton =
        document.getElementById(
            "verifyEmailChangeOtpButton"
        );

    if (clearPending) {
        pendingProfileEmailChange =
            null;
    }

    if (section) {
        section.hidden =
            true;
    }

    if (otpInput) {
        otpInput.value =
            "";
    }

    if (verifyButton) {
        verifyButton.disabled =
            false;

        const text =
            verifyButton.querySelector(
                "span"
            );

        if (text) {
            text.textContent =
                "Verify Email";
        }
    }

    setProfileEmailOtpHint(
        "OTP is valid for 5 minutes."
    );
}

function setProfileEmailOtpHint(
    message
) {
    const hint =
        document.getElementById(
            "emailChangeOtpHint"
        );

    if (hint) {
        hint.textContent =
            message;
    }
}

function normalizeProfileEmail(
    value
) {
    return String(
        value
        ||
        ""
    )
    .trim()
    .toLowerCase();
}

function isValidProfileEmail(
    email
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}

async function readProfileApiResponse(
    response
) {
    try {
        return await response.json();

    } catch (error) {
        return null;
    }
}

function getProfileApiErrorMessage(
    data,
    fallback
) {
    if (
        typeof data?.detail ===
        "string"
    ) {
        return data.detail;
    }

    if (
        Array.isArray(
            data?.detail
        )
    ) {
        return data.detail
            .map(
                function (
                    item
                ) {
                    return (
                        item?.msg
                        ||
                        "Invalid request."
                    );
                }
            )
            .join(
                " "
            );
    }

    if (
        typeof data?.detail?.message ===
        "string"
    ) {
        return data.detail.message;
    }

    if (
        typeof data?.message ===
        "string"
    ) {
        return data.message;
    }

    return fallback;
}

function showProfileEditMessage(
    message,
    type
) {
    const element =
        document.getElementById(
            "profileEditMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.classList.remove(
        "error",
        "success"
    );

    element.classList.add(
        "show",
        type ===
        "success"
            ?
            "success"
            :
            "error"
    );
}

function clearProfileEditMessage() {
    const element =
        document.getElementById(
            "profileEditMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        "";

    element.classList.remove(
        "show",
        "error",
        "success"
    );
}

function setProfileEditLoading(
    button,
    loading
) {
    if (!button) {
        return;
    }

    button.disabled =
        loading;

    const text =
        button.querySelector(
            "span"
        );

    if (text) {
        text.textContent =
            loading
                ?
                "Saving..."
                :
                "Save Changes";
    }
}

function setProfileEmailButtonLoading(
    button,
    loading,
    loadingText = "Please wait..."
) {
    if (!button) {
        return;
    }

    button.disabled =
        loading;

    const text =
        button.querySelector(
            "span"
        );

    if (!text) {
        return;
    }

    if (loading) {
        if (
            !button.dataset.defaultText
        ) {
            button.dataset.defaultText =
                text.textContent.trim();
        }

        text.textContent =
            loadingText;

        return;
    }

    text.textContent =
        button.dataset.defaultText
        ||
        text.textContent;
}

function initializeProfileDropdown() {
    const trigger =
        document.getElementById(
            "candidateProfileTrigger"
        );

    const dropdown =
        document.getElementById(
            "candidateProfileDropdown"
        );

    const chevron =
        document.getElementById(
            "candidateProfileChevron"
        );

    const logoutButton =
        document.getElementById(
            "candidateLogoutButton"
        );

    if (
        trigger
        &&
        dropdown
    ) {
        trigger.addEventListener(
            "click",
            function (
                event
            ) {
                event.preventDefault();

                event.stopPropagation();

                const open =
                    dropdown
                        .classList
                        .toggle(
                            "show"
                        );

                trigger.setAttribute(
                    "aria-expanded",
                    String(
                        open
                    )
                );

                if (chevron) {
                    chevron.classList.toggle(
                        "open",
                        open
                    );
                }
            }
        );

        dropdown.addEventListener(
            "click",
            function (
                event
            ) {
                event.stopPropagation();
            }
        );

        document.addEventListener(
            "click",
            function () {
                closeProfileDropdown();
            }
        );
    }

    document.addEventListener(
        "keydown",
        function (
            event
        ) {
            if (
                event.key ===
                "Escape"
            ) {
                closeProfileDropdown();
            }
        }
    );

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            function () {
                logoutProfileUser();
            }
        );
    }
}

function closeProfileDropdown() {
    const trigger =
        document.getElementById(
            "candidateProfileTrigger"
        );

    const dropdown =
        document.getElementById(
            "candidateProfileDropdown"
        );

    const chevron =
        document.getElementById(
            "candidateProfileChevron"
        );

    if (dropdown) {
        dropdown.classList.remove(
            "show"
        );
    }

    if (chevron) {
        chevron.classList.remove(
            "open"
        );
    }

    if (trigger) {
        trigger.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}

function logoutProfileUser() {
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

    sessionStorage.clear();

    window.location.replace(
        "../auth/login.html"
    );
}

function setProfileText(
    id,
    value
) {
    const element =
        document.getElementById(
            id
        );

    if (element) {
        element.textContent =
            value;
    }
}

function getProfileInitials(
    fullName
) {
    const parts =
        String(
            fullName
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
    )
    .toUpperCase();
}

function capitalizeProfileValue(
    value
) {
    const text =
        String(
            value
            ||
            ""
        )
        .trim();

    if (!text) {
        return "";
    }

    return (
        text.charAt(
            0
        )
        .toUpperCase()
        +
        text.slice(
            1
        )
    );
}

function formatProfileDate(
    value
) {
    if (!value) {
        return "";
    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month:
                "long",

            day:
                "numeric",

            year:
                "numeric"
        }
    );
}