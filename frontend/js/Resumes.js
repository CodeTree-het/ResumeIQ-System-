// =========================================================
// ResumeIQ - Upload Resume
//
// Dynamic Flow:
//
// Select Resume
// → Upload
// → Analyze
// → Fetch Resume Details
// → Show Current Resume Preview
//
// Previous resume is NOT auto-restored on this page.
// =========================================================

const RESUME_API_BASE_URL =
    "http://127.0.0.1:8000";


// =========================================================
// STATE
// =========================================================

let selectedResumeFile =
    null;

let uploadedResumeId =
    null;

let latestAnalysis =
    null;

let latestResumeDetails =
    null;


// =========================================================
// START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeResumeUpload();
    }
);


// =========================================================
// INITIALIZE
// =========================================================

function initializeResumeUpload() {

    const fileInput =
        document.getElementById(
            "resumeFileInput"
        );


    const browseButton =
        document.getElementById(
            "resumeBrowseButton"
        );


    const uploadNewButton =
        document.getElementById(
            "uploadNewResumeButton"
        );


    const dropZone =
        document.getElementById(
            "resumeDropZone"
        );


    const removeButton =
        document.getElementById(
            "removeResumeButton"
        );


    const analyzeButton =
        document.getElementById(
            "analyseResumeButton"
        );


    const viewFullButton =
        document.getElementById(
            "viewFullResumeButton"
        );


    // =====================================================
    // FRESH PAGE
    // =====================================================

    selectedResumeFile =
        null;


    uploadedResumeId =
        null;


    latestAnalysis =
        null;


    latestResumeDetails =
        null;


    resetUploadPage();


    // =====================================================
    // BROWSE
    // =====================================================

    browseButton?.addEventListener(
        "click",
        function () {

            fileInput?.click();
        }
    );


    // =====================================================
    // UPLOAD NEW
    // =====================================================

    uploadNewButton?.addEventListener(
        "click",
        function () {

            fileInput?.click();
        }
    );


    // =====================================================
    // INPUT
    // =====================================================

    fileInput?.addEventListener(
        "change",
        function () {

            if (
                !fileInput.files
                ||
                fileInput.files.length === 0
            ) {

                return;
            }


            handleSelectedResume(
                fileInput.files[0]
            );
        }
    );


    // =====================================================
    // DRAG OVER
    // =====================================================

    dropZone?.addEventListener(
        "dragover",
        function (
            event
        ) {

            event.preventDefault();


            dropZone.classList.add(
                "resume-drag-active"
            );
        }
    );


    // =====================================================
    // DRAG LEAVE
    // =====================================================

    dropZone?.addEventListener(
        "dragleave",
        function () {

            dropZone.classList.remove(
                "resume-drag-active"
            );
        }
    );


    // =====================================================
    // DROP
    // =====================================================

    dropZone?.addEventListener(
        "drop",
        function (
            event
        ) {

            event.preventDefault();


            dropZone.classList.remove(
                "resume-drag-active"
            );


            if (
                !event.dataTransfer.files
                ||
                event.dataTransfer.files.length === 0
            ) {

                return;
            }


            handleSelectedResume(
                event.dataTransfer.files[0]
            );
        }
    );


    // =====================================================
    // REMOVE
    // =====================================================

    removeButton?.addEventListener(
        "click",
        function () {

            clearCurrentResume();
        }
    );


    // =====================================================
    // ANALYZE
    // =====================================================

    analyzeButton?.addEventListener(
        "click",
        async function () {

            await processResume();
        }
    );


    // =====================================================
    // VIEW FULL
    // =====================================================

    viewFullButton?.addEventListener(
        "click",
        function () {

            openFullResumePreview();
        }
    );


    // =====================================================
    // SELECT FILE
    // =====================================================

    function handleSelectedResume(
        file
    ) {

        const extension =
            getFileExtension(
                file.name
            );


        // =================================================
        // VALID FORMAT
        // =================================================

        if (
            ![
                "pdf",
                "docx"
            ].includes(
                extension
            )
        ) {

            alert(
                "Only PDF and DOCX files are supported."
            );

            return;
        }


        // =================================================
        // SIZE
        // =================================================

        const maximumSize =
            10
            *
            1024
            *
            1024;


        if (
            file.size >
            maximumSize
        ) {

            alert(
                "Resume file must be 10 MB or smaller."
            );

            return;
        }


        // =================================================
        // STATE
        // =================================================

        selectedResumeFile =
            file;


        uploadedResumeId =
            null;


        latestAnalysis =
            null;


        latestResumeDetails =
            null;


        // =================================================
        // CURRENT RESUME SESSION RESET
        // =================================================

        sessionStorage.removeItem(
            "resumeiq_current_resume_id"
        );


        sessionStorage.removeItem(
            "resumeiq_current_analysis"
        );


        // =================================================
        // UI
        // =================================================

        renderSelectedFile(
            file
        );


        renderPreviewFile(
            file
        );


        renderWaitingSections();


        renderWaitingText();


        hideExtractionCard();


        hideParsedBadge();


        enableAnalyzeButton();
    }


    // =====================================================
    // CLEAR
    // =====================================================

    function clearCurrentResume() {

        selectedResumeFile =
            null;


        uploadedResumeId =
            null;


        latestAnalysis =
            null;


        latestResumeDetails =
            null;


        if (fileInput) {

            fileInput.value =
                "";
        }


        sessionStorage.removeItem(
            "resumeiq_current_resume_id"
        );


        sessionStorage.removeItem(
            "resumeiq_current_analysis"
        );


        resetUploadPage();
    }


    // =====================================================
    // PROCESS
    // =====================================================

    async function processResume() {

        if (!selectedResumeFile) {

            alert(
                "Please select a resume first."
            );

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

            // =============================================
            // UPLOAD
            // =============================================

            if (!uploadedResumeId) {

                setAnalyzeLoading(
                    "Uploading Resume..."
                );


                setUploadStatus(
                    "Uploading...",
                    "processing"
                );


                uploadedResumeId =
                    await uploadResume(
                        selectedResumeFile,
                        token
                    );


                sessionStorage.setItem(
                    "resumeiq_current_resume_id",
                    uploadedResumeId
                );
            }


            // =============================================
            // ANALYSIS
            // =============================================

            setAnalyzeLoading(
                "Analyzing Resume..."
            );


            setUploadStatus(
                "Analyzing...",
                "processing"
            );


            renderProcessingText();


            const analysis =
                await analyzeResume(
                    uploadedResumeId,
                    token
                );


            latestAnalysis =
                analysis;


            // =============================================
            // DETAILS
            // =============================================

            const details =
                await getResumeDetails(
                    uploadedResumeId,
                    token
                );


            latestResumeDetails =
                details;


            // =============================================
            // SESSION
            // =============================================

            sessionStorage.setItem(
                "resumeiq_current_analysis",
                JSON.stringify(
                    analysis
                )
            );


            // =============================================
            // FINAL
            // =============================================

            renderFinalResult(
                analysis,
                details,
                selectedResumeFile
            );


            showExtractionCard();


            showParsedBadge();


            setUploadStatus(
                "Upload Complete",
                "success"
            );


            setAnalyzeComplete();


        } catch (error) {

            console.error(
                "Resume processing failed:",
                error
            );


            setUploadStatus(
                "Failed",
                "error"
            );


            setAnalyzeError();


            renderError(
                error.message
                ||
                "Unable to analyze resume."
            );


            alert(
                error.message
                ||
                "Unable to analyze resume."
            );
        }
    }
}


