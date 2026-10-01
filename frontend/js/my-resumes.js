// =========================================================
// ResumeIQ - My Resumes Page
// Resume History + Search + Filter + Analysis + Delete
// =========================================================


const MY_RESUMES_API_BASE_URL =
    "http://127.0.0.1:8000";


// =========================================================
// PAGE STATE
// =========================================================

const myResumesState = {

    resumes: [],

    filteredResumes: [],

    deleteTarget: null,

    reactivateTarget: null,

    loading: false
};


// =========================================================
// PAGE START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeMyResumesPage();

    }
);


// =========================================================
// INITIALIZE
// =========================================================

function initializeMyResumesPage() {

    initializeResumeFilters();

    initializeRefreshButton();

    initializeResumeListActions();

    initializeDeleteModal();

    initializeReactivateModal();

    loadMyResumes();
}


// =========================================================
// LOAD MY RESUMES
// =========================================================

async function loadMyResumes() {

    if (myResumesState.loading) {

        return;
    }


    const token =
        getResumeAuthToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    myResumesState.loading =
        true;


    showLoadingState();


    try {

        // =================================================
        // 1. LOAD RESUME HISTORY
        // =================================================

        const response =
            await fetch(
                `${MY_RESUMES_API_BASE_URL}/api/resumes`,
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


        const data =
            await readApiResponse(
                response
            );


        // =================================================
        // AUTH ERROR
        // =================================================

        if (
            response.status ===
            401
            ||
            response.status ===
            403
        ) {

            handleUnauthorized();

            return;
        }


        // =================================================
        // API ERROR
        // =================================================

        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(
                    data,
                    "Unable to load your resumes."
                )
            );
        }


        const resumes =
            Array.isArray(
                data?.resumes
            )
                ?
                data.resumes
                :
                [];


        // =================================================
        // 2. LOAD SAVED ANALYSIS FOR EACH RESUME
        // =================================================

        const resumesWithAnalysis =
            await Promise.all(

                resumes.map(
                    async function (
                        resume
                    ) {

                        const resumeId =
                            getResumeId(
                                resume
                            );


                        let analysis =
                            null;


                        if (resumeId) {

                            try {

                                analysis =
                                    await fetchResumeAnalysis(
                                        resumeId,
                                        token
                                    );

                            } catch (error) {

                                console.warn(
                                    `Unable to load analysis for resume ${resumeId}:`,
                                    error
                                );
                            }
                        }


                        return normalizeResume(
                            resume,
                            analysis
                        );
                    }
                )
            );


        // =================================================
        // STORE
        // =================================================

        myResumesState.resumes =
            resumesWithAnalysis;


        // =================================================
        // STATISTICS
        // =================================================

        updateResumeStatistics();


        // =================================================
        // FILTER + RENDER
        // =================================================

        applyResumeFilters();


    } catch (error) {

        console.error(
            "My Resumes loading failed:",
            error
        );


        showErrorState(
            error.message
            ||
            "Unable to load your resumes."
        );

    } finally {

        myResumesState.loading =
            false;

        stopRefreshAnimation();
    }
}


// =========================================================
// FETCH SAVED ANALYSIS
// GET /api/resumes/{resume_id}/analysis
// =========================================================

