// =========================================================
// ResumeIQ - Candidate Resume Analysis
// Reference Dashboard Version
// =========================================================

const ANALYSIS_API_BASE_URL =
    "http://127.0.0.1:8000";


const SKILL_PREVIEW_LIMIT =
    10;


let currentAnalysis = null;

let currentResume = null;

let currentUser = null;

let scoreTrendChart = null;


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAnalysisPage();

        initializeAnalysisModal();

        initializeViewAllSkills();
    }
);


// =========================================================
// MAIN
// =========================================================

async function initializeAnalysisPage() {

    showLoadingState();


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


        currentUser =
            user;


        const role =
            String(
                user.role || ""
            )
            .trim()
            .toLowerCase();


        if (role !== "candidate") {

            redirectByRole(
                role
            );

            return;
        }


        if (
            typeof updateCandidateUserUI
            === "function"
        ) {

            updateCandidateUserUI(
                user
            );
        }


        const resumes =
            await getCandidateResumes();


        if (
            !Array.isArray(resumes)
            ||
            resumes.length === 0
        ) {

            showEmptyState(
                "No resume found. Upload and analyse your resume first."
            );

            return;
        }


        const result =
            await findLatestResumeAnalysis(
                resumes,
                token
            );


        if (!result) {

            showEmptyState(
                "No resume analysis found. Analyse your resume first."
            );

            return;
        }


        currentResume =
            result.resume;


        currentAnalysis =
            result.analysis;


        const resumeId =
            getResumeId(
                currentResume
            );


        if (resumeId) {

            sessionStorage.setItem(
                "resumeiq_current_resume_id",
                resumeId
            );
        }


        sessionStorage.setItem(
            "resumeiq_current_analysis",
            JSON.stringify(
                currentAnalysis
            )
        );


        renderAnalysisDashboard(
            currentAnalysis,
            currentResume,
            currentUser
        );


        showAnalysisContent();


    } catch (error) {

        console.error(
            "Analysis page error:",
            error
        );


        showEmptyState(
            error.message
            ||
            "Unable to load resume analysis."
        );
    }
}


// =========================================================
// FIND ANALYSIS
// =========================================================

async function findLatestResumeAnalysis(
    resumes,
    token
) {

    const selectedResumeId =
        sessionStorage.getItem(
            "resumeiq_current_resume_id"
        );


    const sorted =
        [...resumes].sort(
            function (
                first,
                second
            ) {

                return (
                    new Date(
                        second.uploaded_at || 0
                    )
                    -
                    new Date(
                        first.uploaded_at || 0
                    )
                );
            }
        );


    if (selectedResumeId) {

        const index =
            sorted.findIndex(
                resume =>
                    getResumeId(resume)
                    ===
                    selectedResumeId
            );


        if (index > 0) {

            const [selected] =
                sorted.splice(
                    index,
                    1
                );


            sorted.unshift(
                selected
            );
        }
    }


    for (
        const resume
        of sorted
    ) {

        const resumeId =
            getResumeId(
                resume
            );


        if (!resumeId) {

            continue;
        }


        const analysis =
            await fetchResumeAnalysis(
                resumeId,
                token
            );


        if (analysis) {

            return {
                resume,
                analysis
            };
        }
    }


    return null;
}


// =========================================================
// FETCH ANALYSIS
// =========================================================

