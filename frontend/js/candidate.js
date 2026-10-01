// =========================================================
// ResumeIQ Candidate Dashboard
// Dynamic Candidate Data
// =========================================================

const CANDIDATE_API_BASE_URL =
    "http://127.0.0.1:8000";


// =========================================================
// GET RESUMES
// =========================================================

async function getCandidateResumes() {

    const token =
        getToken();

    if (!token) {

        throw new Error(
            "Authentication token not found."
        );
    }

    const response =
        await fetch(
            `${CANDIDATE_API_BASE_URL}/api/resumes`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Accept":
                        "application/json"
                }
            }
        );

    let data = {};

    try {

        data =
            await response.json();

    } catch (error) {

        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.detail
            ||
            data.message
            ||
            "Unable to load resumes."
        );
    }

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
}


// =========================================================
// GET ANALYSIS
// =========================================================

async function getCandidateResumeAnalysis(
    resumeId
) {

    const token =
        getToken();

    if (
        !token
        ||
        !resumeId
    ) {

        return null;
    }

    const response =
        await fetch(
            `${CANDIDATE_API_BASE_URL}/api/resumes/${encodeURIComponent(resumeId)}/analysis`,
            {
                method: "GET",

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

    try {

        const data =
            await response.json();

        return (
            data.analysis
            ||
            null
        );

    } catch (error) {

        return null;
    }
}


// =========================================================
// GET RESUME DETAILS
// =========================================================

async function getCandidateResumeDetails(
    resumeId
) {

    const token =
        getToken();

    if (
        !token
        ||
        !resumeId
    ) {

        return null;
    }

    const response =
        await fetch(
            `${CANDIDATE_API_BASE_URL}/api/resumes/${encodeURIComponent(resumeId)}`,
            {
                method: "GET",

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

    try {

        const data =
            await response.json();

        return (
            data.resume
            ||
            data
        );

    } catch (error) {

        return null;
    }
}


// =========================================================
// INITIALS
// =========================================================

function getCandidateInitials(
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
        parts.length === 0
    ) {

        return "C";
    }

    if (
        parts.length === 1
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


// =========================================================
// UPDATE USER UI
// =========================================================

function updateCandidateUserUI(
    user
) {

    if (!user) {
        return;
    }

    const fullName =
        user.full_name
        ||
        user.name
        ||
        user.username
        ||
        "Candidate";

    const role =
        String(
            user.role
            ||
            "candidate"
        );

    const initials =
        getCandidateInitials(
            fullName
        );

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
                    role.charAt(
                        0
                    )
                    .toUpperCase()
                    +
                    role.slice(
                        1
                    );
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
                    user.email
                    ||
                    "";
            }
        );
}


// =========================================================
// ACTIVE RESUME
// =========================================================

function getActiveResume(
    resumes
) {

    if (
        !Array.isArray(
            resumes
        )
        ||
        resumes.length === 0
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
                    &&
                    resume.is_deleted
                    !==
                    true
                );
            }
        );

    if (active) {

        return active;
    }

    const validResumes =
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
        );

    if (
        validResumes.length ===
        0
    ) {

        return null;
    }

    validResumes.sort(
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

    return validResumes[0];
}


// =========================================================
// RESUME ID
// =========================================================

function getResumeId(
    resume
) {

    return (
        resume?.id
        ||
        resume?.resume_id
        ||
        resume?._id
        ||
        null
    );
}


// =========================================================
// DATE
// =========================================================

function formatResumeDate(
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
                "short",

            day:
                "numeric",

            year:
                "numeric"
        }
    );
}


// =========================================================
// FILE SIZE
// =========================================================

function formatResumeFileSize(
    bytes
) {

    const size =
        Number(
            bytes
        )
        ||
        0;

    if (
        size <= 0
    ) {

        return "";
    }

    const kb =
        size
        /
        1024;

    if (
        kb < 1024
    ) {

        return (
            kb.toFixed(
                1
            )
            +
            " KB"
        );
    }

    return (
        (
            kb
            /
            1024
        ).toFixed(
            1
        )
        +
        " MB"
    );
}


// =========================================================
// FILE EXTENSION
// =========================================================

function getResumeExtension(
    filename
) {

    const value =
        String(
            filename
            ||
            ""
        );

    const position =
        value.lastIndexOf(
            "."
        );

    if (
        position ===
        -1
    ) {

        return "";
    }

    return value
        .substring(
            position + 1
        )
        .toLowerCase();
}