async function fetchResumeAnalysis(
    resumeId,
    token
) {

    const response =
        await fetch(
            `${MY_RESUMES_API_BASE_URL}/api/resumes/${encodeURIComponent(resumeId)}/analysis`,
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


    // No saved analysis yet
    if (
        response.status ===
        404
    ) {

        return null;
    }


    if (
        response.status ===
        401
        ||
        response.status ===
        403
    ) {

        handleUnauthorized();

        return null;
    }


    const data =
        await readApiResponse(
            response
        );


    if (!response.ok) {

        return null;
    }


    if (
        data?.analysis
        &&
        typeof data.analysis ===
        "object"
    ) {

        return data.analysis;
    }


    return null;
}


// =========================================================
// NORMALIZE RESUME
// =========================================================

function normalizeResume(
    resume,
    analysis
) {

    const normalized =
        {
            ...resume
        };


    normalized._resume_id =
        getResumeId(
            resume
        );


    normalized._analysis =
        analysis;


    normalized._status =
        getResumeStatus(
            resume
        );


    normalized._filename =
        getResumeFilename(
            resume
        );


    normalized._file_type =
        getResumeFileType(
            resume
        );


    normalized._uploaded_at =
        getResumeUploadedAt(
            resume
        );


    normalized._resume_score =
        getResumeScore(
            analysis
        );


    normalized._ats_readiness =
        getATSReadiness(
            analysis
        );


    normalized._analyzed =
        Boolean(
            analysis
        );


    return normalized;
}


// =========================================================
// GET RESUME ID
// =========================================================

function getResumeId(
    resume
) {

    if (!resume) {

        return null;
    }


    return (
        resume.resume_id
        ||
        resume.id
        ||
        resume._id
        ||
        null
    );
}


// =========================================================
// GET RESUME NAME
// =========================================================

function getResumeFilename(
    resume
) {

    return (
        resume?.original_filename
        ||
        resume?.filename
        ||
        resume?.file_name
        ||
        "Resume"
    );
}


// =========================================================
// GET FILE TYPE
// =========================================================

function getResumeFileType(
    resume
) {

    let fileType =
        String(
            resume?.file_type
            ||
            ""
        )
        .trim()
        .toLowerCase();


    if (fileType) {

        fileType =
            fileType.replace(
                ".",
                ""
            );


        if (
            fileType.includes(
                "pdf"
            )
        ) {

            return "pdf";
        }


        if (
            fileType.includes(
                "docx"
            )
            ||
            fileType.includes(
                "word"
            )
        ) {

            return "docx";
        }
    }


    const filename =
        getResumeFilename(
            resume
        )
        .toLowerCase();


    if (
        filename.endsWith(
            ".pdf"
        )
    ) {

        return "pdf";
    }


    if (
        filename.endsWith(
            ".docx"
        )
    ) {

        return "docx";
    }


    return "file";
}


// =========================================================
// GET UPLOAD DATE
// =========================================================

function getResumeUploadedAt(
    resume
) {

    return (
        resume?.uploaded_at
        ||
        resume?.created_at
        ||
        resume?.upload_date
        ||
        null
    );
}


// =========================================================
// RESUME STATUS
// =========================================================

function getResumeStatus(
    resume
) {

    if (!resume) {

        return "active";
    }


    // Explicit soft-delete flag
    if (
        resume.is_active ===
        false
    ) {

        return "deleted";
    }


    if (
        resume.is_deleted ===
        true
    ) {

        return "deleted";
    }


    if (
        resume.deleted_at
    ) {

        return "deleted";
    }


    const status =
        String(
            resume.status
            ||
            ""
        )
        .trim()
        .toLowerCase();


    if (
        status ===
        "deleted"
        ||
        status ===
        "inactive"
        ||
        status ===
        "removed"
    ) {

        return "deleted";
    }


    return "active";
}


// =========================================================
// RESUME SCORE
// Pure Resume / Rule Score
// =========================================================

function getResumeScore(
    analysis
) {

    if (!analysis) {

        return null;
    }


    const possibleScores = [

        analysis.resume_score,

        analysis.ats_score?.rule_score,

        analysis.ats_score?.resume_score,

        analysis.rule_score,

        analysis.score
    ];


    for (
        const value
        of possibleScores
    ) {

        const number =
            Number(
                value
            );


        if (
            Number.isFinite(
                number
            )
        ) {

            return number;
        }
    }


    return null;
}


// =========================================================
// ATS READINESS
// Hybrid Score
// =========================================================

function getATSReadiness(
    analysis
) {

    if (!analysis) {

        return null;
    }


    const possibleScores = [

        analysis.ats_readiness,

        analysis.ats_score?.ats_readiness,

        analysis.ats_score?.hybrid_score,

        analysis.hybrid_ats_score,

        analysis.ats_score?.total_score
    ];


    for (
        const value
        of possibleScores
    ) {

        const number =
            Number(
                value
            );


        if (
            Number.isFinite(
                number
            )
        ) {

            return number;
        }
    }


    return null;
}


// =========================================================
// UPDATE STATISTICS
// =========================================================

function updateResumeStatistics() {

    const resumes =
        myResumesState.resumes;


    const total =
        resumes.length;


    const active =
        resumes.filter(
            function (
                resume
            ) {

                return (
                    resume._status ===
                    "active"
                );
            }
        )
        .length;


    const analyzed =
        resumes.filter(
            function (
                resume
            ) {

                return (
                    resume._analyzed
                    ===
                    true
                );
            }
        );


    const validScores =
        analyzed
            .map(
                function (
                    resume
                ) {

                    return (
                        resume._resume_score
                    );
                }
            )
            .filter(
                function (
                    score
                ) {

                    return (
                        Number.isFinite(
                            Number(
                                score
                            )
                        )
                    );
                }
            );


    let average =
        null;


    if (
        validScores.length >
        0
    ) {

        const totalScore =
            validScores.reduce(
                function (
                    sum,
                    score
                ) {

                    return (
                        sum
                        +
                        Number(
                            score
                        )
                    );
                },
                0
            );


        average =
            totalScore
            /
            validScores.length;
    }


    setText(
        "totalResumesCount",
        String(
            total
        )
    );


    setText(
        "activeResumesCount",
        String(
            active
        )
    );


    setText(
        "analyzedResumesCount",
        String(
            analyzed.length
        )
    );


    setText(
        "averageResumeScore",
        average ===
        null
            ?
            "--"
            :
            `${Math.round(average)}/100`
    );


    const description =
        document.getElementById(
            "resumeHistoryDescription"
        );


    if (description) {

        description.textContent =
            total ===
            0
                ?
                "No resumes uploaded yet."
                :
                `${total} resume${total === 1 ? "" : "s"} in your ResumeIQ account.`;
    }
}


// =========================================================
// INITIALIZE FILTERS
// =========================================================

function initializeResumeFilters() {

    const searchInput =
        document.getElementById(
            "resumeSearchInput"
        );


    const statusFilter =
        document.getElementById(
            "resumeStatusFilter"
        );


    const sortSelect =
        document.getElementById(
            "resumeSortSelect"
        );


    const clearButton =
        document.getElementById(
            "clearResumeFiltersButton"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                applyResumeFilters();
            }
        );
    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            function () {

                applyResumeFilters();
            }
        );
    }


    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            function () {

                applyResumeFilters();
            }
        );
    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                if (searchInput) {

                    searchInput.value =
                        "";
                }


                if (statusFilter) {

                    statusFilter.value =
                        "all";
                }


                if (sortSelect) {

                    sortSelect.value =
                        "newest";
                }


                applyResumeFilters();
            }
        );
    }
}