async function fetchResumeAnalysis(
    resumeId,
    token
) {

    const response =
        await fetch(
            `${ANALYSIS_API_BASE_URL}/api/resumes/${encodeURIComponent(resumeId)}/analysis`,
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


    let data = {};


    try {

        data =
            await response.json();

    } catch (error) {

        data = {};
    }


    if (
        response.status === 404
    ) {

        return null;
    }


    if (
        response.status === 401
        ||
        response.status === 403
    ) {

        clearAuthData();


        window.location.replace(
            "../auth/login.html"
        );


        return null;
    }


    if (!response.ok) {

        throw new Error(
            data.detail
            ||
            data.message
            ||
            "Unable to retrieve resume analysis."
        );
    }


    return (
        data.analysis
        ||
        null
    );
}


// =========================================================
// RENDER DASHBOARD
// =========================================================

function renderAnalysisDashboard(
    analysis,
    resume,
    user
) {

    const resumeScore =
        calculateResumeScore(
            analysis
        );


    const atsReadiness =
        calculateATSReadiness(
            analysis
        );


    renderTopStatistics(
        analysis,
        resumeScore,
        atsReadiness
    );


    renderSkillsPreview(
        analysis.skills
    );


    renderResumeSections(
        analysis
    );


    renderStrengths(
        analysis
    );


    renderSuggestions(
        analysis
    );


    renderSkillEvidence(
        analysis
    );


    updateLocalScoreHistory(
        user,
        resume,
        analysis,
        resumeScore
    );


    renderResumeScoreTrend(
        user
    );
}


// =========================================================
// TOP CARDS
// =========================================================

function renderTopStatistics(
    analysis,
    resumeScore,
    atsReadiness
) {

    const skills =
        getArray(
            analysis.skills
        );


    setText(
        "resumeScoreValue",
        resumeScore
    );


    setText(
        "atsReadinessValue",
        atsReadiness
    );


    setText(
        "skillsFoundValue",
        skills.length
    );


    const sectionStatus =
        getCoreSectionStatus(
            analysis
        );


    const values =
        Object.values(
            sectionStatus
        );


    const found =
        values.filter(
            Boolean
        ).length;


    setText(
        "sectionCoverageValue",
        `${found} / ${values.length}`
    );


    if (
        found === values.length
    ) {

        setText(
            "sectionCoverageText",
            "All key sections are present."
        );

    } else {

        const missing =
            values.length
            -
            found;


        setText(
            "sectionCoverageText",
            `${missing} key section${missing === 1 ? "" : "s"} need attention.`
        );
    }
}


// =========================================================
// RESUME SCORE
// Pure Rule-Based Resume Score
// =========================================================

function calculateResumeScore(
    analysis
) {

    const possibleValues = [

        // Final backend field
        analysis?.resume_score,

        // Rule-based ATS score
        analysis?.ats_score?.rule_score,

        // Older fallback
        analysis?.score
    ];


    for (
        const value
        of possibleValues
    ) {

        const number =
            Number(
                value
            );


        if (
            !Number.isNaN(
                number
            )
        ) {

            return Math.round(
                clampPercentage(
                    number
                )
            );
        }
    }


    return 0;
}


// =========================================================
// ATS READINESS
// Hybrid Score = 70% Rule + 30% ML
// =========================================================

function calculateATSReadiness(
    analysis
) {

    const ml =
        analysis.ml_resume_quality
        ||
        {};


    const possibleValues = [

        analysis?.ats_readiness,

        analysis?.ats_score?.ats_readiness,

        analysis?.ats_score?.total_score,

        analysis?.ats_score?.percentage
    ];


    for (
        const value
        of possibleValues
    ) {

        const number =
            Number(
                value
            );


        if (
            !Number.isNaN(
                number
            )
        ) {

            return Math.round(
                clampPercentage(
                    number
                )
            );
        }
    }


    return Math.round(
        clampPercentage(
            probabilityToPercentage(
                ml?.confidence
            )
        )
    );
}


// =========================================================
// CORE SECTIONS
// =========================================================

function getCoreSectionStatus(
    analysis
) {

    const presence =
        analysis.section_presence
        ||
        {};


    const skills =
        getArray(
            analysis.skills
        );


    const projects =
        getArray(
            analysis.projects
        );


    const certifications =
        getArray(
            analysis.certifications
        );


    return {

        summary:
            Boolean(
                presence.summary
                ||
                String(
                    analysis.summary || ""
                ).trim()
            ),

        skills:
            Boolean(
                presence.skills
                ||
                skills.length > 0
            ),

        education:
            Boolean(
                presence.education
            ),

        projects:
            Boolean(
                presence.projects
                ||
                projects.length > 0
            ),

        certifications:
            Boolean(
                presence.certifications
                ||
                certifications.length > 0
            )
    };
}


// =========================================================
// DETECTED SKILLS PREVIEW
// Only first 10
// =========================================================

function renderSkillsPreview(
    skills
) {

    const container =
        document.getElementById(
            "analysisSkills"
        );


    const viewAllButton =
        document.getElementById(
            "skillsViewAllButton"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    const values =
        getArray(
            skills
        );


    if (
        values.length === 0
    ) {

        appendPlaceholder(
            container,
            "No skills detected."
        );


        if (
            viewAllButton
        ) {

            viewAllButton.style.display =
                "none";
        }


        return;
    }


    const preview =
        values.slice(
            0,
            SKILL_PREVIEW_LIMIT
        );


    preview.forEach(
        skill => {

            container.appendChild(
                createSkillChip(
                    skill
                )
            );
        }
    );


    if (
        viewAllButton
    ) {

        viewAllButton.style.display =
            values.length >
            SKILL_PREVIEW_LIMIT
                ?
                "inline-flex"
                :
                "none";
    }
}


// =========================================================
// VIEW ALL SKILLS
// =========================================================

function initializeViewAllSkills() {

    const button =
        document.getElementById(
            "skillsViewAllButton"
        );


    if (!button) {

        return;
    }


    button.addEventListener(
        "click",
        function () {

            if (!currentAnalysis) {

                return;
            }


            const skills =
                getArray(
                    currentAnalysis.skills
                );


            openAnalysisModal(
                "Detected Skills",
                "All extracted resume skills"
            );


            const body =
                document.getElementById(
                    "analysisModalBody"
                );


            body.innerHTML =
                "";


            const skillContainer =
                document.createElement(
                    "div"
                );


            skillContainer.className =
                "analysis-modal-skills";


            skills.forEach(
                skill => {

                    skillContainer.appendChild(
                        createSkillChip(
                            skill
                        )
                    );
                }
            );


            body.appendChild(
                skillContainer
            );
        }
    );
}


// =========================================================
// CREATE SKILL CHIP
// =========================================================

function createSkillChip(
    skill
) {

    const chip =
        document.createElement(
            "span"
        );


    chip.className =
        "analysis-skill-chip";


    chip.textContent =
        skill;


    return chip;
}


// =========================================================
// RESUME SECTIONS
// =========================================================

function renderResumeSections(
    analysis
) {

    const container =
        document.getElementById(
            "analysisSections"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    const skills =
        getArray(
            analysis.skills
        );


    const education =
        analysis.education
        ||
        {};


    const projects =
        getArray(
            analysis.projects
        );


    const certifications =
        getArray(
            analysis.certifications
        );


    const summaryExists =
        Boolean(
            String(
                analysis.summary || ""
            ).trim()
        );


    const educationCount =
        Math.max(
            getArray(
                education.degrees
            ).length,
            getArray(
                education.institutions
            ).length,
            analysis.section_presence
                ?.education
                ?
                1
                :
                0
        );


    const sections = [

        {
            key:
                "summary",

            label:
                "Summary",

            count:
                summaryExists
                    ?
                    1
                    :
                    0,

            icon:
                "bi-person",

            color:
                "blue"
        },

        {
            key:
                "skills",

            label:
                "Skills",

            count:
                skills.length,

            icon:
                "bi-lightning-charge",

            color:
                "purple"
        },

        {
            key:
                "education",

            label:
                "Education",

            count:
                educationCount,

            icon:
                "bi-mortarboard",

            color:
                "teal"
        },

        {
            key:
                "projects",

            label:
                "Projects",

            count:
                projects.length,

            icon:
                "bi-briefcase",

            color:
                "red"
        },

        {
            key:
                "certifications",

            label:
                "Certifications",

            count:
                certifications.length,

            icon:
                "bi-patch-check",

            color:
                "orange"
        }
    ];


    sections.forEach(
        section => {

            const row =
                document.createElement(
                    "button"
                );


            row.type =
                "button";


            row.className =
                "analysis-section-row";


            row.innerHTML = `

                <div class="analysis-section-left">

                    <div class="analysis-section-icon ${section.color}">

                        <i class="bi ${section.icon}"></i>

                    </div>

                    <span class="analysis-section-label">
                        ${section.label}
                    </span>

                </div>


                <div class="analysis-section-right">

                    <span class="analysis-section-count">
                        ${section.count}
                    </span>

                    <i class="bi bi-chevron-right"></i>

                </div>
            `;


            row.addEventListener(
                "click",
                function () {

                    openSectionDetails(
                        section.key,
                        analysis
                    );
                }
            );


            container.appendChild(
                row
            );
        }
    );
}


// =========================================================
// OPEN SECTION DETAILS
// =========================================================

function openSectionDetails(
    sectionKey,
    analysis
) {

    if (
        sectionKey === "summary"
    ) {

        openSummarySection(
            analysis
        );

        return;
    }


    if (
        sectionKey === "skills"
    ) {

        openSkillsSection(
            analysis
        );

        return;
    }


    if (
        sectionKey === "education"
    ) {

        openEducationSection(
            analysis
        );

        return;
    }


    if (
        sectionKey === "projects"
    ) {

        openProjectsSection(
            analysis
        );

        return;
    }


    if (
        sectionKey === "certifications"
    ) {

        openCertificationSection(
            analysis
        );
    }
}


// =========================================================
// SUMMARY MODAL
// =========================================================

function openSummarySection(
    analysis
) {

    openAnalysisModal(
        "Professional Summary",
        "Resume Section"
    );


    const body =
        document.getElementById(
            "analysisModalBody"
        );


    body.innerHTML =
        "";


    const summary =
        String(
            analysis.summary || ""
        ).trim();


    if (!summary) {

        appendModalEmpty(
            body,
            "No professional summary detected."
        );

        return;
    }


    const paragraph =
        document.createElement(
            "p"
        );


    paragraph.className =
        "analysis-modal-summary";


    paragraph.textContent =
        summary;


    body.appendChild(
        paragraph
    );
}


// =========================================================
// SKILL MODAL
// =========================================================

function openSkillsSection(
    analysis
) {

    openAnalysisModal(
        "Skills",
        "Resume Section"
    );


    const body =
        document.getElementById(
            "analysisModalBody"
        );


    body.innerHTML =
        "";


    const skills =
        getArray(
            analysis.skills
        );


    if (
        skills.length === 0
    ) {

        appendModalEmpty(
            body,
            "No skills detected."
        );

        return;
    }


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "analysis-modal-skills";


    skills.forEach(
        skill => {

            container.appendChild(
                createSkillChip(
                    skill
                )
            );
        }
    );


    body.appendChild(
        container
    );
}


// =========================================================
// EDUCATION MODAL
// =========================================================

function openEducationSection(
    analysis
) {

    openAnalysisModal(
        "Education",
        "Resume Section"
    );


    const body =
        document.getElementById(
            "analysisModalBody"
        );


    body.innerHTML =
        "";


    const education =
        analysis.education
        ||
        {};


    const details = [

        [
            "Degrees",
            joinValues(
                education.degrees
            )
        ],

        [
            "Institutions",
            joinValues(
                education.institutions
            )
        ],

        [
            "Study Period",
            joinValues(
                education.year_ranges
            )
        ],

        [
            "CGPA",
            joinValues(
                education.cgpa
            )
        ],

        [
            "Percentage",
            formatPercentages(
                education.percentages
            )
        ],

        [
            "Currently Studying",
            education.ongoing
                ?
                "Yes"
                :
                "No"
        ]
    ];


    const useful =
        details.filter(
            item =>
                item[1]
                &&
                item[1] !== "-"
        );


    if (
        useful.length === 0
    ) {

        appendModalEmpty(
            body,
            "No education details detected."
        );

        return;
    }


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "analysis-modal-grid";


    useful.forEach(
        item => {

            grid.appendChild(
                createModalDetail(
                    item[0],
                    item[1]
                )
            );
        }
    );


    body.appendChild(
        grid
    );
}


// =========================================================
// PROJECT MODAL
// =========================================================

function openProjectsSection(
    analysis
) {

    openAnalysisModal(
        "Projects",
        "Resume Section"
    );


    const body =
        document.getElementById(
            "analysisModalBody"
        );


    body.innerHTML =
        "";


    const projects =
        getArray(
            analysis.projects
        );


    if (
        projects.length === 0
    ) {

        appendModalEmpty(
            body,
            "No projects detected."
        );

        return;
    }


    projects.forEach(
        project => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "analysis-modal-project";


            const title =
                document.createElement(
                    "h4"
                );


            title.textContent =
                project?.title
                ||
                "Project";


            item.appendChild(
                title
            );


            if (
                project?.description
            ) {

                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    project.description;


                item.appendChild(
                    description
                );
            }


            body.appendChild(
                item
            );
        }
    );
}


// =========================================================
// CERTIFICATION MODAL
// =========================================================

function openCertificationSection(
    analysis
) {

    openAnalysisModal(
        "Certifications",
        "Resume Section"
    );


    const body =
        document.getElementById(
            "analysisModalBody"
        );


    body.innerHTML =
        "";


    const certifications =
        getArray(
            analysis.certifications
        );


    if (
        certifications.length === 0
    ) {

        appendModalEmpty(
            body,
            "No certifications detected."
        );

        return;
    }


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "analysis-modal-grid";


    certifications.forEach(
        certification => {

            const value =
                typeof certification
                ===
                "string"
                    ?
                    certification
                    :
                    JSON.stringify(
                        certification
                    );


            grid.appendChild(
                createModalDetail(
                    "Certification",
                    value
                )
            );
        }
    );


    body.appendChild(
        grid
    );
}


// =========================================================
// STRENGTHS
// =========================================================

function renderStrengths(
    analysis
) {

    const container =
        document.getElementById(
            "analysisStrengths"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    const skills =
        getArray(
            analysis.skills
        );


    const projects =
        getArray(
            analysis.projects
        );


    const certifications =
        getArray(
            analysis.certifications
        );


    const strengths = [];


    if (
        skills.length >= 3
    ) {

        const topSkills =
            skills
            .slice(
                0,
                3
            )
            .join(", ");


        strengths.push(
            `Strong technical skill set (${topSkills})`
        );
    }


    if (
        projects.length > 0
    ) {

        strengths.push(
            "Relevant project experience"
        );
    }


    if (
        String(
            analysis.summary || ""
        ).trim()
    ) {

        strengths.push(
            "Clear and concise resume summary"
        );
    }


    if (
        analysis.section_presence
        ?.education
    ) {

        strengths.push(
            "Education information is clearly structured"
        );
    }


    const coverage =
        Object.values(
            getCoreSectionStatus(
                analysis
            )
        );


    if (
        coverage.every(
            Boolean
        )
    ) {

        strengths.push(
            "Complete key section coverage"
        );
    }


    if (
        certifications.length > 0
        &&
        strengths.length < 5
    ) {

        strengths.push(
            "Relevant certifications included"
        );
    }


    if (
        strengths.length === 0
    ) {

        strengths.push(
            "Continue adding relevant resume evidence"
        );
    }


    strengths
        .slice(
            0,
            5
        )
        .forEach(
            text => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "analysis-strength-item";


                const check =
                    document.createElement(
                        "span"
                    );


                check.className =
                    "analysis-strength-check";


                check.innerHTML =
                    `<i class="bi bi-check"></i>`;


                const label =
                    document.createElement(
                        "span"
                    );


                label.textContent =
                    text;


                row.appendChild(
                    check
                );


                row.appendChild(
                    label
                );


                container.appendChild(
                    row
                );
            }
        );
}


// =========================================================
// SUGGESTIONS
// =========================================================

function renderSuggestions(
    analysis
) {

    const container =
        document.getElementById(
            "analysisSuggestions"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    const suggestions = [];


    const presence =
        analysis.section_presence
        ||
        {};


    const achievements =
        getArray(
            analysis.achievements
        );


    if (
        !presence.achievements
        ||
        achievements.length === 0
    ) {

        suggestions.push({

            title:
                "Add more quantifiable achievements",

            description:
                "Show genuine measurable results where they are available."
        });
    }


    if (
        !presence.experience
    ) {

        suggestions.push({

            title:
                "Add experience or internship evidence",

            description:
                "Include responsibilities and practical outcomes if applicable."
        });
    }


    if (
        !presence.summary
    ) {

        suggestions.push({

            title:
                "Add a professional summary",

            description:
                "Include a concise overview of your strongest skills and target role."
        });
    }


    if (
        suggestions.length < 3
    ) {

        suggestions.push({

            title:
                "Include more industry-specific keywords",

            description:
                "Prioritize terminology relevant to your target job role."
        });
    }


    if (
        suggestions.length < 3
    ) {

        suggestions.push({

            title:
                "Expand project impact and outcomes",

            description:
                "Explain your contribution and measurable project results."
        });
    }


    suggestions
        .slice(
            0,
            3
        )
        .forEach(
            (
                suggestion,
                index
            ) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "analysis-suggestion-item";


                const number =
                    document.createElement(
                        "div"
                    );


                number.className =
                    "analysis-suggestion-number";


                number.textContent =
                    index + 1;


                const text =
                    document.createElement(
                        "div"
                    );


                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    suggestion.title;


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    suggestion.description;


                text.appendChild(
                    title
                );


                text.appendChild(
                    description
                );


                row.appendChild(
                    number
                );


                row.appendChild(
                    text
                );


                container.appendChild(
                    row
                );
            }
        );
}


// =========================================================
// SKILL EVIDENCE
// =========================================================

function renderSkillEvidence(
    analysis
) {

    const container =
        document.getElementById(
            "analysisSkillEvidence"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    let evidence =
        getArray(
            analysis.skill_evidence
        );


    if (
        evidence.length === 0
    ) {

        const skills =
            getArray(
                analysis.skills
            );


        evidence =
            skills
            .slice(
                0,
                3
            )
            .map(
                skill => ({

                    skill:
                        skill,

                    found_in:
                        [],

                    evidence_count:
                        1
                })
            );
    }


    if (
        evidence.length === 0
    ) {

        appendPlaceholder(
            container,
            "No skill evidence available."
        );

        return;
    }


    evidence
        .sort(
            (
                first,
                second
            ) =>
                Number(
                    second?.evidence_count || 0
                )
                -
                Number(
                    first?.evidence_count || 0
                )
        )
        .slice(
            0,
            3
        )
        .forEach(
            itemData => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "analysis-evidence-item";


                const icon =
                    document.createElement(
                        "div"
                    );


                icon.className =
                    "analysis-evidence-icon";


                icon.innerHTML =
                    `<i class="bi bi-search"></i>`;


                const content =
                    document.createElement(
                        "div"
                    );


                content.className =
                    "analysis-evidence-content";


                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    itemData?.skill
                    ||
                    "Skill";


                const tags =
                    document.createElement(
                        "div"
                    );


                tags.className =
                    "analysis-evidence-tags";


                const foundIn =
                    getArray(
                        itemData?.found_in
                    );


                foundIn.forEach(
                    location => {

                        const tag =
                            document.createElement(
                                "span"
                            );


                        tag.textContent =
                            capitalizeWords(
                                location
                            );


                        tags.appendChild(
                            tag
                        );
                    }
                );


                const description =
                    document.createElement(
                        "p"
                    );


                const count =
                    Number(
                        itemData?.evidence_count
                        ||
                        1
                    );


                description.textContent =
                    foundIn.length > 0
                        ?
                        `Detected ${count} time${count === 1 ? "" : "s"} across your resume.`
                        :
                        "Detected in resume content.";


                content.appendChild(
                    title
                );


                if (
                    foundIn.length > 0
                ) {

                    content.appendChild(
                        tags
                    );
                }


                content.appendChild(
                    description
                );


                row.appendChild(
                    icon
                );


                row.appendChild(
                    content
                );


                container.appendChild(
                    row
                );
            }
        );
}


// =========================================================
// SCORE HISTORY
// Store actual Resume Scores seen in browser
// =========================================================

function updateLocalScoreHistory(
    user,
    resume,
    analysis,
    score
) {

    const key =
        getScoreHistoryKey(
            user
        );


    let history =
        loadScoreHistory(
            key
        );


    const resumeId =
        getResumeId(
            resume
        )
        ||
        analysis.resume_id
        ||
        "unknown";


    const date =
        analysis.analyzed_at
        ||
        resume?.uploaded_at
        ||
        new Date().toISOString();


    const existingIndex =
        history.findIndex(
            item =>
                item.resume_id
                ===
                resumeId
        );


    const record = {

        resume_id:
            resumeId,

        score:
            score,

        date:
            date
    };


    if (
        existingIndex >= 0
    ) {

        history[
            existingIndex
        ] =
            record;

    } else {

        history.push(
            record
        );
    }


    history =
        history
        .sort(
            (
                first,
                second
            ) =>
                new Date(
                    first.date
                )
                -
                new Date(
                    second.date
                )
        )
        .slice(
            -20
        );


    localStorage.setItem(
        key,
        JSON.stringify(
            history
        )
    );
}


// =========================================================
// SCORE TREND CHART
// =========================================================

function renderResumeScoreTrend(
    user
) {

    const canvas =
        document.getElementById(
            "resumeScoreTrendChart"
        );


    if (
        !canvas
        ||
        typeof Chart === "undefined"
    ) {

        return;
    }


    const history =
        loadScoreHistory(
            getScoreHistoryKey(
                user
            )
        )
        .slice(
            -7
        );


    const labels =
        history.map(
            item => {

                const date =
                    new Date(
                        item.date
                    );


                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {

                    return "Analysis";
                }


                return date.toLocaleDateString(
                    "en-IN",
                    {
                        day:
                            "2-digit",

                        month:
                            "short"
                    }
                );
            }
        );


    const values =
        history.map(
            item =>
                Number(
                    item.score
                )
                ||
                0
        );


    if (
        scoreTrendChart
    ) {

        scoreTrendChart.destroy();
    }


    scoreTrendChart =
        new Chart(
            canvas,
            {
                type:
                    "line",

                data: {

                    labels:
                        labels,

                    datasets: [

                        {
                            label:
                                "Resume Score",

                            data:
                                values,

                            borderColor:
                                "#176ff2",

                            backgroundColor:
                                "rgba(23, 111, 242, 0.09)",

                            borderWidth:
                                2,

                            tension:
                                0.35,

                            pointRadius:
                                3,

                            pointHoverRadius:
                                5,

                            pointBackgroundColor:
                                "#176ff2",

                            fill:
                                true
                        }
                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        intersect:
                            false,

                        mode:
                            "index"
                    },

                    plugins: {

                        legend: {

                            display:
                                false
                        },

                        tooltip: {

                            displayColors:
                                false,

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return `Score: ${context.parsed.y}`;
                                    }
                            }
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            max:
                                100,

                            ticks: {

                                stepSize:
                                    20,

                                color:
                                    "#71829b",

                                font: {

                                    size:
                                        9
                                }
                            },

                            grid: {

                                color:
                                    "#edf1f5"
                            },

                            border: {

                                display:
                                    false
                            }
                        },

                        x: {

                            ticks: {

                                color:
                                    "#71829b",

                                font: {

                                    size:
                                        9
                                }
                            },

                            grid: {

                                color:
                                    "#f0f3f7"
                            },

                            border: {

                                display:
                                    false
                            }
                        }
                    }
                }
            }
        );
}