// =========================================================
// UPDATE RESUME UI
// =========================================================

function updateCandidateResumeUI(
    resumes,
    details = null
) {

    const activeResume =
        getActiveResume(
            resumes
        );

    const activeCount =
        document.getElementById(
            "activeResumeCount"
        );

    const activeName =
        document.getElementById(
            "activeResumeName"
        );

    const recentName =
        document.getElementById(
            "recentResumeName"
        );

    const recentMeta =
        document.getElementById(
            "recentResumeMeta"
        );

    const recentStatus =
        document.getElementById(
            "recentResumeStatus"
        );

    const validCount =
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
            ).length
            :
            0;

    if (activeCount) {

        activeCount.textContent =
            activeResume
                ?
                Math.max(
                    1,
                    validCount
                )
                :
                0;
    }

    if (!activeResume) {

        if (activeName) {

            activeName.textContent =
                "No resume uploaded";
        }

        if (recentName) {

            recentName.textContent =
                "No resume uploaded";
        }

        if (recentMeta) {

            recentMeta.textContent =
                "Upload your first resume";
        }

        if (recentStatus) {

            recentStatus.style.display =
                "none";
        }

        return;
    }

    const filename =
        activeResume.original_filename
        ||
        activeResume.filename
        ||
        details?.original_filename
        ||
        details?.filename
        ||
        "Resume";

    const uploadedAt =
        activeResume.uploaded_at
        ||
        activeResume.created_at
        ||
        details?.uploaded_at;

    const fileSize =
        activeResume.file_size
        ||
        activeResume.size
        ||
        details?.file_size
        ||
        details?.size;

    if (activeName) {

        activeName.textContent =
            filename;
    }

    if (recentName) {

        recentName.textContent =
            filename;
    }

    if (recentMeta) {

        const information =
            [];

        const date =
            formatResumeDate(
                uploadedAt
            );

        const size =
            formatResumeFileSize(
                fileSize
            );

        if (date) {

            information.push(
                `Uploaded on ${date}`
            );
        }

        if (size) {

            information.push(
                size
            );
        }

        recentMeta.textContent =
            information.length
                ?
                information.join(
                    " • "
                )
                :
                "Recently uploaded";
    }

    if (recentStatus) {

        recentStatus.style.display =
            "inline-flex";
    }

    updateRecentFileIcon(
        filename
    );

    const resumeId =
        getResumeId(
            activeResume
        );

    if (resumeId) {

        sessionStorage.setItem(
            "resumeiq_current_resume_id",
            String(
                resumeId
            )
        );
    }
}


// =========================================================
// FILE ICON
// =========================================================

function updateRecentFileIcon(
    filename
) {

    const icon =
        document.getElementById(
            "recentResumeFileIcon"
        );

    if (!icon) {

        return;
    }

    const text =
        icon.querySelector(
            "span"
        );

    const extension =
        getResumeExtension(
            filename
        );

    icon.classList.remove(
        "docx"
    );

    if (
        extension ===
        "docx"
    ) {

        icon.classList.add(
            "docx"
        );

        if (text) {

            text.textContent =
                "DOCX";
        }

        return;
    }

    if (text) {

        text.textContent =
            "PDF";
    }
}


// =========================================================
// RESUME SCORE
// =========================================================

function getCandidateResumeScore(
    analysis
) {

    const score =
        Number(
            analysis?.resume_score
            ??
            analysis?.ats_score?.rule_score
            ??
            analysis?.score
            ??
            0
        );

    return Number.isFinite(
        score
    )
        ?
        score
        :
        0;
}


// =========================================================
// SKILLS
// =========================================================

function getCandidateSkills(
    analysis
) {

    if (
        !Array.isArray(
            analysis?.skills
        )
    ) {

        return [];
    }

    return analysis.skills
        .map(
            function (
                skill
            ) {

                if (
                    typeof skill ===
                    "string"
                ) {

                    return skill.trim();
                }

                if (
                    skill
                    &&
                    typeof skill ===
                    "object"
                ) {

                    return String(
                        skill.name
                        ||
                        skill.skill
                        ||
                        skill.label
                        ||
                        ""
                    ).trim();
                }

                return "";
            }
        )
        .filter(
            Boolean
        );
}


// =========================================================
// SECTION COUNT
// =========================================================