// =========================================================
// APPLY FILTERS
// =========================================================

function applyResumeFilters() {

    const searchValue =
        String(
            document
                .getElementById(
                    "resumeSearchInput"
                )
                ?.value
            ||
            ""
        )
        .trim()
        .toLowerCase();


    const statusValue =
        String(
            document
                .getElementById(
                    "resumeStatusFilter"
                )
                ?.value
            ||
            "all"
        );


    const sortValue =
        String(
            document
                .getElementById(
                    "resumeSortSelect"
                )
                ?.value
            ||
            "newest"
        );


    let filtered =
        [
            ...myResumesState.resumes
        ];


    // =====================================================
    // SEARCH
    // =====================================================

    if (searchValue) {

        filtered =
            filtered.filter(
                function (
                    resume
                ) {

                    const filename =
                        String(
                            resume._filename
                            ||
                            ""
                        )
                        .toLowerCase();


                    const type =
                        String(
                            resume._file_type
                            ||
                            ""
                        )
                        .toLowerCase();


                    return (
                        filename.includes(
                            searchValue
                        )
                        ||
                        type.includes(
                            searchValue
                        )
                    );
                }
            );
    }


    // =====================================================
    // STATUS
    // =====================================================

    if (
        statusValue !==
        "all"
    ) {

        filtered =
            filtered.filter(
                function (
                    resume
                ) {

                    return (
                        resume._status
                        ===
                        statusValue
                    );
                }
            );
    }


    // =====================================================
    // SORT
    // =====================================================

    filtered.sort(
        function (
            first,
            second
        ) {

            if (
                sortValue ===
                "oldest"
            ) {

                return (
                    getDateTimestamp(
                        first._uploaded_at
                    )
                    -
                    getDateTimestamp(
                        second._uploaded_at
                    )
                );
            }


            if (
                sortValue ===
                "name_asc"
            ) {

                return (
                    first._filename.localeCompare(
                        second._filename
                    )
                );
            }


            if (
                sortValue ===
                "name_desc"
            ) {

                return (
                    second._filename.localeCompare(
                        first._filename
                    )
                );
            }


            // Newest
            return (
                getDateTimestamp(
                    second._uploaded_at
                )
                -
                getDateTimestamp(
                    first._uploaded_at
                )
            );
        }
    );


    myResumesState.filteredResumes =
        filtered;


    renderResumeList();
}


// =========================================================
// RENDER RESUME LIST
// =========================================================