// =========================================================
// SCORE HISTORY HELPERS
// =========================================================

function getScoreHistoryKey(
    user
) {

    const identity =
        user?._id
        ||
        user?.id
        ||
        user?.email
        ||
        "candidate";


    return (
        "resumeiq_score_history_"
        +
        String(
            identity
        )
        .replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
        )
    );
}


function loadScoreHistory(
    key
) {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(
                    key
                )
                ||
                "[]"
            );


        return Array.isArray(
            value
        )
            ?
            value
            :
            [];

    } catch (error) {

        return [];
    }
}


// =========================================================
// MODAL
// =========================================================

function initializeAnalysisModal() {

    const modal =
        document.getElementById(
            "analysisDetailModal"
        );


    const close =
        document.getElementById(
            "analysisModalClose"
        );


    const backdrop =
        modal?.querySelector(
            ".analysis-modal-backdrop"
        );


    if (
        close
    ) {

        close.addEventListener(
            "click",
            closeAnalysisModal
        );
    }


    if (
        backdrop
    ) {

        backdrop.addEventListener(
            "click",
            closeAnalysisModal
        );
    }


    document.addEventListener(
        "keydown",
        function (
            event
        ) {

            if (
                event.key === "Escape"
            ) {

                closeAnalysisModal();
            }
        }
    );
}