function getSectionCount(
    analysis,
    section
) {

    let value =
        analysis?.[
            section
        ];

    if (
        section ===
        "education"
    ) {

        value =
            analysis?.education
            ??
            analysis?.educations
            ??
            analysis?.education_entries;
    }

    if (
        section ===
        "projects"
    ) {

        value =
            analysis?.projects
            ??
            analysis?.project_details;
    }

    if (
        section ===
        "certifications"
    ) {

        value =
            analysis?.certifications
            ??
            analysis?.certification_details;
    }

    if (
        Array.isArray(
            value
        )
    ) {

        return value.length;
    }

    if (
        value
        &&
        typeof value ===
        "object"
    ) {

        return Object.keys(
            value
        ).length;
    }

    if (
        typeof value ===
        "string"
        &&
        value.trim()
    ) {

        return 1;
    }

    return (
        analysis?.section_presence?.[
            section
        ]
            ?
            1
            :
            0
    );
}


// =========================================================
// SET OVERVIEW
// =========================================================

function setOverviewValue(
    section,
    value
) {

    const element =
        document.querySelector(
            `[data-section-${section}]`
        );

    if (!element) {

        return;
    }

    element.textContent =
        String(
            value
            ||
            0
        );
}


// =========================================================
// UPDATE ANALYSIS UI
// =========================================================

function updateCandidateAnalysisUI(
    analysis
) {

    if (!analysis) {

        return;
    }

    const score =
        getCandidateResumeScore(
            analysis
        );

    const skills =
        getCandidateSkills(
            analysis
        );

    const scoreElement =
        document.getElementById(
            "candidateResumeScore"
        );

    if (scoreElement) {

        scoreElement.innerHTML =
            `
            ${Math.round(score)}
            <small>/100</small>
            `;
    }

    const scoreMessage =
        document.getElementById(
            "resumeScoreMessage"
        );

    if (scoreMessage) {

        if (
            score >=
            85
        ) {

            scoreMessage.textContent =
                "Great progress! Keep going.";

        } else if (
            score >=
            70
        ) {

            scoreMessage.textContent =
                "Good foundation. Keep improving.";

        } else {

            scoreMessage.textContent =
                "Keep improving your resume.";
        }
    }

    const skillCount =
        document.getElementById(
            "candidateSkillCount"
        );

    if (skillCount) {

        skillCount.textContent =
            skills.length;
    }

    setOverviewValue(
        "summary",
        getSectionCount(
            analysis,
            "summary"
        )
    );

    setOverviewValue(
        "skills",
        skills.length
    );

    setOverviewValue(
        "education",
        getSectionCount(
            analysis,
            "education"
        )
    );

    setOverviewValue(
        "projects",
        getSectionCount(
            analysis,
            "projects"
        )
    );

    setOverviewValue(
        "certifications",
        getSectionCount(
            analysis,
            "certifications"
        )
    );

    renderCandidateSkills(
        skills
    );

    const jobMatch =
        analysis.job_match_score
        ??
        analysis.job_match?.score;

    if (
        jobMatch !==
        undefined
        &&
        jobMatch !==
        null
    ) {

        const matchElement =
            document.getElementById(
                "candidateJobMatchScore"
            );

        const message =
            document.getElementById(
                "jobMatchMessage"
            );

        if (matchElement) {

            matchElement.textContent =
                `${Math.round(Number(jobMatch))}%`;
        }

        if (message) {

            message.textContent =
                "Based on your top job matches";
        }
    }
}


// =========================================================
// SKILL CHIPS
// =========================================================

function renderCandidateSkills(
    skills
) {

    const container =
        document.getElementById(
            "candidateTopSkills"
        );

    if (!container) {

        return;
    }

    container.innerHTML =
        "";

    if (
        !skills
        ||
        skills.length ===
        0
    ) {

        container.innerHTML =
            `
            <span class="candidate-skill-empty">
                No skills detected
            </span>
            `;

        return;
    }

    const visible =
        11;

    skills
        .slice(
            0,
            visible
        )
        .forEach(
            function (
                skill
            ) {

                const span =
                    document.createElement(
                        "span"
                    );

                span.textContent =
                    skill;

                container.appendChild(
                    span
                );
            }
        );

    const remaining =
        skills.length
        -
        visible;

    if (
        remaining >
        0
    ) {

        const more =
            document.createElement(
                "span"
            );

        more.className =
            "candidate-skill-more";

        more.textContent =
            `+${remaining} more`;

        container.appendChild(
            more
        );
    }
}


// =========================================================
// HISTORY
// =========================================================

