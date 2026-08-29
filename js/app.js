/* =========================================================
   GitHub Developer Analyzer
   app.js — Main Application Controller
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {

        API_BASE_URL: "/api",

        ENDPOINTS: {
            ANALYZE: "/analyze"
        },

        DEFAULT_ERROR:
            "Unable to analyze this GitHub profile."

    };


    /* =====================================================
       DOM
    ===================================================== */

    const elements = {

        form:
            document.getElementById("github-form"),

        githubUrl:
            document.getElementById("github-url"),

        analyzeBtn:
            document.getElementById("analyze-btn"),

        clearSearch:
            document.getElementById("clear-search"),

        refreshAnalysis:
            document.getElementById("refresh-analysis"),

        analysisStatus:
            document.getElementById("analysis-status"),

        apiStatus:
            document.getElementById("api-status"),

        footerApiStatus:
            document.getElementById("footer-api-status"),

        loadingOverlay:
            document.getElementById("loading-overlay"),

        loadingText:
            document.getElementById("loading-text"),

        errorModal:
            document.getElementById("error-modal"),

        errorMessage:
            document.getElementById("error-message"),

        closeError:
            document.getElementById("close-error"),

        retryAnalysis:
            document.getElementById("retry-analysis"),

        developerProfile:
            document.getElementById("developer-profile"),

        chatProfile:
            document.getElementById("chat-profile"),

        chatSkills:
            document.getElementById("chat-skills"),

        chatActivity:
            document.getElementById("chat-activity"),

        chatEvidence:
            document.getElementById("chat-evidence"),

        chatRating:
            document.getElementById("chat-rating"),

        profileAnalysis:
            document.getElementById("profile-analysis"),

        skillsAnalysis:
            document.getElementById("skills-analysis"),

        activityAnalysis:
            document.getElementById("activity-analysis"),

        evidenceAnalysis:
            document.getElementById("evidence-analysis"),

        ratingAnalysis:
            document.getElementById("rating-analysis"),

        repositoryList:
            document.getElementById("repository-list"),

        repoCount:
            document.getElementById("repo-count")

    };


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        username: null,

        profileUrl: null,

        data: null,

        repositories: [],

        analyzing: false,

        lastRequest: null

    };


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function init() {

        if (!elements.form) {
            console.error(
                "GitHub Developer Analyzer: form not found."
            );

            return;
        }


        bindEvents();

        setApiStatus(
            "Ready",
            true
        );

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

        elements.form.addEventListener(
            "submit",
            handleSubmit
        );


        if (elements.clearSearch) {

            elements.clearSearch.addEventListener(
                "click",
                clearSearch
            );

        }


        if (elements.refreshAnalysis) {

            elements.refreshAnalysis.addEventListener(
                "click",
                refreshAnalysis
            );

        }


        if (elements.closeError) {

            elements.closeError.addEventListener(
                "click",
                hideError
            );

        }


        if (elements.retryAnalysis) {

            elements.retryAnalysis.addEventListener(
                "click",
                retryAnalysis
            );

        }


        /*
         * Enter key
         */

        elements.githubUrl.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    elements.form.requestSubmit();

                }

            }
        );

    }


    /* =====================================================
       FORM SUBMIT
    ===================================================== */

    async function handleSubmit(event) {

        event.preventDefault();


        const input =
            elements.githubUrl.value.trim();


        const username =
            extractUsername(input);


        if (!username) {

            showError(
                "Please enter a valid GitHub profile URL."
            );

            return;

        }


        await analyzeDeveloper(username);

    }


    /* =====================================================
       EXTRACT GITHUB USERNAME
    ===================================================== */

    function extractUsername(value) {

        if (!value) {
            return null;
        }


        value = value.trim();


        /*
         * Allow:
         *
         * github.com/user
         * https://github.com/user
         * http://github.com/user
         */

        let url;


        try {

            if (
                !value.startsWith("http://") &&
                !value.startsWith("https://")
            ) {

                value =
                    "https://" + value;

            }


            url = new URL(value);

        } catch {

            return null;

        }


        if (
            url.hostname.toLowerCase() !==
            "github.com"
        ) {

            return null;

        }


        const parts =
            url.pathname
                .split("/")
                .filter(Boolean);


        if (!parts.length) {
            return null;
        }


        const username =
            parts[0];


        /*
         * GitHub username basic validation
         */

        if (
            username.length > 39 ||
            !/^[a-zA-Z0-9-]+$/.test(username)
        ) {

            return null;

        }


        return username;

    }


    /* =====================================================
       ANALYZE DEVELOPER
    ===================================================== */

    async function analyzeDeveloper(username) {

        if (state.analyzing) {
            return;
        }


        state.analyzing = true;

        state.username = username;

        state.profileUrl =
            `https://github.com/${username}`;


        state.lastRequest = username;


        setLoading(true);

        hideError();

        resetAnalysis();

        setAnalysisStatus(
            "Connecting to GitHub..."
        );


        try {

            /*
             * Backend endpoint
             */

            const response =
                await fetch(
                    `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.ANALYZE}/${encodeURIComponent(username)}`,
                    {
                        method: "GET",

                        headers: {
                            "Accept":
                                "application/json"
                        },

                        cache: "no-store"
                    }
                );


            const data =
                await parseResponse(response);


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    data?.error ||
                    CONFIG.DEFAULT_ERROR
                );

            }


            if (!data) {

                throw new Error(
                    "Empty response received from server."
                );

            }


            state.data = data;


            state.repositories =
                Array.isArray(data.repositories)
                    ? data.repositories
                    : [];


            /*
             * Render
             */

            renderDeveloper(data);

            renderRepositories(
                state.repositories
            );


            setAnalysisStatus(
                "Analysis completed"
            );


            setApiStatus(
                "Connected",
                true
            );

        } catch (error) {

            console.error(
                "GitHub Analysis Error:",
                error
            );


            handleAnalysisError(
                error
            );

        } finally {

            state.analyzing = false;

            setLoading(false);

        }

    }


    /* =====================================================
       RESPONSE PARSER
    ===================================================== */

    async function parseResponse(response) {

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            return await response.json();

        }


        const text =
            await response.text();


        return {
            message: text || CONFIG.DEFAULT_ERROR
        };

    }


    /* =====================================================
       DEVELOPER RENDER
    ===================================================== */

    function renderDeveloper(data) {

        const profile =
            data.profile ||
            data.user ||
            data.developer ||
            {};


        /*
         * Profile header
         */

        if (
            elements.developerProfile
        ) {

            elements.developerProfile.classList
                .remove("empty-state");


            elements.developerProfile.innerHTML = `

                <div class="developer-card">

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:10px;
                        "
                    >

                        ${
                            profile.avatar_url
                                ? `
                                    <img
                                        src="${escapeAttribute(
                                            profile.avatar_url
                                        )}"
                                        alt="${escapeAttribute(
                                            profile.login || "GitHub"
                                        )}"
                                        width="48"
                                        height="48"
                                        style="
                                            border-radius:50%;
                                            border:1px solid var(--border);
                                        "
                                    >
                                  `
                                : `
                                    <div class="empty-icon">
                                        GH
                                    </div>
                                  `
                        }

                        <div>

                            <strong>
                                ${escapeHTML(
                                    profile.name ||
                                    profile.login ||
                                    state.username
                                )}
                            </strong>

                            <div
                                style="
                                    margin-top:3px;
                                    color:var(--muted);
                                    font-size:11px;
                                "
                            >
                                @${escapeHTML(
                                    profile.login ||
                                    state.username
                                )}
                            </div>

                        </div>

                    </div>

                </div>

            `;

        }


        /*
         * Profile analysis
         */

        if (elements.profileAnalysis) {

            elements.profileAnalysis.innerHTML =
                createProfileAnalysis(
                    profile,
                    data
                );

            show(
                elements.chatProfile
            );

        }


        /*
         * Skills
         */

        if (elements.skillsAnalysis) {

            elements.skillsAnalysis.innerHTML =
                createSkillsAnalysis(
                    data
                );

            show(
                elements.chatSkills
            );

        }


        /*
         * Activity
         */

        if (elements.activityAnalysis) {

            elements.activityAnalysis.innerHTML =
                createActivityAnalysis(
                    data
                );

            show(
                elements.chatActivity
            );

        }


        /*
         * Evidence
         */

        if (elements.evidenceAnalysis) {

            elements.evidenceAnalysis.innerHTML =
                createEvidenceAnalysis(
                    data
                );

            show(
                elements.chatEvidence
            );

        }


        /*
         * Rating
         */

        if (elements.ratingAnalysis) {

            elements.ratingAnalysis.innerHTML =
                createRatingAnalysis(
                    data
                );

            show(
                elements.chatRating
            );

        }

    }


    /* =====================================================
       PROFILE ANALYSIS
    ===================================================== */

    function createProfileAnalysis(
        profile,
        data
    ) {

        const rows = [

            [
                "Username",
                profile.login || state.username
            ],

            [
                "Repositories",
                profile.public_repos ??
                data.repositories?.length ??
                0
            ],

            [
                "Followers",
                profile.followers ?? "Not Verifiable"
            ],

            [
                "Following",
                profile.following ?? "Not Verifiable"
            ],

            [
                "Public Gists",
                profile.public_gists ?? "Not Verifiable"
            ]

        ];


        return rows.map(
            createAnalysisRow
        ).join("");

    }


    /* =====================================================
       SKILLS ANALYSIS
    ===================================================== */

    function createSkillsAnalysis(data) {

        const skills =
            data.skills ||
            data.technologies ||
            [];


        if (!Array.isArray(skills)) {

            return `
                <div class="analysis-row">
                    <span class="analysis-label">
                        Skills
                    </span>

                    <span class="analysis-value">
                        Not Verifiable
                    </span>
                </div>
            `;

        }


        if (!skills.length) {

            return `
                <div class="analysis-row">
                    <span class="analysis-label">
                        Technical Skills
                    </span>

                    <span class="analysis-value">
                        Not Verifiable
                    </span>
                </div>
            `;

        }


        return skills
            .slice(0, 20)
            .map(
                skill => `
                    <div class="analysis-row">
                        <span class="analysis-label">
                            ${escapeHTML(
                                skill.name ||
                                skill.language ||
                                skill
                            )}
                        </span>

                        <span class="analysis-value">
                            ${
                                skill.confidence ??
                                skill.score ??
                                "Detected"
                            }
                        </span>
                    </div>
                `
            )
            .join("");

    }


    /* =====================================================
       ACTIVITY ANALYSIS
    ===================================================== */

    function createActivityAnalysis(data) {

        const activity =
            data.activity ||
            {};


        const rows = [

            [
                "Commits",
                activity.commits ??
                data.commit_count ??
                "Not Verifiable"
            ],

            [
                "Active Projects",
                activity.active_projects ??
                "Not Verifiable"
            ],

            [
                "Old Projects",
                activity.old_projects ??
                "Not Verifiable"
            ],

            [
                "Contributions",
                activity.contributions ??
                "Not Verifiable"
            ],

            [
                "Consistency",
                activity.consistency ??
                "Not Verifiable"
            ]

        ];


        return rows.map(
            createAnalysisRow
        ).join("");

    }


    /* =====================================================
       EVIDENCE ANALYSIS
    ===================================================== */

    function createEvidenceAnalysis(data) {

        const evidence =
            data.evidence ||
            data.claims ||
            {};


        const rows = [

            [
                "Supported Claims",
                evidence.supported ??
                "Not Verifiable"
            ],

            [
                "Partially Supported",
                evidence.partial ??
                "Not Verifiable"
            ],

            [
                "Unsupported",
                evidence.unsupported ??
                "Not Verifiable"
            ],

            [
                "Not Verifiable",
                evidence.not_verifiable ??
                "Not Verifiable"
            ]

        ];


        return rows.map(
            createAnalysisRow
        ).join("");

    }


    /* =====================================================
       RATING ANALYSIS
    ===================================================== */

    function createRatingAnalysis(data) {

        const rating =
            data.rating ||
            data.score ||
            {};


        const overall =
            typeof rating === "object"
                ? rating.overall
                : rating;


        const level =
            data.level ||
            data.developer_level ||
            rating.level ||
            "Not Verifiable";


        let html = `

            <div
                style="
                    margin-bottom:10px;
                    text-align:center;
                "
            >

                <div
                    style="
                        font-size:28px;
                        font-weight:800;
                        color:var(--text);
                    "
                >
                    ${
                        overall ??
                        "N/A"
                    }
                </div>

                <div
                    style="
                        color:var(--muted);
                        font-size:10px;
                    "
                >
                    Overall Rating
                </div>

            </div>

            <div class="analysis-row">

                <span class="analysis-label">
                    Developer Level
                </span>

                <span class="analysis-value">
                    ${escapeHTML(
                        level
                    )}
                </span>

            </div>

        `;


        const dimensions =
            typeof rating === "object"
                ? rating
                : {};


        Object.entries(
            dimensions
        ).forEach(
            ([key, value]) => {

                if (
                    key === "overall" ||
                    key === "level"
                ) {
                    return;
                }


                html += `

                    <div class="analysis-row">

                        <span class="analysis-label">
                            ${escapeHTML(
                                formatLabel(key)
                            )}
                        </span>

                        <span class="analysis-value">
                            ${escapeHTML(
                                value
                            )}
                        </span>

                    </div>

                `;

            }
        );


        return html;

    }


    /* =====================================================
       REPOSITORIES
    ===================================================== */

    function renderRepositories(
        repositories
    ) {

        if (!elements.repositoryList) {
            return;
        }


        elements.repositoryList.innerHTML = "";


        if (!Array.isArray(repositories) ||
            !repositories.length) {

            elements.repositoryList.innerHTML = `

                <div class="repo-empty">

                    <div class="empty-icon">
                        📂
                    </div>

                    <h3>
                        No repositories
                    </h3>

                    <p>
                        No accessible repositories
                        were returned by the API.
                    </p>

                </div>

            `;

            updateRepoCount(0);

            return;

        }


        /*
         * Repository.js can provide
         * advanced rendering.
         */

        if (
            typeof window.renderRepositories ===
            "function"
        ) {

            window.renderRepositories(
                repositories
            );

            updateRepoCount(
                repositories.length
            );

            return;

        }


        /*
         * Basic fallback renderer
         */

        repositories.forEach(
            repo => {

                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    "repository-item";


                item.innerHTML = `

                    <div class="repository-name">
                        ${escapeHTML(
                            repo.name ||
                            "Unnamed Repository"
                        )}
                    </div>

                    <div class="repository-description">
                        ${escapeHTML(
                            repo.description ||
                            "No description available."
                        )}
                    </div>

                    <div class="repository-meta">

                        <span>
                            ${escapeHTML(
                                repo.language ||
                                "Unknown"
                            )}
                        </span>

                        <span>
                            ★ ${escapeHTML(
                                repo.stargazers_count ??
                                repo.stars ??
                                0
                            )}
                        </span>

                        <span>
                            Forks:
                            ${escapeHTML(
                                repo.forks_count ??
                                repo.forks ??
                                0
                            )}
                        </span>

                    </div>

                `;


                elements.repositoryList
                    .appendChild(item);

            }
        );


        updateRepoCount(
            repositories.length
        );

    }


    /* =====================================================
       ANALYSIS ROW
    ===================================================== */

    function createAnalysisRow(
        row
    ) {

        return `

            <div class="analysis-row">

                <span class="analysis-label">
                    ${escapeHTML(
                        row[0]
                    )}
                </span>

                <span class="analysis-value">
                    ${escapeHTML(
                        row[1]
                    )}
                </span>

            </div>

        `;

    }


    /* =====================================================
       CLEAR SEARCH
    ===================================================== */

    function clearSearch() {

        elements.githubUrl.value = "";

        elements.githubUrl.focus();

        resetAnalysis();

    }


    /* =====================================================
       REFRESH
    ===================================================== */

    function refreshAnalysis() {

        if (!state.username) {

            if (
                elements.githubUrl.value.trim()
            ) {

                elements.form.requestSubmit();

            }

            return;

        }


        analyzeDeveloper(
            state.username
        );

    }


    /* =====================================================
       RETRY
    ===================================================== */

    function retryAnalysis() {

        hideError();


        if (state.lastRequest) {

            analyzeDeveloper(
                state.lastRequest
            );

            return;

        }


        if (
            elements.githubUrl.value.trim()
        ) {

            elements.form.requestSubmit();

        }

    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetAnalysis() {

        [
            elements.chatProfile,
            elements.chatSkills,
            elements.chatActivity,
            elements.chatEvidence,
            elements.chatRating
        ].forEach(
            hide
        );


        if (elements.profileAnalysis) {
            elements.profileAnalysis.innerHTML = "";
        }

        if (elements.skillsAnalysis) {
            elements.skillsAnalysis.innerHTML = "";
        }

        if (elements.activityAnalysis) {
            elements.activityAnalysis.innerHTML = "";
        }

        if (elements.evidenceAnalysis) {
            elements.evidenceAnalysis.innerHTML = "";
        }

        if (elements.ratingAnalysis) {
            elements.ratingAnalysis.innerHTML = "";
        }


        if (
            elements.developerProfile
        ) {

            elements.developerProfile.className =
                "developer-profile empty-state";


            elements.developerProfile.innerHTML = `

                <div class="empty-icon">
                    GH
                </div>

                <h3>
                    No Developer Selected
                </h3>

                <p>
                    Enter a GitHub profile URL
                    to start analysis.
                </p>

            `;

        }


        if (
            elements.repositoryList
        ) {

            elements.repositoryList.innerHTML = `

                <div class="repo-empty">

                    <div class="empty-icon">
                        📂
                    </div>

                    <h3>
                        No repositories
                    </h3>

                    <p>
                        Analyze a GitHub developer
                        to see their repositories.
                    </p>

                </div>

            `;

        }


        updateRepoCount(0);

    }


    /* =====================================================
       LOADING
    ===================================================== */

    function setLoading(
        loading
    ) {

        if (
            elements.loadingOverlay
        ) {

            elements.loadingOverlay.hidden =
                !loading;

        }


        if (
            elements.analyzeBtn
        ) {

            elements.analyzeBtn.disabled =
                loading;


            elements.analyzeBtn.textContent =
                loading
                    ? "Analyzing..."
                    : "Analyze Developer";

        }


        if (loading) {

            cycleLoadingText();

        }

    }


    let loadingTimer = null;


    function cycleLoadingText() {

        const messages = [

            "Fetching profile...",

            "Loading repositories...",

            "Checking project data...",

            "Collecting development signals...",

            "Preparing evidence...",

            "Building developer analysis..."

        ];


        let index = 0;


        clearInterval(
            loadingTimer
        );


        if (elements.loadingText) {

            elements.loadingText.textContent =
                messages[0];

        }


        loadingTimer =
            setInterval(
                function () {

                    index =
                        (index + 1) %
                        messages.length;


                    if (
                        elements.loadingText
                    ) {

                        elements.loadingText.textContent =
                            messages[index];

                    }

                },
                1800
            );

    }


    /* =====================================================
       ERROR
    ===================================================== */

    function handleAnalysisError(
        error
    ) {

        let message =
            error?.message ||
            CONFIG.DEFAULT_ERROR;


        /*
         * GitHub rate limit
         */

        if (
            /rate.?limit/i.test(
                message
            )
        ) {

            message =
                "GitHub API rate limit reached. " +
                "Please try again later or use " +
                "server-side authenticated GitHub API.";

        }


        showError(
            message
        );


        setAnalysisStatus(
            "Analysis failed"
        );


        setApiStatus(
            "Error",
            false
        );

    }


    function showError(
        message
    ) {

        if (
            elements.errorMessage
        ) {

            elements.errorMessage.textContent =
                message ||
                CONFIG.DEFAULT_ERROR;

        }


        if (
            elements.errorModal
        ) {

            elements.errorModal.hidden =
                false;

        }

    }


    function hideError() {

        if (
            elements.errorModal
        ) {

            elements.errorModal.hidden =
                true;

        }

    }


    /* =====================================================
       STATUS
    ===================================================== */

    function setAnalysisStatus(
        text
    ) {

        if (
            elements.analysisStatus
        ) {

            elements.analysisStatus.textContent =
                text;

        }

    }


    function setApiStatus(
        text,
        connected
    ) {

        if (
            elements.apiStatus
        ) {

            elements.apiStatus.textContent =
                text;

        }


        if (
            elements.footerApiStatus
        ) {

            elements.footerApiStatus.textContent =
                `API: ${text}`;

        }


        const dot =
            document.querySelector(
                ".status-dot"
            );


        if (dot) {

            dot.style.background =
                connected
                    ? "var(--green)"
                    : "var(--red)";

        }

    }


    /* =====================================================
       REPOSITORY COUNT
    ===================================================== */

    function updateRepoCount(
        count
    ) {

        if (
            elements.repoCount
        ) {

            elements.repoCount.textContent =
                count;

        }

    }


    /* =====================================================
       SHOW / HIDE
    ===================================================== */

    function show(
        element
    ) {

        if (element) {
            element.hidden = false;
        }

    }


    function hide(
        element
    ) {

        if (element) {
            element.hidden = true;
        }

    }


    /* =====================================================
       FORMAT LABEL
    ===================================================== */

    function formatLabel(
        value
    ) {

        return String(value)
            .replace(
                /_/g,
                " "
            )
            .replace(
                /\b\w/g,
                char => char.toUpperCase()
            );

    }


    /* =====================================================
       SECURITY HELPERS
    ===================================================== */

    function escapeHTML(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "Not Verifiable";

        }


        return String(value)
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


    function escapeAttribute(
        value
    ) {

        return escapeHTML(
            value
        );

    }


    /* =====================================================
       GLOBAL API
    ===================================================== */

    window.GitHubAnalyzer = {

        analyze:
            analyzeDeveloper,

        getState:
            function () {
                return {
                    ...state,
                    repositories:
                        [...state.repositories]
                };
            },

        reset:
            resetAnalysis

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }

})();