function openAnalysisModal(
    title,
    eyebrow
) {

    const modal =
        document.getElementById(
            "analysisDetailModal"
        );


    if (!modal) {

        return;
    }


    setText(
        "analysisModalTitle",
        title
    );


    setText(
        "analysisModalEyebrow",
        eyebrow
    );


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";
}


function closeAnalysisModal() {

    const modal =
        document.getElementById(
            "analysisDetailModal"
        );


    if (!modal) {

        return;
    }


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";
}


// =========================================================
// MODAL HELPERS
// =========================================================

function createModalDetail(
    label,
    value
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "analysis-modal-detail";


    const labelElement =
        document.createElement(
            "span"
        );


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            "strong"
        );


    valueElement.textContent =
        value;


    item.appendChild(
        labelElement
    );


    item.appendChild(
        valueElement
    );


    return item;
}


function appendModalEmpty(
    parent,
    message
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "analysis-modal-empty";


    element.textContent =
        message;


    parent.appendChild(
        element
    );
}


// =========================================================
// GENERAL HELPERS
// =========================================================

function getResumeId(
    resume
) {

    if (!resume) {

        return null;
    }


    const value =
        resume.resume_id
        ||
        resume.id
        ||
        resume._id;


    if (!value) {

        return null;
    }


    if (
        typeof value === "object"
        &&
        value.$oid
    ) {

        return String(
            value.$oid
        );
    }


    return String(
        value
    );
}