function renderResumeList() {

    const container =
        document.getElementById(
            "resumeListContainer"
        );


    const emptyState =
        document.getElementById(
            "resumesEmptyState"
        );


    const noResultsState =
        document.getElementById(
            "resumesNoResultsState"
        );


    const loadingState =
        document.getElementById(
            "resumesLoadingState"
        );


    const errorState =
        document.getElementById(
            "resumesErrorState"
        );


    if (loadingState) {

        loadingState.classList.add(
            "d-none"
        );
    }


    if (errorState) {

        errorState.classList.add(
            "d-none"
        );
    }


    // =====================================================
    // NO RESUMES
    // =====================================================

    if (
        myResumesState.resumes.length ===
        0
    ) {

        container?.classList.add(
            "d-none"
        );


        noResultsState?.classList.add(
            "d-none"
        );


        emptyState?.classList.remove(
            "d-none"
        );


        return;
    }


    emptyState?.classList.add(
        "d-none"
    );


    // =====================================================
    // NO FILTER RESULT
    // =====================================================

    if (
        myResumesState
            .filteredResumes
            .length ===
        0
    ) {

        container?.classList.add(
            "d-none"
        );


        noResultsState?.classList.remove(
            "d-none"
        );


        return;
    }


    noResultsState?.classList.add(
        "d-none"
    );


    if (!container) {

        return;
    }


    container.classList.remove(
        "d-none"
    );


    container.innerHTML =
        myResumesState
            .filteredResumes
            .map(
                function (
                    resume
                ) {

                    return createResumeCard(
                        resume
                    );
                }
            )
            .join(
                ""
            );
}


// =========================================================
// CREATE RESUME CARD
// =========================================================

function createResumeCard(
    resume
) {

    const resumeId =
        escapeHtml(
            String(
                resume._resume_id
                ||
                ""
            )
        );


    const filename =
        escapeHtml(
            resume._filename
        );


    const fileType =
        resume._file_type;


    const fileTypeLabel =
        fileType ===
        "pdf"
            ?
            "PDF"
            :
        fileType ===
        "docx"
            ?
            "DOCX"
            :
            "FILE";


    const uploadedDate =
        formatResumeDate(
            resume._uploaded_at
        );


    const isActive =
        resume._status ===
        "active";


    const statusText =
        isActive
            ?
            "Active"
            :
            "Deleted";


    const statusIcon =
        isActive
            ?
            "bi-check-circle-fill"
            :
            "bi-trash3-fill";


    const resumeScore =
        Number.isFinite(
            Number(
                resume._resume_score
            )
        )
            ?
            `${Math.round(Number(resume._resume_score))}/100`
            :
            "--";


    const atsReadiness =
        Number.isFinite(
            Number(
                resume._ats_readiness
            )
        )
            ?
            `${Math.round(Number(resume._ats_readiness))}%`
            :
            "--";


    const analysisStatus =
        resume._analyzed
            ?
            `
            <span class="my-resume-analysis-status analyzed">
                <i class="bi bi-check-circle-fill"></i>
                Analyzed
            </span>
            `
            :
            `
            <span class="my-resume-analysis-status pending">
                <i class="bi bi-clock"></i>
                Not analyzed
            </span>
            `;


    let actions =
        "";


    // =====================================================
    // ACTIVE ACTIONS
    // =====================================================

    if (isActive) {

        if (resume._analyzed) {

            actions +=
                `
                <button
                    type="button"
                    class="my-resume-action-button primary"
                    data-resume-action="view-analysis"
                    data-resume-id="${resumeId}"
                >
                    <i class="bi bi-bar-chart"></i>
                    View Analysis
                </button>


                <button
                    type="button"
                    class="my-resume-action-button secondary"
                    data-resume-action="analyze"
                    data-resume-id="${resumeId}"
                >
                    <i class="bi bi-stars"></i>
                    Re-analyze
                </button>
                `;

        } else {

            actions +=
                `
                <button
                    type="button"
                    class="my-resume-action-button primary"
                    data-resume-action="analyze"
                    data-resume-id="${resumeId}"
                >
                    <i class="bi bi-stars"></i>
                    Analyze Resume
                </button>
                `;
        }


        actions +=
            `
            <button
                type="button"
                class="my-resume-action-button danger"
                data-resume-action="delete"
                data-resume-id="${resumeId}"
            >
                <i class="bi bi-trash3"></i>
                Delete
            </button>
            `;
    }


    // =====================================================
    // DELETED ACTIONS
    // =====================================================

    if (!isActive) {

        if (resume._analyzed) {

            actions +=
                `
                <button
                    type="button"
                    class="my-resume-action-button secondary"
                    data-resume-action="view-analysis"
                    data-resume-id="${resumeId}"
                >
                    <i class="bi bi-bar-chart"></i>
                    View Analysis
                </button>
                `;
        }


        actions +=
            `
            <button
                type="button"
                class="my-resume-action-button reactivate"
                data-resume-action="reactivate"
                data-resume-id="${resumeId}"
            >
                <i class="bi bi-arrow-counterclockwise"></i>
                Reactivate
            </button>
            `;
    }


    return `
        <article
            class="my-resume-row ${isActive ? "active" : "deleted"}"
            data-resume-row="${resumeId}"
        >

            <div class="my-resume-row-main">


                <!-- FILE -->

                <div class="my-resume-file-area">

                    <div class="my-resume-file-icon ${fileType}">

                        ${
                            fileType === "pdf"
                                ?
                                `<i class="bi bi-file-earmark-pdf-fill"></i>`
                                :
                            fileType === "docx"
                                ?
                                `<i class="bi bi-file-earmark-word-fill"></i>`
                                :
                                `<i class="bi bi-file-earmark-text-fill"></i>`
                        }

                    </div>


                    <div class="my-resume-file-copy">

                        <div class="my-resume-name-line">

                            <h3 title="${filename}">
                                ${filename}
                            </h3>

                            ${analysisStatus}

                        </div>


                        <div class="my-resume-meta">

                            <span>
                                <i class="bi bi-file-earmark"></i>
                                ${fileTypeLabel}
                            </span>

                            <span>
                                <i class="bi bi-calendar3"></i>
                                ${
                                    uploadedDate
                                    ||
                                    "Upload date unavailable"
                                }
                            </span>

                        </div>

                    </div>

                </div>



                <!-- STATUS -->

                <div class="my-resume-status-column">

                    <span class="my-resume-status ${isActive ? "active" : "deleted"}">

                        <i class="bi ${statusIcon}"></i>

                        ${statusText}

                    </span>

                </div>



                <!-- SCORES -->

                <div class="my-resume-score-area">


                    <div class="my-resume-score-box">

                        <span>
                            Resume Score
                        </span>

                        <strong>
                            ${resumeScore}
                        </strong>

                    </div>


                    <div class="my-resume-score-box">

                        <span>
                            ATS Readiness
                        </span>

                        <strong>
                            ${atsReadiness}
                        </strong>

                    </div>

                </div>

            </div>



            <!-- ACTIONS -->

            <div class="my-resume-row-actions">

                ${actions}

            </div>

        </article>
    `;
}