async function buildResumeHistory(
    resumes
) {

    if (
        !Array.isArray(
            resumes
        )
    ) {

        renderResumeActivityChart(
            []
        );

        return;
    }

    const recent =
        resumes
        .filter(
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
        .sort(
            function (
                a,
                b
            ) {

                return (
                    new Date(
                        a.uploaded_at
                        ||
                        a.created_at
                        ||
                        0
                    )
                    -
                    new Date(
                        b.uploaded_at
                        ||
                        b.created_at
                        ||
                        0
                    )
                );
            }
        )
        .slice(
            -7
        );

    const history =
        [];

    for (
        const resume
        of
        recent
    ) {

        const resumeId =
            getResumeId(
                resume
            );

        if (!resumeId) {

            continue;
        }

        const analysis =
            await getCandidateResumeAnalysis(
                resumeId
            );

        if (!analysis) {

            continue;
        }

        history.push(
            {
                date:
                    resume.uploaded_at
                    ||
                    resume.created_at
                    ||
                    analysis.analyzed_at,

                score:
                    getCandidateResumeScore(
                        analysis
                    ),

                skills:
                    getCandidateSkills(
                        analysis
                    ).length
            }
        );
    }

    renderResumeActivityChart(
        history
    );

    updateTrends(
        history
    );
}


// =========================================================
// TRENDS
// =========================================================

function updateTrends(
    history
) {

    if (
        history.length <
        2
    ) {

        return;
    }

    const previous =
        history[
            history.length - 2
        ];

    const current =
        history[
            history.length - 1
        ];

    const scoreTrend =
        document.getElementById(
            "resumeScoreTrend"
        );

    const skillTrend =
        document.getElementById(
            "skillTrend"
        );

    const scoreDifference =
        Math.round(
            current.score
            -
            previous.score
        );

    const skillDifference =
        current.skills
        -
        previous.skills;

    if (
        scoreTrend
        &&
        scoreDifference !==
        0
    ) {

        scoreTrend.hidden =
            false;

        scoreTrend.textContent =
            scoreDifference > 0
                ?
                `▲ +${scoreDifference}%`
                :
                `▼ ${scoreDifference}%`;
    }

    if (
        skillTrend
        &&
        skillDifference !==
        0
    ) {

        skillTrend.hidden =
            false;

        skillTrend.textContent =
            skillDifference > 0
                ?
                `▲ +${skillDifference}`
                :
                `▼ ${skillDifference}`;
    }
}


// =========================================================
// ACTIVITY CHART
// =========================================================

function renderResumeActivityChart(
    history
) {

    const container =
        document.getElementById(
            "candidateResumeActivityChart"
        );

    if (!container) {

        return;
    }

    if (
        !history
        ||
        history.length ===
        0
    ) {

        container.innerHTML =
            `
            <div class="candidate-chart-empty">
                Upload and analyze resumes to see your score history.
            </div>
            `;

        return;
    }

    const width =
        700;

    const height =
        160;

    const left =
        42;

    const right =
        18;

    const top =
        12;

    const bottom =
        28;

    const graphWidth =
        width
        -
        left
        -
        right;

    const graphHeight =
        height
        -
        top
        -
        bottom;


    function x(
        index
    ) {

        if (
            history.length ===
            1
        ) {

            return (
                left
                +
                graphWidth
                /
                2
            );
        }

        return (
            left
            +
            (
                index
                /
                (
                    history.length
                    -
                    1
                )
            )
            *
            graphWidth
        );
    }


    function y(
        score
    ) {

        const safe =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        score
                    )
                )
            );

        return (
            top
            +
            (
                (
                    100
                    -
                    safe
                )
                /
                100
            )
            *
            graphHeight
        );
    }


    const points =
        history
        .map(
            function (
                item,
                index
            ) {

                return (
                    `${x(index)},${y(item.score)}`
                );
            }
        )
        .join(
            " "
        );


    let grid =
        "";


    [
        100,
        80,
        60,
        40,
        20,
        0
    ]
    .forEach(
        function (
            value
        ) {

            const lineY =
                y(
                    value
                );

            grid +=
                `
                <text
                    x="5"
                    y="${lineY + 3}"
                    class="candidate-chart-axis-label"
                >
                    ${value}
                </text>

                <line
                    x1="${left}"
                    y1="${lineY}"
                    x2="${width - right}"
                    y2="${lineY}"
                    class="candidate-chart-grid-line"
                />
                `;
        }
    );


    let circles =
        "";

    let labels =
        "";


    history.forEach(
        function (
            item,
            index
        ) {

            circles +=
                `
                <circle
                    cx="${x(index)}"
                    cy="${y(item.score)}"
                    r="4"
                    class="candidate-chart-point"
                />
                `;


            const date =
                new Date(
                    item.date
                );


            const label =
                Number.isNaN(
                    date.getTime()
                )
                    ?
                    ""
                    :
                    date.toLocaleDateString(
                        "en-US",
                        {
                            month:
                                "short",

                            day:
                                "numeric"
                        }
                    );


            labels +=
                `
                <text
                    x="${x(index)}"
                    y="${height - 6}"
                    text-anchor="middle"
                    class="candidate-chart-axis-label"
                >
                    ${label}
                </text>
                `;
        }
    );


    const area =
        `
        ${x(0)},${top + graphHeight}
        ${points}
        ${x(history.length - 1)},${top + graphHeight}
        `;


    container.innerHTML =
        `
        <svg
            viewBox="0 0 ${width} ${height}"
            class="candidate-chart-svg"
            preserveAspectRatio="none"
        >

            ${grid}

            <polygon
                points="${area}"
                class="candidate-chart-area"
            ></polygon>

            <polyline
                points="${points}"
                class="candidate-chart-line"
            ></polyline>

            ${circles}

            ${labels}

        </svg>
        `;
}