function getArray(
    value
) {

    return Array.isArray(
        value
    )
        ?
        value
        :
        [];
}


function probabilityToPercentage(
    value
) {

    const number =
        Number(
            value
        );


    if (
        Number.isNaN(
            number
        )
    ) {

        return 0;
    }


    if (
        number >= 0
        &&
        number <= 1
    ) {

        return (
            number * 100
        );
    }


    return number;
}


function clampPercentage(
    value
) {

    return Math.max(
        0,
        Math.min(
            100,
            Number(
                value
            )
            ||
            0
        )
    );
}


function joinValues(
    value
) {

    if (
        Array.isArray(
            value
        )
    ) {

        const cleaned =
            value.filter(
                item =>
                    item !== null
                    &&
                    item !== undefined
                    &&
                    String(
                        item
                    ).trim() !== ""
            );


        return cleaned.length
            ?
            cleaned.join(
                ", "
            )
            :
            "-";
    }


    if (
        value === null
        ||
        value === undefined
    ) {

        return "-";
    }


    return (
        String(
            value
        ).trim()
        ||
        "-"
    );
}


function formatPercentages(
    values
) {

    if (
        !Array.isArray(
            values
        )
    ) {

        return joinValues(
            values
        );
    }


    const clean =
        values
        .filter(
            value =>
                value !== null
                &&
                value !== undefined
                &&
                String(
                    value
                ).trim() !== ""
        )
        .map(
            value =>
                `${value}%`
        );


    return clean.length
        ?
        clean.join(
            ", "
        )
        :
        "-";
}