// =========================================================
// INITIALIZE RESUME ACTIONS
// =========================================================

function initializeResumeListActions() {

    const container =
        document.getElementById(
            "resumeListContainer"
        );


    if (!container) {

        return;
    }


    container.addEventListener(
        "click",
        async function (
            event
        ) {

            const button =
                event.target.closest(
                    "[data-resume-action]"
                );


            if (!button) {

                return;
            }


            const resumeId =
                button.dataset
                    .resumeId;


            const action =
                button.dataset
                    .resumeAction;


            const resume =
                findResumeById(
                    resumeId
                );


            if (!resume) {

                alert(
                    "Resume information could not be found."
                );

                return;
            }


            if (
                action ===
                "view-analysis"
            ) {

                await openResumeAnalysis(
                    resume,
                    button
                );

                return;
            }


            if (
                action ===
                "analyze"
            ) {

                await analyzeResume(
                    resume,
                    button
                );

                return;
            }


            if (
                action ===
                "delete"
            ) {

                openDeleteResumeModal(
                    resume
                );

                return;
            }


            if (
                action ===
                "reactivate"
            ) {

                openReactivateResumeModal(
                    resume
                );

                return;
            }
        }
    );
}


// =========================================================
// FIND RESUME
// =========================================================

function findResumeById(
    resumeId
) {

    return (
        myResumesState
            .resumes
            .find(
                function (
                    resume
                ) {

                    return (
                        String(
                            resume._resume_id
                        )
                        ===
                        String(
                            resumeId
                        )
                    );
                }
            )
        ||
        null
    );
}


// =========================================================
// ANALYZE RESUME
// POST /api/resumes/{resume_id}/analyze
// =========================================================

async function analyzeResume(
    resume,
    button
) {

    if (
        resume._status !==
        "active"
    ) {

        alert(
            "Please reactivate this resume before analyzing it."
        );

        return;
    }


    const token =
        getResumeAuthToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    const resumeId =
        resume._resume_id;


    setActionButtonLoading(
        button,
        true,
        "Analyzing..."
    );


    try {

        const response =
            await fetch(
                `${MY_RESUMES_API_BASE_URL}/api/resumes/${encodeURIComponent(resumeId)}/analyze`,
                {
                    method:
                        "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await readApiResponse(
                response
            );


        if (
            response.status ===
            401
            ||
            response.status ===
            403
        ) {

            handleUnauthorized();

            return;
        }


        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(
                    data,
                    "Unable to analyze this resume."
                )
            );
        }


        const analysis =
            data?.analysis;


        if (
            !analysis
            ||
            typeof analysis !==
            "object"
        ) {

            throw new Error(
                "Resume analysis data was not returned by the server."
            );
        }


        // =================================================
        // SAVE CURRENT RESUME + ANALYSIS
        // =================================================

        sessionStorage.setItem(
            "resumeiq_current_resume_id",
            String(
                resumeId
            )
        );


        sessionStorage.setItem(
            "resumeiq_current_analysis",
            JSON.stringify(
                analysis
            )
        );


        // =================================================
        // UPDATE LOCAL STATE
        // =================================================

        resume._analysis =
            analysis;


        resume._analyzed =
            true;


        resume._resume_score =
            getResumeScore(
                analysis
            );


        resume._ats_readiness =
            getATSReadiness(
                analysis
            );


        // =================================================
        // OPEN ANALYSIS PAGE
        // =================================================

        window.location.href =
            "analysis.html";


    } catch (error) {

        console.error(
            "Resume analysis failed:",
            error
        );


        alert(
            error.message
            ||
            "Unable to analyze this resume."
        );


        setActionButtonLoading(
            button,
            false
        );
    }
}