// =========================================================
// PROFILE DROPDOWN
// =========================================================

function initializeCandidateProfileMenu() {

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

    const logout =
        document.getElementById(
            "candidateLogoutButton"
        );


    if (
        !trigger
        ||
        !dropdown
    ) {

        return;
    }


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

            closeCandidateProfileMenu();
        }
    );


    document.addEventListener(
        "keydown",
        function (
            event
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                closeCandidateProfileMenu();
            }
        }
    );


    logout?.addEventListener(
        "click",
        performCandidateLogout
    );
}


// =========================================================
// CLOSE PROFILE DROPDOWN
// =========================================================

function closeCandidateProfileMenu() {

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


    dropdown?.classList.remove(
        "show"
    );


    chevron?.classList.remove(
        "open"
    );


    trigger?.setAttribute(
        "aria-expanded",
        "false"
    );
}


// =========================================================
// LOGOUT
// =========================================================

function performCandidateLogout() {

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


// =========================================================
// LOAD CANDIDATE PAGE DATA
// =========================================================

async function loadCandidatePageData() {

    try {

        const token =
            getToken();


        if (!token) {

            window.location.replace(
                "../auth/login.html"
            );

            return;
        }


        // =================================================
        // USER
        // =================================================

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


        if (
            typeof saveUser ===
            "function"
        ) {

            saveUser(
                user
            );
        }


        updateCandidateUserUI(
            user
        );


        // =================================================
        // RESUMES
        // =================================================

        const resumes =
            await getCandidateResumes();


        const activeResume =
            getActiveResume(
                resumes
            );


        let details =
            null;


        if (activeResume) {

            const resumeId =
                getResumeId(
                    activeResume
                );


            if (resumeId) {

                details =
                    await getCandidateResumeDetails(
                        resumeId
                    );
            }
        }


        updateCandidateResumeUI(
            resumes,
            details
        );


        // =================================================
        // ACTIVE ANALYSIS
        // =================================================

        if (activeResume) {

            const resumeId =
                getResumeId(
                    activeResume
                );


            if (resumeId) {

                const analysis =
                    await getCandidateResumeAnalysis(
                        resumeId
                    );


                if (analysis) {

                    updateCandidateAnalysisUI(
                        analysis
                    );


                    sessionStorage.setItem(
                        "resumeiq_current_analysis",
                        JSON.stringify(
                            analysis
                        )
                    );
                }
            }
        }


        // =================================================
        // ACTIVITY
        // =================================================

        await buildResumeHistory(
            resumes
        );


    } catch (error) {

        console.error(
            "Candidate dashboard error:",
            error
        );
    }
}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeCandidateProfileMenu();

        loadCandidatePageData();
    }
);


// =========================================================
// GLOBAL EXPORTS
// =========================================================

window.getCandidateResumes =
    getCandidateResumes;


window.getCandidateResumeAnalysis =
    getCandidateResumeAnalysis;


window.getActiveResume =
    getActiveResume;


window.updateCandidateUserUI =
    updateCandidateUserUI;


window.updateCandidateResumeUI =
    updateCandidateResumeUI;


window.loadCandidatePageData =
    loadCandidatePageData;


window.performCandidateLogout =
    performCandidateLogout;