// =========================================================
// UPLOAD API
// =========================================================

async function uploadResume(
    file,
    token
) {

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    const response =
        await fetch(
            `${RESUME_API_BASE_URL}/api/resumes/upload`,
            {
                method:
                    "POST",

                headers: {

                    "Authorization":
                        `Bearer ${token}`
                },

                body:
                    formData
            }
        );


    const data =
        await parseJSON(
            response
        );


    handleAuthFailure(
        response
    );


    if (!response.ok) {

        throw new Error(
            data.detail
            ||
            data.message
            ||
            "Resume upload failed."
        );
    }


    const resumeId =
        data.resume_id
        ||
        data.id
        ||
        data._id;


    if (!resumeId) {

        throw new Error(
            "Resume ID was not returned by the server."
        );
    }


    return String(
        resumeId
    );
}


// =========================================================
// ANALYZE API
// =========================================================

async function analyzeResume(
    resumeId,
    token
) {

    const response =
        await fetch(
            `${RESUME_API_BASE_URL}/api/resumes/${encodeURIComponent(resumeId)}/analyze`,
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
        await parseJSON(
            response
        );


    handleAuthFailure(
        response
    );


    if (!response.ok) {

        throw new Error(
            data.detail
            ||
            data.message
            ||
            "Resume analysis failed."
        );
    }


    if (!data.analysis) {

        throw new Error(
            "Resume analysis data was not returned."
        );
    }


    return data.analysis;
}


// =========================================================
// RESUME DETAILS
// =========================================================

async function getResumeDetails(
    resumeId,
    token
) {

    const response =
        await fetch(
            `${RESUME_API_BASE_URL}/api/resumes/${encodeURIComponent(resumeId)}`,
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
        await parseJSON(
            response
        );


    handleAuthFailure(
        response
    );


    if (!response.ok) {

        throw new Error(
            data.detail
            ||
            data.message
            ||
            "Unable to load resume details."
        );
    }


    return (
        data.resume
        ||
        data
    );
}


// =========================================================
// SELECTED FILE LEFT
// =========================================================

function renderSelectedFile(
    file
) {

    const card =
        document.getElementById(
            "uploadedFilePreview"
        );


    const name =
        document.getElementById(
            "uploadedFileName"
        );


    const details =
        document.getElementById(
            "uploadedFileDetails"
        );


    const icon =
        document.getElementById(
            "selectedFileIcon"
        );


    const extension =
        getFileExtension(
            file.name
        );


    if (card) {

        card.style.display =
            "flex";
    }


    if (name) {

        name.textContent =
            file.name;
    }


    if (details) {

        details.textContent =
            `${formatDate(new Date())} • ${formatFileSize(file.size)}`;
    }


    setFileIcon(
        icon,
        extension
    );


    setUploadStatus(
        "Ready",
        "ready"
    );
}


// =========================================================
// PREVIEW FILE BEFORE ANALYSIS
// =========================================================

function renderPreviewFile(
    file
) {

    const filename =
        document.getElementById(
            "previewResumeFilename"
        );


    const metadata =
        document.getElementById(
            "previewResumeMeta"
        );


    const icon =
        document.getElementById(
            "previewFileIcon"
        );


    if (filename) {

        filename.textContent =
            file.name;
    }


    if (metadata) {

        metadata.textContent =
            `${formatFileSize(file.size)} • Selected ${formatDate(new Date())}`;
    }


    setFileIcon(
        icon,
        getFileExtension(
            file.name
        )
    );
}


// =========================================================
// FINAL
// =========================================================

function renderFinalResult(
    analysis,
    details,
    file
) {

    renderFinalFileHeader(
        analysis,
        details,
        file
    );


    renderDetectedSections(
        analysis
    );


    renderExtractedText(
        details,
        analysis
    );
}


// =========================================================
// FINAL HEADER
// =========================================================

function renderFinalFileHeader(
    analysis,
    details,
    file
) {

    const filenameElement =
        document.getElementById(
            "previewResumeFilename"
        );


    const metadataElement =
        document.getElementById(
            "previewResumeMeta"
        );


    const icon =
        document.getElementById(
            "previewFileIcon"
        );


    const filename =
        analysis?.resume_filename
        ||
        details?.original_filename
        ||
        details?.filename
        ||
        file?.name
        ||
        "Resume";


    const size =
        Number(
            details?.file_size
            ||
            details?.size
            ||
            file?.size
            ||
            0
        );


    const uploadedAt =
        details?.uploaded_at
        ||
        details?.created_at
        ||
        new Date();


    if (filenameElement) {

        filenameElement.textContent =
            filename;
    }


    if (metadataElement) {

        const parts =
            [];


        if (size > 0) {

            parts.push(
                formatFileSize(
                    size
                )
            );
        }


        parts.push(
            `Uploaded ${formatDate(uploadedAt)}`
        );


        metadataElement.textContent =
            parts.join(
                " • "
            );
    }


    setFileIcon(
        icon,
        getFileExtension(
            filename
        )
    );
}


// =========================================================
// WAITING SECTIONS
// =========================================================

function renderWaitingSections() {

    const container =
        document.getElementById(
            "detectedSectionList"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        `
        <div class="detected-section-waiting">

            Analyze your resume to
            <br>
            detect resume sections.

        </div>
        `;
}


// =========================================================
// DETECTED SECTIONS
//
// Screenshot style:
// only FOUND sections are displayed.
// =========================================================

function renderDetectedSections(
    analysis
) {

    const container =
        document.getElementById(
            "detectedSectionList"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    const presence =
        analysis?.section_presence
        ||
        {};


    const sections = [

        {
            key:
                "summary",

            label:
                "Summary",

            icon:
                "bi-person-fill",

            className:
                "summary"
        },

        {
            key:
                "skills",

            label:
                "Skills",

            icon:
                "bi-gear-fill",

            className:
                "skills"
        },

        {
            key:
                "education",

            label:
                "Education",

            icon:
                "bi-mortarboard-fill",

            className:
                "education"
        },

        {
            key:
                "projects",

            label:
                "Projects",

            icon:
                "bi-briefcase-fill",

            className:
                "projects"
        },

        {
            key:
                "experience",

            label:
                "Experience",

            icon:
                "bi-briefcase-fill",

            className:
                "experience"
        },

        {
            key:
                "certifications",

            label:
                "Certifications",

            icon:
                "bi-file-earmark-text-fill",

            className:
                "certifications"
        },

        {
            key:
                "achievements",

            label:
                "Achievements",

            icon:
                "bi-trophy-fill",

            className:
                "achievements"
        }
    ];


    const detected =
        sections.filter(
            function (
                section
            ) {

                return Boolean(
                    presence[
                        section.key
                    ]
                );
            }
        );


    if (
        detected.length === 0
    ) {

        container.innerHTML =
            `
            <div class="detected-section-waiting">
                No resume sections detected.
            </div>
            `;


        return;
    }


    detected.forEach(
        function (
            section
        ) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                `detected-section-item ${section.className}`;


            const main =
                document.createElement(
                    "div"
                );


            main.className =
                "detected-section-main";


            const iconWrapper =
                document.createElement(
                    "span"
                );


            iconWrapper.className =
                "detected-section-icon";


            const icon =
                document.createElement(
                    "i"
                );


            icon.className =
                `bi ${section.icon}`;


            iconWrapper.appendChild(
                icon
            );


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                section.label;


            main.appendChild(
                iconWrapper
            );


            main.appendChild(
                text
            );


            const arrow =
                document.createElement(
                    "i"
                );


            arrow.className =
                "bi bi-chevron-right detected-section-arrow";


            row.appendChild(
                main
            );


            row.appendChild(
                arrow
            );


            container.appendChild(
                row
            );
        }
    );
}


// =========================================================
// WAITING TEXT
// =========================================================

function renderWaitingText() {

    const container =
        document.getElementById(
            "extractedTextPreview"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        `
        <p>
            Upload and analyze your resume
            to view extracted text here.
        </p>

        <span>
            Waiting for analysis
        </span>
        `;
}


// =========================================================
// PROCESSING TEXT
// =========================================================

function renderProcessingText() {

    const container =
        document.getElementById(
            "extractedTextPreview"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        `
        <p>
            ResumeIQ is extracting and
            analyzing your resume...
        </p>

        <span>
            Processing resume
        </span>
        `;
}


// =========================================================
// EXTRACTED TEXT
// =========================================================

function renderExtractedText(
    details,
    analysis
) {

    const container =
        document.getElementById(
            "extractedTextPreview"
        );


    if (!container) {

        return;
    }


    let text =
        String(
            details?.extracted_text
            ||
            details?.text
            ||
            ""
        ).trim();


    // Fallback

    if (
        !text
        &&
        analysis?.summary
    ) {

        text =
            String(
                analysis.summary
            ).trim();
    }


    container.innerHTML =
        "";


    if (!text) {

        const paragraph =
            document.createElement(
                "p"
            );


        paragraph.textContent =
            "No extracted text available.";


        container.appendChild(
            paragraph
        );


        return;
    }


    const maximumCharacters =
        2400;


    const preview =
        text.length >
        maximumCharacters
            ?
            (
                text.slice(
                    0,
                    maximumCharacters
                )
                +
                "\n..."
            )
            :
            text;


    const paragraph =
        document.createElement(
            "p"
        );


    paragraph.textContent =
        preview;


    container.appendChild(
        paragraph
    );


    const information =
        document.createElement(
            "span"
        );


    information.textContent =
        `${text.length.toLocaleString()} extracted characters`;


    container.appendChild(
        information
    );
}


// =========================================================
// RESET
// =========================================================

function resetUploadPage() {

    const fileCard =
        document.getElementById(
            "uploadedFilePreview"
        );


    const button =
        document.getElementById(
            "analyseResumeButton"
        );


    const filename =
        document.getElementById(
            "previewResumeFilename"
        );


    const metadata =
        document.getElementById(
            "previewResumeMeta"
        );


    const icon =
        document.getElementById(
            "previewFileIcon"
        );


    if (fileCard) {

        fileCard.style.display =
            "none";
    }


    if (button) {

        button.disabled =
            true;


        button.innerHTML =
            `
            <i class="bi bi-stars"></i>

            Analyze Resume

            <i class="bi bi-arrow-right"></i>
            `;
    }


    if (filename) {

        filename.textContent =
            "No resume selected";
    }


    if (metadata) {

        metadata.textContent =
            "Upload and analyze a resume";
    }


    setFileIcon(
        icon,
        "pdf"
    );


    hideParsedBadge();


    hideExtractionCard();


    renderWaitingSections();


    renderWaitingText();
}


// =========================================================
// FILE ICON
// =========================================================

function setFileIcon(
    element,
    extension
) {

    if (!element) {

        return;
    }


    element.classList.remove(
        "pdf",
        "docx"
    );


    if (
        extension === "docx"
    ) {

        element.classList.add(
            "docx"
        );


        element.textContent =
            "DOCX";

    } else {

        element.classList.add(
            "pdf"
        );


        element.textContent =
            "PDF";
    }
}


// =========================================================
// STATUS
// =========================================================

function setUploadStatus(
    text,
    state
) {

    const box =
        document.querySelector(
            ".upload-success"
        );


    if (!box) {

        return;
    }


    const icon =
        box.querySelector(
            "i"
        );


    const label =
        document.getElementById(
            "uploadStatusText"
        );


    if (label) {

        label.textContent =
            text;
    }


    if (!icon) {

        return;
    }


    if (
        state === "processing"
    ) {

        icon.className =
            "bi bi-arrow-repeat";


        box.style.color =
            "#176ff2";


        return;
    }


    if (
        state === "error"
    ) {

        icon.className =
            "bi bi-x-circle-fill";


        box.style.color =
            "#dc3545";


        return;
    }


    icon.className =
        "bi bi-check-circle-fill";


    box.style.color =
        "#09a17c";
}


// =========================================================
// BUTTON READY
// =========================================================

function enableAnalyzeButton() {

    const button =
        document.getElementById(
            "analyseResumeButton"
        );


    if (!button) {

        return;
    }


    button.disabled =
        false;


    button.innerHTML =
        `
        <i class="bi bi-stars"></i>

        Analyze Resume

        <i class="bi bi-arrow-right"></i>
        `;
}


// =========================================================
// BUTTON LOADING
// =========================================================

function setAnalyzeLoading(
    text
) {

    const button =
        document.getElementById(
            "analyseResumeButton"
        );


    if (!button) {

        return;
    }


    button.disabled =
        true;


    button.innerHTML =
        `
        <span
            class="spinner-border spinner-border-sm"
            aria-hidden="true"
        ></span>

        ${text}
        `;
}


// =========================================================
// BUTTON COMPLETE
// =========================================================

function setAnalyzeComplete() {

    const button =
        document.getElementById(
            "analyseResumeButton"
        );


    if (!button) {

        return;
    }


    button.disabled =
        true;


    button.innerHTML =
        `
        <i class="bi bi-check-circle-fill"></i>

        Analysis Complete
        `;
}


// =========================================================
// BUTTON ERROR
// =========================================================

function setAnalyzeError() {

    const button =
        document.getElementById(
            "analyseResumeButton"
        );


    if (!button) {

        return;
    }


    button.disabled =
        false;


    button.innerHTML =
        `
        <i class="bi bi-arrow-clockwise"></i>

        Try Analysis Again
        `;
}


// =========================================================
// EXTRACTION
// =========================================================

function showExtractionCard() {

    const card =
        document.getElementById(
            "extractionSuccessCard"
        );


    if (card) {

        card.style.display =
            "flex";
    }
}


function hideExtractionCard() {

    const card =
        document.getElementById(
            "extractionSuccessCard"
        );


    if (card) {

        card.style.display =
            "none";
    }
}


// =========================================================
// PARSED
// =========================================================

function showParsedBadge() {

    const badge =
        document.getElementById(
            "parsedSuccessfullyBadge"
        );


    if (badge) {

        badge.style.display =
            "flex";
    }
}


function hideParsedBadge() {

    const badge =
        document.getElementById(
            "parsedSuccessfullyBadge"
        );


    if (badge) {

        badge.style.display =
            "none";
    }
}


// =========================================================
// VIEW FULL
// =========================================================

function openFullResumePreview() {

    if (!latestResumeDetails) {

        alert(
            "Please upload and analyze a resume first."
        );

        return;
    }


    const text =
        String(
            latestResumeDetails?.extracted_text
            ||
            latestResumeDetails?.text
            ||
            ""
        ).trim();


    if (!text) {

        alert(
            "No extracted resume text available."
        );

        return;
    }


    const filename =
        latestAnalysis?.resume_filename
        ||
        latestResumeDetails?.original_filename
        ||
        latestResumeDetails?.filename
        ||
        "Resume";


    const popup =
        window.open(
            "",
            "_blank"
        );


    if (!popup) {

        alert(
            "Please allow browser popups."
        );

        return;
    }


    popup.document.write(
        `
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                ${escapeHTML(filename)}
            </title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    padding: 40px;

                    background: #f6f9fd;

                    font-family:
                        Arial,
                        sans-serif;
                }

                .resume-document {
                    max-width: 900px;

                    margin: auto;

                    padding: 45px;

                    border-radius: 14px;

                    background: #ffffff;

                    box-shadow:
                        0 10px 35px
                        rgba(
                            0,
                            0,
                            0,
                            0.08
                        );
                }

                .resume-logo {
                    margin-bottom: 20px;

                    color: #126df3;

                    font-size: 28px;

                    font-weight: 800;
                }

                h2 {
                    margin-bottom: 25px;

                    color: #172540;
                }

                pre {
                    margin: 0;

                    white-space: pre-wrap;

                    word-break: break-word;

                    color: #344e70;

                    font-family:
                        "Courier New",
                        monospace;

                    font-size: 14px;

                    line-height: 1.7;
                }

            </style>

        </head>

        <body>

            <div class="resume-document">

                <div class="resume-logo">
                    ResumeIQ
                </div>

                <h2>
                    ${escapeHTML(filename)}
                </h2>

                <pre>${escapeHTML(text)}</pre>

            </div>

        </body>

        </html>
        `
    );


    popup.document.close();
}


// =========================================================
// DATE
// =========================================================

function formatDate(
    value
) {

    const date =
        value instanceof Date
            ?
            value
            :
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

function formatFileSize(
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

        return "0 KB";
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
            2
        )
        +
        " MB"
    );
}


// =========================================================
// EXTENSION
// =========================================================

function getFileExtension(
    filename
) {

    const values =
        String(
            filename || ""
        )
        .split(".");


    if (
        values.length < 2
    ) {

        return "";
    }


    return values
        .pop()
        .toLowerCase();
}


// =========================================================
// JSON
// =========================================================

async function parseJSON(
    response
) {

    try {

        return await response.json();

    } catch (error) {

        return {};
    }
}


// =========================================================
// AUTH
// =========================================================

function handleAuthFailure(
    response
) {

    if (
        response.status !== 401
        &&
        response.status !== 403
    ) {

        return;
    }


    if (
        typeof logoutUser ===
        "function"
    ) {

        logoutUser();

        return;
    }


    window.location.replace(
        "../auth/login.html"
    );
}


// =========================================================
// ERROR
// =========================================================

function renderError(
    message
) {

    const container =
        document.getElementById(
            "extractedTextPreview"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    const paragraph =
        document.createElement(
            "p"
        );


    paragraph.textContent =
        message;


    paragraph.style.color =
        "#dc3545";


    container.appendChild(
        paragraph
    );
}


// =========================================================
// ESCAPE
// =========================================================

function escapeHTML(
    value
) {

    return String(
        value || ""
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