// =========================================================
// VIEW SAVED ANALYSIS
// =========================================================

async function openResumeAnalysis(
    resume,
    button
) {

    const token =
        getResumeAuthToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    const resumeId =
        resume._resume_id;


    setActionButtonLoading(
        button,
        true,
        "Opening..."
    );


    try {

        let analysis =
            resume._analysis;


        if (!analysis) {

            analysis =
                await fetchResumeAnalysis(
                    resumeId,
                    token
                );
        }


        if (!analysis) {

            // No previous analysis.
            // Run analysis automatically.
            setActionButtonLoading(
                button,
                false
            );


            await analyzeResume(
                resume,
                button
            );


            return;
        }


        sessionStorage.setItem(
            "resumeiq_current_resume_id",
            String(
                resumeId
            )
        );


        sessionStorage.setItem(
            "resumeiq_current_analysis",
            JSON.stringify(
                analysis
            )
        );


        window.location.href =
            "analysis.html";


    } catch (error) {

        console.error(
            "Unable to open analysis:",
            error
        );


        alert(
            error.message
            ||
            "Unable to open resume analysis."
        );


        setActionButtonLoading(
            button,
            false
        );
    }
}


// =========================================================
// DELETE MODAL INITIALIZE
// =========================================================

function initializeDeleteModal() {

    const modal =
        document.getElementById(
            "deleteResumeModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelDeleteResumeButton"
        );


    const confirmButton =
        document.getElementById(
            "confirmDeleteResumeButton"
        );


    if (!modal) {

        return;
    }


    modal
        .querySelectorAll(
            "[data-delete-modal-close]"
        )
        .forEach(
            function (
                element
            ) {

                element.addEventListener(
                    "click",
                    closeDeleteResumeModal
                );
            }
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeDeleteResumeModal
        );
    }


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            confirmDeleteResume
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

                closeDeleteResumeModal();
            }
        }
    );
}


// =========================================================
// OPEN DELETE MODAL
// =========================================================

function openDeleteResumeModal(
    resume
) {

    const modal =
        document.getElementById(
            "deleteResumeModal"
        );


    if (!modal) {

        return;
    }


    myResumesState.deleteTarget =
        resume;


    setText(
        "deleteResumeFilename",
        resume._filename
    );


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "my-resumes-modal-open"
    );
}


// =========================================================
// CLOSE DELETE MODAL
// =========================================================

function closeDeleteResumeModal() {

    const modal =
        document.getElementById(
            "deleteResumeModal"
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
        "my-resumes-modal-open"
    );


    myResumesState.deleteTarget =
        null;


    const button =
        document.getElementById(
            "confirmDeleteResumeButton"
        );


    setModalButtonLoading(
        button,
        false,
        "Delete Resume",
        "bi-trash3"
    );
}


// =========================================================
// CONFIRM DELETE
// DELETE /api/resumes/{resume_id}
// =========================================================

async function confirmDeleteResume() {

    const resume =
        myResumesState
            .deleteTarget;


    if (!resume) {

        return;
    }


    const token =
        getResumeAuthToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    const button =
        document.getElementById(
            "confirmDeleteResumeButton"
        );


    setModalButtonLoading(
        button,
        true,
        "Deleting..."
    );


    try {

        const response =
            await fetch(
                `${MY_RESUMES_API_BASE_URL}/api/resumes/${encodeURIComponent(resume._resume_id)}`,
                {
                    method:
                        "DELETE",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await readApiResponse(
                response
            );


        if (
            response.status ===
            401
            ||
            response.status ===
            403
        ) {

            handleUnauthorized();

            return;
        }


        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(
                    data,
                    "Unable to delete resume."
                )
            );
        }


        closeDeleteResumeModal();


        // Reload fresh data from MongoDB
        await loadMyResumes();


    } catch (error) {

        console.error(
            "Resume delete failed:",
            error
        );


        alert(
            error.message
            ||
            "Unable to delete resume."
        );


        setModalButtonLoading(
            button,
            false,
            "Delete Resume",
            "bi-trash3"
        );
    }
}


