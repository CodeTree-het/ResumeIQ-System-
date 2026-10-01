(function () {
    "use strict";


    // =========================================================
    // CONFIG
    // =========================================================

    const API_BASE_URL = "http://127.0.0.1:8000";

    const CHATBOT_NAME = "ResumeIQ Assistant";

    const CHATBOT_HISTORY_KEY =
        "resumeiq_chat_history";

    const MAX_HISTORY_MESSAGES = 40;


    // =========================================================
    // STATE
    // =========================================================

    let chatbotRoot = null;
    let chatbotButton = null;
    let chatbotWindow = null;
    let chatbotClose = null;
    let chatbotBody = null;
    let chatbotInput = null;
    let chatbotSend = null;

    let isSending = false;


    // =========================================================
    // DOM READY
    // =========================================================

    document.addEventListener(
        "DOMContentLoaded",
        initializeResumeIQChatbot
    );


    // =========================================================
    // INITIALIZE
    // =========================================================

    async function initializeResumeIQChatbot() {

        try {

            await loadChatbotComponent();

            cacheElements();

            if (
                !chatbotRoot ||
                !chatbotButton ||
                !chatbotWindow ||
                !chatbotBody ||
                !chatbotInput ||
                !chatbotSend
            ) {

                console.error(
                    "ResumeIQ chatbot elements not found."
                );

                return;
            }


            bindEvents();

            renderHistory();

        } catch (error) {

            console.error(
                "ResumeIQ chatbot initialization failed:",
                error
            );
        }
    }


    // =========================================================
    // COMPONENT URL
    // =========================================================

    function getChatbotComponentUrl() {

        let chatbotScript = null;


        const scripts =
            document.querySelectorAll(
                "script[src]"
            );


        for (
            const script
            of
            scripts
        ) {

            const src =
                script.getAttribute(
                    "src"
                );

            if (
                src &&
                src.includes(
                    "chatbot.js"
                )
            ) {

                chatbotScript =
                    script;

                break;
            }
        }


        if (
            chatbotScript &&
            chatbotScript.src
        ) {

            return new URL(
                "../components/chatbot.html",
                chatbotScript.src
            ).href;
        }


        return "../components/chatbot.html";
    }


    // =========================================================
    // LOAD COMPONENT
    // =========================================================

    async function loadChatbotComponent() {

        if (
            document.getElementById(
                "resumeiqChatbotComponent"
            )
        ) {

            return;
        }


        let loader =
            document.getElementById(
                "resumeiqChatbotLoader"
            );


        if (!loader) {

            loader =
                document.createElement(
                    "div"
                );

            loader.id =
                "resumeiqChatbotLoader";

            document.body.appendChild(
                loader
            );
        }


        const componentUrl =
            getChatbotComponentUrl();


        const response =
            await fetch(
                componentUrl,
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Unable to load chatbot component: ${response.status}`
            );
        }


        loader.innerHTML =
            await response.text();
    }


    // =========================================================
    // CACHE ELEMENTS
    // =========================================================

    function cacheElements() {

        chatbotRoot =
            document.getElementById(
                "resumeiqChatbotComponent"
            );

        chatbotButton =
            document.getElementById(
                "resumeiqChatbotButton"
            );

        chatbotWindow =
            document.getElementById(
                "resumeiqChatbotWindow"
            );

        chatbotClose =
            document.getElementById(
                "resumeiqChatbotClose"
            );

        chatbotBody =
            document.getElementById(
                "resumeiqChatbotBody"
            );

        chatbotInput =
            document.getElementById(
                "resumeiqChatbotInput"
            );

        chatbotSend =
            document.getElementById(
                "resumeiqChatbotSend"
            );
    }


    // =========================================================
    // EVENTS
    // =========================================================

    function bindEvents() {

        chatbotButton.addEventListener(
            "click",
            toggleChatbot
        );


        if (chatbotClose) {

            chatbotClose.addEventListener(
                "click",
                closeChatbot
            );
        }


        chatbotSend.addEventListener(
            "click",
            sendCurrentMessage
        );


        chatbotInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                    &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendCurrentMessage();
                }
            }
        );


        chatbotInput.addEventListener(
            "input",
            autoResizeInput
        );


        chatbotBody.addEventListener(
            "click",
            function (event) {

                const quickButton =
                    event.target.closest(
                        ".resumeiq-chatbot-quick-button"
                    );


                if (!quickButton) {

                    return;
                }


                const text =
                    (
                        quickButton.dataset.message
                        ||
                        quickButton.textContent
                        ||
                        ""
                    ).trim();


                if (!text) {

                    return;
                }


                chatbotInput.value =
                    text;

                sendCurrentMessage();
            }
        );
    }


    // =========================================================
    // OPEN / CLOSE
    // =========================================================

    function toggleChatbot() {

        if (
            chatbotWindow.classList.contains(
                "active"
            )
        ) {

            closeChatbot();

        } else {

            openChatbot();
        }
    }


    function openChatbot() {

        chatbotWindow.classList.add(
            "active"
        );


        chatbotWindow.setAttribute(
            "aria-hidden",
            "false"
        );


        setTimeout(
            function () {

                chatbotInput.focus();

            },
            150
        );
    }


    function closeChatbot() {

        chatbotWindow.classList.remove(
            "active"
        );


        chatbotWindow.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    // =========================================================
    // SEND MESSAGE
    // =========================================================

    async function sendCurrentMessage() {

        if (isSending) {

            return;
        }


        const message =
            chatbotInput.value.trim();


        if (!message) {

            return;
        }


        addMessage(
            "user",
            message
        );


        saveHistoryMessage(
            "user",
            message
        );


        chatbotInput.value =
            "";

        autoResizeInput();


        setSendingState(
            true
        );


        showTypingIndicator();


        try {

            const response =
                await sendMessageToBackend(
                    message
                );


            removeTypingIndicator();


            const botMessage =
                response?.message
                ||
                "I could not understand the response from ResumeIQ."


            addMessage(
                "bot",
                botMessage
            );


            saveHistoryMessage(
                "bot",
                botMessage
            );


        } catch (error) {

            removeTypingIndicator();


            console.error(
                "ResumeIQ chatbot error:",
                error
            );


            const errorMessage =
                getReadableError(
                    error
                );


            addMessage(
                "bot",
                errorMessage
            );


            saveHistoryMessage(
                "bot",
                errorMessage
            );

        } finally {

            setSendingState(
                false
            );


            chatbotInput.focus();
        }
    }


    // =========================================================
    // BACKEND API
    // =========================================================

    async function sendMessageToBackend(
        message
    ) {

        const token =
            getResumeIQToken();


        if (!token) {

            throw new Error(
                "LOGIN_REQUIRED"
            );
        }


        const body = {

            message:
                message,

            context: {

                page:
                    getCurrentPage(),

                issue_type:
                    detectIssueType(
                        message
                    )
            }
        };


        const response =
            await fetch(
                `${API_BASE_URL}/api/chatbot/message`,
                {
                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(
                            body
                        )
                }
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch (error) {

            data = null;
        }


        if (!response.ok) {

            const detail =
                data?.detail
                ||
                data?.message
                ||
                `HTTP ${response.status}`;


            throw new Error(
                detail
            );
        }


        return data;
    }


    // =========================================================
    // TOKEN
    // =========================================================

    function getResumeIQToken() {

        try {

            if (
                typeof getToken ===
                "function"
            ) {

                const authToken =
                    getToken();

                if (authToken) {

                    return authToken;
                }
            }

        } catch (error) {

            console.warn(
                "getToken() unavailable:",
                error
            );
        }


        const possibleKeys = [

            "token",

            "access_token",

            "accessToken",

            "resumeiq_token",

            "resumeiq_access_token",

            "auth_token"
        ];


        for (
            const key
            of
            possibleKeys
        ) {

            const localValue =
                localStorage.getItem(
                    key
                );


            if (localValue) {

                return cleanToken(
                    localValue
                );
            }


            const sessionValue =
                sessionStorage.getItem(
                    key
                );


            if (sessionValue) {

                return cleanToken(
                    sessionValue
                );
            }
        }


        return null;
    }


    function cleanToken(
        value
    ) {

        if (!value) {

            return null;
        }


        let token =
            String(
                value
            ).trim();


        if (
            token.startsWith(
                "\""
            )
            &&
            token.endsWith(
                "\""
            )
        ) {

            token =
                token.slice(
                    1,
                    -1
                );
        }


        if (
            token.toLowerCase().startsWith(
                "bearer "
            )
        ) {

            token =
                token.slice(
                    7
                ).trim();
        }


        return token;
    }


    // =========================================================
    // CURRENT PAGE
    // =========================================================

    function getCurrentPage() {

        const path =
            window.location.pathname
                .toLowerCase();


        if (
            path.includes(
                "settings"
            )
        ) {

            return "settings";
        }


        if (
            path.includes(
                "analysis"
            )
        ) {

            return "analysis";
        }


        if (
            path.includes(
                "resume"
            )
            &&
            !path.includes(
                "resumes"
            )
        ) {

            return "resume_upload";
        }


        if (
            path.includes(
                "resumes"
            )
        ) {

            return "my_resumes";
        }


        if (
            path.includes(
                "jobs"
            )
        ) {

            return "job_matching";
        }


        if (
            path.includes(
                "recommendations"
            )
        ) {

            return "recommendations";
        }


        if (
            path.includes(
                "dashboard"
            )
        ) {

            return "dashboard";
        }


        if (
            path.includes(
                "recruiter"
            )
        ) {

            return "recruiter";
        }


        if (
            path.includes(
                "admin"
            )
        ) {

            return "admin";
        }


        if (
            path.includes(
                "login"
            )
        ) {

            return "login";
        }


        return "unknown";
    }


    // =========================================================
    // ISSUE DETECTION
    // =========================================================

    function detectIssueType(
        message
    ) {

        const text =
            String(
                message
            )
                .toLowerCase()
                .trim();


        if (
            includesAny(
                text,
                [
                    "otp",
                    "email",
                    "mail",
                    "change email",
                    "new email"
                ]
            )
        ) {

            return "email_change";
        }


        if (
            includesAny(
                text,
                [
                    "password",
                    "forgot password",
                    "reset password"
                ]
            )
        ) {

            return "password";
        }


        if (
            includesAny(
                text,
                [
                    "upload",
                    "pdf",
                    "docx",
                    "resume upload"
                ]
            )
        ) {

            return "resume_upload";
        }


        if (
            includesAny(
                text,
                [
                    "analysis",
                    "ats",
                    "resume score"
                ]
            )
        ) {

            return "analysis";
        }


        if (
            includesAny(
                text,
                [
                    "job match",
                    "job matching"
                ]
            )
        ) {

            return "job_matching";
        }


        if (
            includesAny(
                text,
                [
                    "skill gap",
                    "missing skill"
                ]
            )
        ) {

            return "skill_gap";
        }


        if (
            includesAny(
                text,
                [
                    "setting",
                    "settings",
                    "privacy",
                    "notification",
                    "preference"
                ]
            )
        ) {

            return "settings";
        }


        if (
            includesAny(
                text,
                [
                    "recruiter",
                    "shortlist",
                    "job post"
                ]
            )
        ) {

            return "recruiter";
        }


        return null;
    }


    function includesAny(
        text,
        values
    ) {

        return values.some(
            function (value) {

                return text.includes(
                    value
                );
            }
        );
    }


    // =========================================================
    // ADD MESSAGE
    // =========================================================

    function addMessage(
        role,
        message
    ) {

        if (
            !chatbotBody
        ) {

            return;
        }


        removeQuickActions();


        const row =
            document.createElement(
                "div"
            );


        row.className =
            `resumeiq-chat-message ${role}`;


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "resumeiq-chat-bubble";


        bubble.textContent =
            message;


        row.appendChild(
            bubble
        );


        chatbotBody.appendChild(
            row
        );


        scrollToBottom();
    }


    // =========================================================
    // INITIAL / HISTORY
    // =========================================================

    function renderHistory() {

        chatbotBody.innerHTML =
            "";


        const history =
            getHistory();


        if (
            history.length ===
            0
        ) {

            renderWelcomeMessage();

            return;
        }


        history.forEach(
            function (item) {

                addMessage(
                    item.role,
                    item.message
                );
            }
        );


        scrollToBottom();
    }


    function renderWelcomeMessage() {

        const welcome =
            document.createElement(
                "div"
            );


        welcome.className =
            "resumeiq-chat-message bot";


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "resumeiq-chat-bubble";


        bubble.textContent =
            "Hi 👋 I’m ResumeIQ Assistant. Tell me the exact problem you are facing. I can check account, email OTP, settings, resume upload, analysis and other ResumeIQ issues.";


        welcome.appendChild(
            bubble
        );


        chatbotBody.appendChild(
            welcome
        );


        renderQuickActions();


        scrollToBottom();
    }


    function renderQuickActions() {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "resumeiq-chatbot-quick-actions";


        const actions = [

            {
                label:
                    "OTP not received",

                message:
                    "I changed my email but OTP is not received."
            },

            {
                label:
                    "Resume upload problem",

                message:
                    "I have a problem uploading my resume."
            },

            {
                label:
                    "Analysis problem",

                message:
                    "My resume analysis is not showing."
            },

            {
                label:
                    "Settings problem",

                message:
                    "My settings are not saving."
            }
        ];


        actions.forEach(
            function (action) {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "resumeiq-chatbot-quick-button";


                button.textContent =
                    action.label;


                button.dataset.message =
                    action.message;


                wrapper.appendChild(
                    button
                );
            }
        );


        chatbotBody.appendChild(
            wrapper
        );
    }


    function removeQuickActions() {

        const quickActions =
            chatbotBody.querySelector(
                ".resumeiq-chatbot-quick-actions"
            );


        if (quickActions) {

            quickActions.remove();
        }
    }


    // =========================================================
    // HISTORY STORAGE
    // =========================================================

    function getHistory() {

        try {

            const raw =
                sessionStorage.getItem(
                    CHATBOT_HISTORY_KEY
                );


            if (!raw) {

                return [];
            }


            const parsed =
                JSON.parse(
                    raw
                );


            if (
                !Array.isArray(
                    parsed
                )
            ) {

                return [];
            }


            return parsed;

        } catch (error) {

            return [];
        }
    }


    function saveHistoryMessage(
        role,
        message
    ) {

        const history =
            getHistory();


        history.push(
            {
                role:
                    role,

                message:
                    message,

                timestamp:
                    new Date()
                        .toISOString()
            }
        );


        const trimmed =
            history.slice(
                -MAX_HISTORY_MESSAGES
            );


        sessionStorage.setItem(
            CHATBOT_HISTORY_KEY,
            JSON.stringify(
                trimmed
            )
        );
    }


    function clearChatHistory() {

        sessionStorage.removeItem(
            CHATBOT_HISTORY_KEY
        );


        if (chatbotBody) {

            renderHistory();
        }
    }


    // =========================================================
    // TYPING INDICATOR
    // =========================================================

    function showTypingIndicator() {

        removeTypingIndicator();


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "resumeiq-chat-message bot";


        row.id =
            "resumeiqChatbotTyping";


        const bubble =
            document.createElement(
                "div"
            );


        bubble.className =
            "resumeiq-chat-bubble resumeiq-chatbot-typing";


        bubble.innerHTML =
            "<span></span><span></span><span></span>";


        row.appendChild(
            bubble
        );


        chatbotBody.appendChild(
            row
        );


        scrollToBottom();
    }


    function removeTypingIndicator() {

        const typing =
            document.getElementById(
                "resumeiqChatbotTyping"
            );


        if (typing) {

            typing.remove();
        }
    }


    // =========================================================
    // ERROR MESSAGE
    // =========================================================

    function getReadableError(
        error
    ) {

        const message =
            String(
                error?.message
                ||
                ""
            );


        if (
            message ===
            "LOGIN_REQUIRED"
        ) {

            return (
                "I cannot securely check your ResumeIQ account because no login session was found. Please login again and reopen the assistant."
            );
        }


        if (
            message.includes(
                "401"
            )
            ||
            message.toLowerCase().includes(
                "unauthorized"
            )
            ||
            message.toLowerCase().includes(
                "credentials"
            )
        ) {

            return (
                "Your ResumeIQ login session may have expired. Please login again and retry."
            );
        }


        if (
            message.includes(
                "Failed to fetch"
            )
        ) {

            return (
                "I cannot connect to the ResumeIQ backend. Make sure FastAPI is running on http://127.0.0.1:8000."
            );
        }


        return (
            "I could not complete that check. Backend error: "
            +
            (
                message
                ||
                "Unknown error"
            )
        );
    }


    // =========================================================
    // SEND STATE
    // =========================================================

    function setSendingState(
        sending
    ) {

        isSending =
            sending;


        chatbotSend.disabled =
            sending;


        chatbotInput.disabled =
            sending;


        if (sending) {

            chatbotSend.classList.add(
                "loading"
            );

        } else {

            chatbotSend.classList.remove(
                "loading"
            );
        }
    }


    // =========================================================
    // TEXTAREA RESIZE
    // =========================================================

    function autoResizeInput() {

        if (!chatbotInput) {

            return;
        }


        chatbotInput.style.height =
            "auto";


        chatbotInput.style.height =
            `${Math.min(
                chatbotInput.scrollHeight,
                120
            )}px`;
    }


    // =========================================================
    // SCROLL
    // =========================================================

    function scrollToBottom() {

        if (!chatbotBody) {

            return;
        }


        requestAnimationFrame(
            function () {

                chatbotBody.scrollTop =
                    chatbotBody.scrollHeight;
            }
        );
    }


    // =========================================================
    // GLOBAL FUNCTIONS
    // =========================================================

    window.openResumeIQChatbot =
        openChatbot;


    window.closeResumeIQChatbot =
        closeChatbot;


    window.clearResumeIQChatHistory =
        clearChatHistory;

})();