function capitalizeWords(
    value
) {

    return String(
        value || ""
    )
    .replace(
        /_/g,
        " "
    )
    .replace(
        /\b\w/g,
        character =>
            character.toUpperCase()
    );
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.textContent =
            value;
    }
}


function appendPlaceholder(
    parent,
    message
) {

    const element =
        document.createElement(
            "span"
        );


    element.className =
        "analysis-modal-empty";


    element.textContent =
        message;


    parent.appendChild(
        element
    );
}


// =========================================================
// PAGE STATES
// =========================================================

function showLoadingState() {

    const loading =
        document.getElementById(
            "analysisLoadingState"
        );


    const empty =
        document.getElementById(
            "analysisEmptyState"
        );


    const content =
        document.getElementById(
            "analysisContent"
        );


    if (
        loading
    ) {

        loading.style.display =
            "flex";
    }


    if (
        empty
    ) {

        empty.style.display =
            "none";
    }


    if (
        content
    ) {

        content.style.display =
            "none";
    }
}


function showEmptyState(
    message
) {

    const loading =
        document.getElementById(
            "analysisLoadingState"
        );


    const empty =
        document.getElementById(
            "analysisEmptyState"
        );


    const content =
        document.getElementById(
            "analysisContent"
        );


    if (
        loading
    ) {

        loading.style.display =
            "none";
    }


    if (
        content
    ) {

        content.style.display =
            "none";
    }


    if (
        empty
    ) {

        empty.style.display =
            "flex";


        const paragraph =
            empty.querySelector(
                "p"
            );


        if (
            paragraph
            &&
            message
        ) {

            paragraph.textContent =
                message;
        }
    }
}


function showAnalysisContent() {

    const loading =
        document.getElementById(
            "analysisLoadingState"
        );


    const empty =
        document.getElementById(
            "analysisEmptyState"
        );


    const content =
        document.getElementById(
            "analysisContent"
        );


    if (
        loading
    ) {

        loading.style.display =
            "none";
    }


    if (
        empty
    ) {

        empty.style.display =
            "none";
    }


    if (
        content
    ) {

        content.style.display =
            "block";
    }
}


// =========================================================
// GLOBAL
// =========================================================

window.reloadResumeAnalysis =
    initializeAnalysisPage;