// =========================================================
// REACTIVATE MODAL INITIALIZE
// =========================================================

function initializeReactivateModal() {

    const modal =
        document.getElementById(
            "reactivateResumeModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelReactivateResumeButton"
        );


    const confirmButton =
        document.getElementById(
            "confirmReactivateResumeButton"
        );


    if (!modal) {

        return;
    }


    modal
        .querySelectorAll(
            "[data-reactivate-modal-close]"
        )
        .forEach(
            function (
                element
            ) {

                element.addEventListener(
                    "click",
                    closeReactivateResumeModal
                );
            }
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeReactivateResumeModal
        );
    }


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            confirmReactivateResume
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

                closeReactivateResumeModal();
            }
        }
    );
}


// =========================================================
// OPEN REACTIVATE MODAL
// =========================================================

function openReactivateResumeModal(
    resume
) {

    const modal =
        document.getElementById(
            "reactivateResumeModal"
        );


    if (!modal) {

        return;
    }


    myResumesState.reactivateTarget =
        resume;


    setText(
        "reactivateResumeFilename",
        resume._filename
    );


    modal.classList.add(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "my-resumes-modal-open"
    );
}


// =========================================================
// CLOSE REACTIVATE MODAL
// =========================================================

function closeReactivateResumeModal() {

    const modal =
        document.getElementById(
            "reactivateResumeModal"
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
        "my-resumes-modal-open"
    );


    myResumesState.reactivateTarget =
        null;


    const button =
        document.getElementById(
            "confirmReactivateResumeButton"
        );


    setModalButtonLoading(
        button,
        false,
        "Reactivate",
        "bi-arrow-counterclockwise"
    );
}


// =========================================================
// CONFIRM REACTIVATE
//
// Expected backend route:
//
// PATCH
// /api/resumes/{resume_id}/reactivate
// =========================================================

async function confirmReactivateResume() {

    const resume =
        myResumesState
            .reactivateTarget;


    if (!resume) {

        return;
    }


    const token =
        getResumeAuthToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    const button =
        document.getElementById(
            "confirmReactivateResumeButton"
        );


    setModalButtonLoading(
        button,
        true,
        "Reactivating..."
    );


    try {

        const response =
            await fetch(
                `${MY_RESUMES_API_BASE_URL}/api/resumes/${encodeURIComponent(resume._resume_id)}/reactivate`,
                {
                    method:
                        "PATCH",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await readApiResponse(
                response
            );


        if (
            response.status ===
            401
            ||
            response.status ===
            403
        ) {

            handleUnauthorized();

            return;
        }


        if (
            response.status ===
            404
            ||
            response.status ===
            405
        ) {

            throw new Error(
                "Resume reactivate API is not available yet. Backend reactivate route needs to be added."
            );
        }


        if (!response.ok) {

            throw new Error(
                getApiErrorMessage(
                    data,
                    "Unable to reactivate resume."
                )
            );
        }


        closeReactivateResumeModal();


        await loadMyResumes();


    } catch (error) {

        console.error(
            "Resume reactivation failed:",
            error
        );


        alert(
            error.message
            ||
            "Unable to reactivate resume."
        );


        setModalButtonLoading(
            button,
            false,
            "Reactivate",
            "bi-arrow-counterclockwise"
        );
    }
}


// =========================================================
// REFRESH
// =========================================================

function initializeRefreshButton() {

    const button =
        document.getElementById(
            "refreshResumesButton"
        );


    const retryButton =
        document.getElementById(
            "retryLoadResumesButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            async function () {

                button.classList.add(
                    "refreshing"
                );


                await loadMyResumes();
            }
        );
    }


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            async function () {

                await loadMyResumes();
            }
        );
    }
}


// =========================================================
// STOP REFRESH ANIMATION
// =========================================================

function stopRefreshAnimation() {

    const button =
        document.getElementById(
            "refreshResumesButton"
        );


    button?.classList.remove(
        "refreshing"
    );
}


// =========================================================
// LOADING STATE
// =========================================================

function showLoadingState() {

    const loading =
        document.getElementById(
            "resumesLoadingState"
        );


    const error =
        document.getElementById(
            "resumesErrorState"
        );


    const empty =
        document.getElementById(
            "resumesEmptyState"
        );


    const noResults =
        document.getElementById(
            "resumesNoResultsState"
        );


    const list =
        document.getElementById(
            "resumeListContainer"
        );


    loading?.classList.remove(
        "d-none"
    );


    error?.classList.add(
        "d-none"
    );


    empty?.classList.add(
        "d-none"
    );


    noResults?.classList.add(
        "d-none"
    );


    list?.classList.add(
        "d-none"
    );
}


