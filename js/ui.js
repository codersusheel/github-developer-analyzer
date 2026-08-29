/* =========================================================
   GitHub Developer Analyzer
   ui.js — User Interface Controller
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const SELECTORS = {

        app:
            "#app",

        searchForm:
            "#analyzer-form",

        usernameInput:
            "#github-username",

        analyzeButton:
            "#analyze-btn",

        loading:
            "#loading",

        loadingText:
            "#loading-text",

        error:
            "#error-message",

        success:
            "#success-message",

        dashboard:
            "#analysis-dashboard",

        profile:
            "#developer-profile",

        score:
            "#overall-score",

        level:
            "#developer-level",

        repositories:
            "#repository-list"

    };


    /* =====================================================
       DOM CACHE
    ===================================================== */

    const elements = {};


    function cacheDOM() {

        Object.keys(
            SELECTORS
        ).forEach(
            function (key) {

                elements[key] =
                    document.querySelector(
                        SELECTORS[key]
                    );

            }
        );

    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function getElement(
        selector
    ) {

        if (
            typeof selector !==
            "string"
        ) {

            return null;

        }


        return document.querySelector(
            selector
        );

    }


    function safeText(
        value,
        fallback = "Not Verifiable"
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return fallback;

        }


        return String(value);

    }


    function escapeHTML(
        value
    ) {

        return safeText(
            value
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


    function setText(
        element,
        value
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            safeText(
                value
            );

    }


    /* =====================================================
       APP STATE
    ===================================================== */

    function showElement(
        element
    ) {

        if (!element) {
            return;
        }


        element.hidden =
            false;


        element.removeAttribute(
            "aria-hidden"
        );

    }


    function hideElement(
        element
    ) {

        if (!element) {
            return;
        }


        element.hidden =
            true;


        element.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading(
        message = "Analyzing GitHub profile..."
    ) {

        hideError();

        hideSuccess();


        setText(
            elements.loadingText,
            message
        );


        showElement(
            elements.loading
        );


        if (
            elements.analyzeButton
        ) {

            elements.analyzeButton
                .disabled = true;


            elements.analyzeButton
                .setAttribute(
                    "aria-busy",
                    "true"
                );

        }


        document.body.classList.add(
            "is-analyzing"
        );

    }


    function updateLoading(
        message
    ) {

        setText(
            elements.loadingText,
            message
        );

    }


    function hideLoading() {

        hideElement(
            elements.loading
        );


        if (
            elements.analyzeButton
        ) {

            elements.analyzeButton
                .disabled = false;


            elements.analyzeButton
                .removeAttribute(
                    "aria-busy"
                );

        }


        document.body.classList.remove(
            "is-analyzing"
        );

    }


    /* =====================================================
       ERROR
    ===================================================== */

    function showError(
        message
    ) {

        hideLoading();

        hideSuccess();


        if (!elements.error) {

            return;

        }


        elements.error.innerHTML = `

            <div class="error-icon">
                ⚠️
            </div>

            <div class="error-content">

                <strong>
                    Analysis Failed
                </strong>

                <span>
                    ${escapeHTML(
                        message ||
                        "Something went wrong."
                    )}
                </span>

            </div>

            <button
                type="button"
                class="error-close"
                aria-label="Close"
            >
                ×
            </button>

        `;


        showElement(
            elements.error
        );


        const closeButton =
            elements.error.querySelector(
                ".error-close"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                hideError,
                {
                    once: true
                }
            );

        }


        /*
         * Special rate-limit state.
         */

        if (
            /rate limit/i.test(
                String(
                    message || ""
                )
            )
        ) {

            elements.error.classList.add(
                "rate-limit-error"
            );

        } else {

            elements.error.classList.remove(
                "rate-limit-error"
            );

        }

    }


    function hideError() {

        hideElement(
            elements.error
        );

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    function showSuccess(
        message
    ) {

        if (!elements.success) {

            return;

        }


        elements.success.innerHTML = `

            <span class="success-icon">
                ✓
            </span>

            <span>
                ${escapeHTML(
                    message ||
                    "Analysis completed successfully."
                )}
            </span>

        `;


        showElement(
            elements.success
        );


        setTimeout(
            function () {

                hideSuccess();

            },
            4000
        );

    }


    function hideSuccess() {

        hideElement(
            elements.success
        );

    }


    /* =====================================================
       DASHBOARD
    ===================================================== */

    function showDashboard() {

        hideLoading();

        hideError();


        showElement(
            elements.dashboard
        );


        document.body.classList.add(
            "analysis-complete"
        );

    }


    function hideDashboard() {

        hideElement(
            elements.dashboard
        );


        document.body.classList.remove(
            "analysis-complete"
        );

    }


    /* =====================================================
       PROFILE
    ===================================================== */

    function renderProfile(
        profile
    ) {

        if (!profile) {

            return;

        }


        const container =
            elements.profile ||
            getElement(
                "#developer-profile"
            );


        if (!container) {

            return;

        }


        const avatar =
            profile.avatar_url;


        const name =
            profile.name ||
            profile.login ||
            "GitHub Developer";


        const username =
            profile.login ||
            "Not Verifiable";


        const bio =
            profile.bio ||
            "No bio available.";


        container.innerHTML = `

            <div class="profile-main">

                <div class="profile-avatar">

                    ${
                        avatar
                            ? `
                                <img
                                    src="${escapeHTML(
                                        avatar
                                    )}"
                                    alt="${escapeHTML(
                                        name
                                    )}"
                                    loading="eager"
                                >
                              `
                            : `
                                <div class="avatar-placeholder">
                                    ${escapeHTML(
                                        name
                                            .charAt(0)
                                            .toUpperCase()
                                    )}
                                </div>
                              `
                    }

                </div>


                <div class="profile-info">

                    <h2>
                        ${escapeHTML(
                            name
                        )}
                    </h2>

                    <a
                        href="${escapeHTML(
                            profile.html_url ||
                            "#"
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        @${escapeHTML(
                            username
                        )}
                    </a>

                    <p>
                        ${escapeHTML(
                            bio
                        )}
                    </p>

                </div>

            </div>


            <div class="profile-stats">

                ${stat(
                    "Repositories",
                    profile.public_repos
                )}

                ${stat(
                    "Followers",
                    profile.followers
                )}

                ${stat(
                    "Following",
                    profile.following
                )}

                ${stat(
                    "Gists",
                    profile.public_gists
                )}

            </div>


            <div class="profile-extra">

                ${
                    profile.location
                        ? `
                            <span>
                                📍
                                ${escapeHTML(
                                    profile.location
                                )}
                            </span>
                          `
                        : ""
                }

                ${
                    profile.company
                        ? `
                            <span>
                                🏢
                                ${escapeHTML(
                                    profile.company
                                )}
                            </span>
                          `
                        : ""
                }

                ${
                    profile.blog
                        ? `
                            <a
                                href="${escapeHTML(
                                    profile.blog
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                🔗 Website
                            </a>
                          `
                        : ""
                }

            </div>

        `;

    }


    function stat(
        label,
        value
    ) {

        return `

            <div class="profile-stat">

                <strong>
                    ${
                        value === null ||
                        value === undefined
                            ? "N/A"
                            : escapeHTML(
                                Number(value)
                                    .toLocaleString(
                                        "en-IN"
                                    )
                              )
                    }
                </strong>

                <span>
                    ${escapeHTML(
                        label
                    )}
                </span>

            </div>

        `;

    }


    /* =====================================================
       SCORE
    ===================================================== */

    function renderScore(
        rating,
        level
    ) {

        const score =
            rating?.overall;


        const scoreElement =
            elements.score ||
            getElement(
                "#overall-score"
            );


        const levelElement =
            elements.level ||
            getElement(
                "#developer-level"
            );


        if (scoreElement) {

            setText(
                scoreElement,
                score === null ||
                score === undefined
                    ? "N/A"
                    : `${score}/100`
            );

        }


        if (levelElement) {

            setText(
                levelElement,
                level
            );

        }


        /*
         * Circular score variable.
         */

        const circle =
            document.querySelector(
                ".score-circle"
            );


        if (
            circle &&
            Number.isFinite(
                Number(score)
            )
        ) {

            const percentage =
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(score)
                    )
                );


            circle.style.setProperty(
                "--score",
                `${percentage}%`
            );

        }

    }


    /* =====================================================
       SCORE DIMENSIONS
    ===================================================== */

    function renderDimensions(
        scores
    ) {

        if (!scores) {

            return;

        }


        const mapping = {

            codingSkill:
                [
                    "#coding-skill",
                    "Coding Skill"
                ],

            codeQuality:
                [
                    "#code-quality",
                    "Code Quality"
                ],

            complexity:
                [
                    "#complexity",
                    "Complexity"
                ],

            developmentEffort:
                [
                    "#development-effort",
                    "Development Effort"
                ],

            originality:
                [
                    "#originality",
                    "Originality"
                ],

            problemSolving:
                [
                    "#problem-solving",
                    "Problem Solving"
                ],

            github:
                [
                    "#github-score",
                    "Git / GitHub"
                ],

            documentation:
                [
                    "#documentation",
                    "Documentation"
                ],

            security:
                [
                    "#security-score",
                    "Security"
                ]

        };


        Object.keys(
            mapping
        ).forEach(
            function (key) {

                const selector =
                    mapping[key][0];


                const value =
                    scores[key];


                const element =
                    document.querySelector(
                        selector
                    );


                if (!element) {

                    return;

                }


                setText(
                    element,
                    Number.isFinite(
                        Number(value)
                    )
                        ? `${Number(value).toFixed(1)}/10`
                        : "Not Verifiable"
                );


                const bar =
                    element
                        .closest(
                            ".score-item"
                        )
                        ?.querySelector(
                            ".score-bar-fill"
                        );


                if (
                    bar &&
                    Number.isFinite(
                        Number(value)
                    )
                ) {

                    bar.style.width =
                        `${(
                            Number(value) *
                            10
                        )}%`;

                }

            }
        );

    }


    /* =====================================================
       PROJECT SUMMARY
    ===================================================== */

    function renderProjectSummary(
        summary
    ) {

        if (!summary) {

            return;

        }


        const fields = {

            strong:
                "#strong-projects",

            medium:
                "#medium-projects",

            basic:
                "#basic-projects",

            oldAbandoned:
                "#abandoned-projects",

            forks:
                "#fork-projects"

        };


        Object.keys(
            fields
        ).forEach(
            function (key) {

                const element =
                    document.querySelector(
                        fields[key]
                    );


                if (!element) {

                    return;

                }


                setText(
                    element,
                    summary[key] ??
                    "N/A"
                );

            }
        );

    }


    /* =====================================================
       CLAIM VS EVIDENCE
    ===================================================== */

    function renderClaims(
        claims
    ) {

        const container =
            document.querySelector(
                "#claims-evidence"
            );


        if (!container) {

            return;

        }


        if (
            !claims ||
            !Array.isArray(
                claims.details
            ) ||
            !claims.details.length
        ) {

            container.innerHTML = `

                <div class="not-verifiable">

                    <strong>
                        Not Verifiable
                    </strong>

                    <span>
                        No claim evidence was
                        provided by the analysis server.
                    </span>

                </div>

            `;

            return;

        }


        container.innerHTML =
            claims.details
                .map(
                    function (item) {

                        const status =
                            String(
                                item.status ||
                                "Not Verifiable"
                            );


                        return `

                            <article
                                class="claim-item"
                            >

                                <div
                                    class="claim-header"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            item.claim
                                        )}
                                    </strong>

                                    <span
                                        class="claim-status"
                                    >
                                        ${escapeHTML(
                                            status
                                        )}
                                    </span>

                                </div>

                                <p>
                                    ${escapeHTML(
                                        item.evidence
                                    )}
                                </p>

                            </article>

                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       FULL ANALYSIS RENDER
    ===================================================== */

    function renderAnalysis(
        analysis
    ) {

        if (!analysis) {

            return;

        }


        /*
         * Profile
         */

        renderProfile(
            analysis.profile
        );


        /*
         * Rating
         */

        renderScore(
            analysis.rating,
            analysis.developerLevel
        );


        /*
         * Dimensions
         */

        renderDimensions(
            analysis.scores
        );


        /*
         * Projects
         */

        renderProjectSummary(
            analysis.repositories?.summary
        );


        /*
         * Claims
         */

        renderClaims(
            analysis.claims
        );


        /*
         * Repositories
         */

        if (
            window.RepositoryExplorer &&
            typeof window.RepositoryExplorer
                .render ===
                "function"
        ) {

            window.RepositoryExplorer.render(
                analysis.repositories?.projects ||
                []
            );

        } else if (
            window.renderRepositories
        ) {

            window.renderRepositories(
                analysis.repositories?.projects ||
                []
            );

        }


        showDashboard();

        showSuccess(
            "Developer analysis completed."
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    function reset() {

        hideLoading();

        hideError();

        hideSuccess();

        hideDashboard();


        if (
            elements.profile
        ) {

            elements.profile.innerHTML =
                "";

        }


        if (
            elements.repositories
        ) {

            elements.repositories.innerHTML =
                "";

        }


        const score =
            elements.score ||
            getElement(
                "#overall-score"
            );


        if (score) {

            score.textContent =
                "—";

        }


        const level =
            elements.level ||
            getElement(
                "#developer-level"
            );


        if (level) {

            level.textContent =
                "Waiting for analysis";

        }

    }


    /* =====================================================
       TABS
    ===================================================== */

    function initTabs() {

        const buttons =
            document.querySelectorAll(
                "[data-tab]"
            );


        const panels =
            document.querySelectorAll(
                "[data-panel]"
            );


        if (!buttons.length) {

            return;

        }


        buttons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const target =
                            this.dataset.tab;


                        buttons.forEach(
                            function (item) {

                                item.classList.toggle(
                                    "active",
                                    item === button
                                );


                                item.setAttribute(
                                    "aria-selected",
                                    item === button
                                        ? "true"
                                        : "false"
                                );

                            }
                        );


                        panels.forEach(
                            function (panel) {

                                const active =
                                    panel.dataset.panel ===
                                    target;


                                panel.hidden =
                                    !active;


                                panel.classList.toggle(
                                    "active",
                                    active
                                );

                            }
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       SEARCH FORM
    ===================================================== */

    function initSearch() {

        const form =
            elements.searchForm ||
            document.querySelector(
                "#analyzer-form"
            );


        const input =
            elements.usernameInput ||
            document.querySelector(
                "#github-username"
            );


        if (
            !form ||
            !input
        ) {

            return;

        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const username =
                    input.value.trim();


                if (!username) {

                    showError(
                        "Please enter a GitHub profile URL or username."
                    );

                    input.focus();

                    return;

                }


                /*
                 * Prefer GitHubAPI from github.js.
                 */

                if (
                    !window.GitHubAPI ||
                    typeof window.GitHubAPI.analyze !==
                    "function"
                ) {

                    showError(
                        "GitHub API module is not loaded."
                    );

                    return;

                }


                try {

                    showLoading(
                        "Connecting to analysis server..."
                    );


                    updateLoading(
                        "Fetching GitHub developer data..."
                    );


                    const data =
                        await window.GitHubAPI
                            .analyze(
                                extractUsername(
                                    username
                                )
                            );


                    updateLoading(
                        "Building evidence-based analysis..."
                    );


                    let analysis =
                        data;


                    /*
                     * Run local analysis.js
                     * when available.
                     */

                    if (
                        window.GitHubAnalysis &&
                        typeof window.GitHubAnalysis
                            .analyze ===
                        "function"
                    ) {

                        try {

                            analysis =
                                {
                                    ...data,

                                    ...window.GitHubAnalysis
                                        .analyze(
                                            data
                                        )
                                };

                        } catch (
                            analysisError
                        ) {

                            /*
                             * Do not destroy
                             * server response if
                             * local analysis fails.
                             */

                            console.warn(
                                "Local analysis failed:",
                                analysisError
                            );

                        }

                    }


                    renderAnalysis(
                        analysis
                    );

                } catch (
                    error
                ) {

                    console.error(
                        "GitHub Analysis Error:",
                        error
                    );


                    showError(
                        error?.message ||
                        "GitHub analysis failed."
                    );

                }

            }
        );

    }


    /* =====================================================
       USERNAME EXTRACTION
    ===================================================== */

    function extractUsername(
        value
    ) {

        let input =
            String(
                value || ""
            )
            .trim();


        /*
         * Remove trailing slash.
         */

        input =
            input.replace(
                /\/+$/,
                ""
            );


        /*
         * GitHub URL
         */

        try {

            if (
                /^https?:\/\//i.test(
                    input
                )
            ) {

                const url =
                    new URL(
                        input
                    );


                if (
                    url.hostname
                        .toLowerCase()
                        .includes(
                            "github.com"
                        )
                ) {

                    const parts =
                        url.pathname
                            .split("/")
                            .filter(Boolean);


                    return (
                        parts[0] ||
                        ""
                    );

                }

            }

        } catch {

            /*
             * Continue as username.
             */

        }


        /*
         * Remove github.com/
         */

        input =
            input.replace(
                /^github\.com\//i,
                ""
            );


        /*
         * Remove @ if user enters @name.
         */

        input =
            input.replace(
                /^@/,
                ""
            );


        return input
            .split("/")
            .filter(Boolean)[0] ||
            "";

    }


    /* =====================================================
       SCROLL TO DASHBOARD
    ===================================================== */

    function scrollToDashboard() {

        if (
            elements.dashboard
        ) {

            elements.dashboard.scrollIntoView(
                {
                    behavior: "smooth",
                    block: "start"
                }
            );

        }

    }


    /* =====================================================
       100VH APP HEIGHT
    ===================================================== */

    function setViewportHeight() {

        const root =
            document.documentElement;


        if (!root) {

            return;

        }


        /*
         * Helps mobile browsers where
         * 100vh is not the actual viewport.
         */

        const height =
            window.innerHeight;


        root.style.setProperty(
            "--app-height",
            `${height}px`
        );

    }


    function initViewport() {

        setViewportHeight();


        window.addEventListener(
            "resize",
            setViewportHeight,
            {
                passive: true
            }
        );


        window.addEventListener(
            "orientationchange",
            setViewportHeight,
            {
                passive: true
            }
        );

    }


    /* =====================================================
       PUBLIC UI API
    ===================================================== */

    window.AnalyzerUI = {

        loading:
            showLoading,

        updateLoading,

        hideLoading,

        error:
            showError,

        hideError,

        success:
            showSuccess,

        hideSuccess,

        dashboard:
            showDashboard,

        hideDashboard,

        profile:
            renderProfile,

        score:
            renderScore,

        dimensions:
            renderDimensions,

        projects:
            renderProjectSummary,

        claims:
            renderClaims,

        render:
            renderAnalysis,

        reset,

        scroll:
            scrollToDashboard,

        extractUsername,

        viewport:
            setViewportHeight

    };


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        cacheDOM();

        initSearch();

        initTabs();

        initViewport();

    }


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