// =========================================================
// ERROR STATE
// =========================================================

function showErrorState(
    message
) {

    const loading =
        document.getElementById(
            "resumesLoadingState"
        );


    const error =
        document.getElementById(
            "resumesErrorState"
        );


    const empty =
        document.getElementById(
            "resumesEmptyState"
        );


    const noResults =
        document.getElementById(
            "resumesNoResultsState"
        );


    const list =
        document.getElementById(
            "resumeListContainer"
        );


    loading?.classList.add(
        "d-none"
    );


    empty?.classList.add(
        "d-none"
    );


    noResults?.classList.add(
        "d-none"
    );


    list?.classList.add(
        "d-none"
    );


    error?.classList.remove(
        "d-none"
    );


    setText(
        "resumesErrorMessage",
        message
    );
}


// =========================================================
// BUTTON LOADING
// =========================================================

function setActionButtonLoading(
    button,
    loading,
    loadingText = "Loading..."
) {

    if (!button) {

        return;
    }


    if (loading) {

        if (
            !button.dataset
                .originalHtml
        ) {

            button.dataset.originalHtml =
                button.innerHTML;
        }


        button.disabled =
            true;


        button.innerHTML =
            `
            <span
                class="spinner-border spinner-border-sm"
                aria-hidden="true"
            ></span>

            ${escapeHtml(loadingText)}
            `;


        return;
    }


    button.disabled =
        false;


    if (
        button.dataset
            .originalHtml
    ) {

        button.innerHTML =
            button.dataset
                .originalHtml;


        delete button.dataset
            .originalHtml;
    }
}


// =========================================================
// MODAL BUTTON LOADING
// =========================================================

function setModalButtonLoading(
    button,
    loading,
    text,
    iconClass = ""
) {

    if (!button) {

        return;
    }


    button.disabled =
        loading;


    if (loading) {

        button.innerHTML =
            `
            <span
                class="spinner-border spinner-border-sm"
                aria-hidden="true"
            ></span>

            ${escapeHtml(text)}
            `;


        return;
    }


    button.innerHTML =
        `
        ${
            iconClass
                ?
                `<i class="bi ${iconClass}"></i>`
                :
                ""
        }

        ${escapeHtml(text)}
        `;
}


// =========================================================
// READ API RESPONSE
// =========================================================

async function readApiResponse(
    response
) {

    try {

        return (
            await response.json()
        );

    } catch (error) {

        return null;
    }
}


// =========================================================
// API ERROR MESSAGE
// Prevent [object Object]
// =========================================================

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
                    function (
                        item
                    ) {

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
                .filter(
                    Boolean
                );


        if (
            messages.length >
            0
        ) {

            return messages.join(
                " "
            );
        }
    }


    if (
        data.detail
        &&
        typeof data.detail ===
        "object"
    ) {

        if (
            typeof data.detail
                .message ===
            "string"
        ) {

            return data.detail
                .message;
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
// GET AUTH TOKEN
// =========================================================

function getResumeAuthToken() {

    if (
        typeof getToken ===
        "function"
    ) {

        return getToken();
    }


    return (
        localStorage.getItem(
            "resumeiq_token"
        )
        ||
        sessionStorage.getItem(
            "resumeiq_token"
        )
        ||
        null
    );
}


// =========================================================
// UNAUTHORIZED
// =========================================================

function handleUnauthorized() {

    try {

        if (
            typeof clearAuthData ===
            "function"
        ) {

            clearAuthData();

        } else {

            localStorage.removeItem(
                "resumeiq_token"
            );


            sessionStorage.removeItem(
                "resumeiq_token"
            );
        }

    } catch (error) {

        console.warn(
            "Unable to clear auth data:",
            error
        );
    }


    redirectToLogin();
}


// =========================================================
// LOGIN REDIRECT
// =========================================================

function redirectToLogin() {

    window.location.replace(
        "../auth/login.html"
    );
}


// =========================================================
// FORMAT DATE
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


    try {

        return (
            new Intl.DateTimeFormat(
                "en-IN",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            )
            .format(
                date
            )
        );

    } catch (error) {

        return (
            date.toLocaleDateString()
        );
    }
}


// =========================================================
// DATE TIMESTAMP
// =========================================================

function getDateTimestamp(
    value
) {

    if (!value) {

        return 0;
    }


    const date =
        new Date(
            value
        );


    const timestamp =
        date.getTime();


    if (
        Number.isNaN(
            timestamp
        )
    ) {

        return 0;
    }


    return timestamp;
}


// =========================================================
// SET TEXT
// =========================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;
    }


    element.textContent =
        value;
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(
    value
) {

    return String(
        value
        ??
        ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}