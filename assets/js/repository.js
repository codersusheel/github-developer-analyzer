/* =========================================================
   GitHub Developer Analyzer
   repository.js — Repository Explorer
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        repositories: [],

        filtered: [],

        selected: null,

        search: "",

        filter: "all"

    };


    /* =====================================================
       DOM
    ===================================================== */

    const DOM = {

        list:
            document.getElementById(
                "repository-list"
            ),

        search:
            document.getElementById(
                "repo-search"
            ),

        filter:
            document.getElementById(
                "repo-filter"
            ),

        count:
            document.getElementById(
                "repo-count"
            ),

        detail:
            document.getElementById(
                "repository-detail"
            ),

        detailContent:
            document.getElementById(
                "detail-content"
            ),

        detailTitle:
            document.getElementById(
                "detail-title"
            ),

        detailSubtitle:
            document.getElementById(
                "detail-subtitle"
            ),

        detailClose:
            document.getElementById(
                "detail-close"
            )

    };


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function init() {

        if (DOM.search) {

            DOM.search.addEventListener(
                "input",
                function () {

                    state.search =
                        this.value
                            .trim()
                            .toLowerCase();

                    applyFilters();

                }
            );

        }


        if (DOM.filter) {

            DOM.filter.addEventListener(
                "change",
                function () {

                    state.filter =
                        this.value;

                    applyFilters();

                }
            );

        }


        if (DOM.detailClose) {

            DOM.detailClose.addEventListener(
                "click",
                closeDetail
            );

        }


        /*
         * Escape key closes repository detail.
         */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    closeDetail();

                }

            }
        );

    }


    /* =====================================================
       PUBLIC RENDER FUNCTION
    ===================================================== */

    function renderRepositories(
        repositories
    ) {

        state.repositories =
            Array.isArray(
                repositories
            )
                ? repositories
                : [];


        state.filtered =
            [...state.repositories];


        state.search = "";


        if (DOM.search) {

            DOM.search.value = "";

        }


        applyFilters();

    }


    /* =====================================================
       FILTER
    ===================================================== */

    function applyFilters() {

        let result =
            [...state.repositories];


        /*
         * Search
         */

        if (
            state.search
        ) {

            result =
                result.filter(
                    repo =>
                        searchRepository(
                            repo,
                            state.search
                        )
                );

        }


        /*
         * Status filter
         */

        if (
            state.filter !== "all"
        ) {

            result =
                result.filter(
                    repo =>
                        matchesFilter(
                            repo,
                            state.filter
                        )
                );

        }


        state.filtered =
            result;


        renderList(
            result
        );


        updateCount(
            result.length,
            state.repositories.length
        );

    }


    /* =====================================================
       SEARCH REPOSITORY
    ===================================================== */

    function searchRepository(
        repo,
        query
    ) {

        const searchable = [

            repo.name,

            repo.full_name,

            repo.description,

            repo.language,

            ...(Array.isArray(
                repo.topics
            )
                ? repo.topics
                : [])

        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


        return searchable.includes(
            query
        );

    }


    /* =====================================================
       FILTER MATCH
    ===================================================== */

    function matchesFilter(
        repo,
        filter
    ) {

        switch (filter) {

            case "active":

                return getStatus(
                    repo
                ) === "Active";


            case "new":

                return isNewProject(
                    repo
                );


            case "old":

                return (
                    getStatus(
                        repo
                    ) === "Old"
                );


            case "abandoned":

                return (
                    getStatus(
                        repo
                    ) ===
                    "Old / Abandoned"
                );


            case "fork":

                return Boolean(
                    repo.fork
                );


            case "archived":

                return Boolean(
                    repo.archived
                );


            case "original":

                return !repo.fork;


            default:

                return true;

        }

    }


    /* =====================================================
       STATUS
    ===================================================== */

    function getStatus(
        repo
    ) {

        if (!repo) {

            return "Not Verifiable";

        }


        if (repo.archived) {

            return "Old / Archived";

        }


        if (repo.fork) {

            return "Fork";

        }


        const dateValue =
            repo.pushed_at ||
            repo.updated_at;


        if (!dateValue) {

            return "Not Verifiable";

        }


        const date =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Not Verifiable";

        }


        const days =
            (
                Date.now() -
                date.getTime()
            ) /
            (1000 * 60 * 60 * 24);


        if (days <= 90) {

            return "Active";

        }


        if (days <= 365) {

            return "Old";

        }


        return "Old / Abandoned";

    }


    /* =====================================================
       NEW PROJECT
    ===================================================== */

    function isNewProject(
        repo
    ) {

        if (
            !repo?.created_at ||
            repo.fork
        ) {

            return false;

        }


        const date =
            new Date(
                repo.created_at
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return false;

        }


        const days =
            (
                Date.now() -
                date.getTime()
            ) /
            (1000 * 60 * 60 * 24);


        return days <= 180;

    }


    /* =====================================================
       IMPORTANCE
    ===================================================== */

    function getImportance(
        repo
    ) {

        if (
            window.GitHubAnalysis &&
            typeof window.GitHubAnalysis
                .projects ===
                "function"
        ) {

            const result =
                window.GitHubAnalysis
                    .projects([repo]);


            if (
                result?.[0]
            ) {

                return {

                    level:
                        result[0]
                            .importance ||
                        "Not Verifiable",

                    score:
                        result[0]
                            .importanceScore ??
                        null

                };

            }

        }


        /*
         * Fallback metadata signal.
         */

        let score = 0;


        if (
            repo.description
        ) {

            score += 2;

        }


        if (
            repo.language
        ) {

            score += 1;

        }


        if (
            Number(
                repo.size
            ) > 100
        ) {

            score += 2;

        }


        if (
            Number(
                repo.open_issues_count
            ) > 0
        ) {

            score += 1;

        }


        if (
            Number(
                repo.forks_count
            ) > 0
        ) {

            score += 1;

        }


        if (
            Array.isArray(
                repo.topics
            ) &&
            repo.topics.length
        ) {

            score += 1;

        }


        score =
            Math.max(
                0,
                Math.min(
                    10,
                    score
                )
            );


        return {

            level:
                score >= 8
                    ? "High"
                    : score >= 5
                        ? "Medium"
                        : "Basic",

            score

        };

    }


    /* =====================================================
       RENDER LIST
    ===================================================== */

    function renderList(
        repositories
    ) {

        if (!DOM.list) {
            return;
        }


        DOM.list.innerHTML = "";


        if (
            !repositories.length
        ) {

            DOM.list.innerHTML = `

                <div class="repo-empty">

                    <div class="empty-icon">
                        🔍
                    </div>

                    <h3>
                        No repositories found
                    </h3>

                    <p>
                        Try another search term
                        or filter.
                    </p>

                </div>

            `;

            return;

        }


        const fragment =
            document.createDocumentFragment();


        repositories.forEach(
            function (
                repo,
                index
            ) {

                const item =
                    createRepositoryItem(
                        repo,
                        index
                    );


                fragment.appendChild(
                    item
                );

            }
        );


        DOM.list.appendChild(
            fragment
        );

    }


    /* =====================================================
       CREATE REPOSITORY ITEM
    ===================================================== */

    function createRepositoryItem(
        repo,
        index
    ) {

        const article =
            document.createElement(
                "article"
            );


        article.className =
            "repository-item";


        article.dataset.index =
            String(
                state.repositories.indexOf(
                    repo
                )
            );


        const status =
            getStatus(
                repo
            );


        const importance =
            getImportance(
                repo
            );


        const language =
            repo.language ||
            "Unknown";


        article.innerHTML = `

            <div
                style="
                    display:flex;
                    align-items:flex-start;
                    justify-content:space-between;
                    gap:10px;
                "
            >

                <div
                    class="repository-name"
                >
                    ${escapeHTML(
                        repo.name ||
                        "Unnamed Repository"
                    )}
                </div>

                <span
                    class="badge ${getStatusClass(
                        status
                    )}"
                >
                    ${escapeHTML(
                        status
                    )}
                </span>

            </div>


            <div
                class="repository-description"
            >
                ${escapeHTML(
                    repo.description ||
                    "No description available."
                )}
            </div>


            <div
                class="repository-meta"
            >

                <span>
                    💻
                    ${escapeHTML(
                        language
                    )}
                </span>

                <span>
                    ★
                    ${formatNumber(
                        repo.stargazers_count ??
                        repo.stars ??
                        0
                    )}
                </span>

                <span>
                    Forks:
                    ${formatNumber(
                        repo.forks_count ??
                        repo.forks ??
                        0
                    )}
                </span>

                <span>
                    Issues:
                    ${formatNumber(
                        repo.open_issues_count ??
                        0
                    )}
                </span>

            </div>


            <div
                class="repository-badges"
            >

                <span
                    class="badge ${getImportanceClass(
                        importance.level
                    )}"
                >
                    ${escapeHTML(
                        importance.level
                    )}
                </span>

                ${
                    repo.fork
                        ? `
                            <span class="badge fork">
                                Fork
                            </span>
                          `
                        : `
                            <span class="badge strong">
                                Original Signal
                            </span>
                          `
                }

                ${
                    repo.archived
                        ? `
                            <span class="badge">
                                Archived
                            </span>
                          `
                        : ""
                }

            </div>

        `;


        article.addEventListener(
            "click",
            function () {

                openDetail(
                    repo
                );

            }
        );


        return article;

    }


    /* =====================================================
       DETAIL VIEW
    ===================================================== */

    function openDetail(
        repo
    ) {

        if (!repo) {
            return;
        }


        state.selected =
            repo;


        if (!DOM.detail) {
            return;
        }


        const status =
            getStatus(
                repo
            );


        const importance =
            getImportance(
                repo
            );


        if (DOM.detailTitle) {

            DOM.detailTitle.textContent =
                repo.name ||
                "Repository";

        }


        if (DOM.detailSubtitle) {

            DOM.detailSubtitle.textContent =
                repo.full_name ||
                "GitHub Repository";

        }


        if (DOM.detailContent) {

            DOM.detailContent.innerHTML =
                createDetailHTML(
                    repo,
                    status,
                    importance
                );

        }


        DOM.detail.hidden =
            false;

    }


    /* =====================================================
       DETAIL HTML
    ===================================================== */

    function createDetailHTML(
        repo,
        status,
        importance
    ) {

        const topics =
            Array.isArray(
                repo.topics
            )
                ? repo.topics
                : [];


        return `

            <section
                class="detail-section"
            >

                <h4>
                    Repository Overview
                </h4>

                <div
                    class="detail-grid"
                >

                    ${detailBox(
                        "Status",
                        status
                    )}

                    ${detailBox(
                        "Importance",
                        importance.level
                    )}

                    ${detailBox(
                        "Language",
                        repo.language ||
                        "Not Verifiable"
                    )}

                    ${detailBox(
                        "Visibility",
                        repo.visibility ||
                        "Not Verifiable"
                    )}

                </div>

            </section>


            <section
                class="detail-section"
            >

                <h4>
                    Description
                </h4>

                <div
                    class="detail-box"
                >
                    ${
                        escapeHTML(
                            repo.description ||
                            "Not Verifiable"
                        )
                    }
                </div>

            </section>


            <section
                class="detail-section"
            >

                <h4>
                    GitHub Activity
                </h4>

                <div
                    class="detail-grid"
                >

                    ${detailBox(
                        "Stars",
                        formatNumber(
                            repo.stargazers_count ??
                            repo.stars ??
                            0
                        )
                    )}

                    ${detailBox(
                        "Forks",
                        formatNumber(
                            repo.forks_count ??
                            repo.forks ??
                            0
                        )
                    )}

                    ${detailBox(
                        "Open Issues",
                        formatNumber(
                            repo.open_issues_count ??
                            0
                        )
                    )}

                    ${detailBox(
                        "Watchers",
                        formatNumber(
                            repo.watchers_count ??
                            0
                        )
                    )}

                </div>

            </section>


            <section
                class="detail-section"
            >

                <h4>
                    Project Signals
                </h4>

                <div
                    class="detail-grid"
                >

                    ${detailBox(
                        "Fork",
                        repo.fork
                            ? "Yes"
                            : "No"
                    )}

                    ${detailBox(
                        "Archived",
                        repo.archived
                            ? "Yes"
                            : "No"
                    )}

                    ${detailBox(
                        "Size",
                        formatNumber(
                            repo.size || 0
                        ) + " KB"
                    )}

                    ${detailBox(
                        "Default Branch",
                        repo.default_branch ||
                        "Not Verifiable"
                    )}

                </div>

            </section>


            <section
                class="detail-section"
            >

                <h4>
                    Dates
                </h4>

                <div
                    class="detail-grid"
                >

                    ${detailBox(
                        "Created",
                        formatDate(
                            repo.created_at
                        )
                    )}

                    ${detailBox(
                        "Updated",
                        formatDate(
                            repo.updated_at
                        )
                    )}

                    ${detailBox(
                        "Last Push",
                        formatDate(
                            repo.pushed_at
                        )
                    )}

                </div>

            </section>


            <section
                class="detail-section"
            >

                <h4>
                    Topics
                </h4>

                <div
                    class="repository-badges"
                >

                    ${
                        topics.length
                            ? topics
                                .map(
                                    topic =>
                                        `
                                            <span class="badge">
                                                ${escapeHTML(
                                                    topic
                                                )}
                                            </span>
                                        `
                                )
                                .join("")
                            : `
                                <span class="badge">
                                    Not Verifiable
                                </span>
                              `
                    }

                </div>

            </section>


            <section
                class="detail-section"
            >

                <h4>
                    Evidence Status
                </h4>

                <div
                    class="analysis-card"
                >

                    <div
                        class="analysis-row"
                    >

                        <span
                            class="analysis-label"
                        >
                            Originality
                        </span>

                        <span
                            class="analysis-value"
                        >
                            ${
                                repo.fork
                                    ? "Fork"
                                    : "Original Signal"
                            }
                        </span>

                    </div>


                    <div
                        class="analysis-row"
                    >

                        <span
                            class="analysis-label"
                        >
                            Project Importance
                        </span>

                        <span
                            class="analysis-value"
                        >
                            ${escapeHTML(
                                importance.level
                            )}
                        </span>

                    </div>


                    <div
                        class="analysis-row"
                    >

                        <span
                            class="analysis-label"
                        >
                            Source Code
                        </span>

                        <span
                            class="analysis-value"
                        >
                            ${
                                repo.code_analysis
                                    ? "Analyzed"
                                    : "Not Verifiable"
                            }
                        </span>

                    </div>

                </div>

            </section>


            <section
                class="detail-section"
            >

                <a
                    href="${escapeAttribute(
                        repo.html_url || "#"
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="analyze-btn"
                    style="
                        display:block;
                        text-align:center;
                        text-decoration:none;
                    "
                >
                    Open on GitHub
                </a>

            </section>

        `;

    }


    /* =====================================================
       DETAIL BOX
    ===================================================== */

    function detailBox(
        label,
        value
    ) {

        return `

            <div
                class="detail-box"
            >

                <span>
                    ${escapeHTML(
                        label
                    )}
                </span>

                <strong>
                    ${escapeHTML(
                        value
                    )}
                </strong>

            </div>

        `;

    }


    /* =====================================================
       CLOSE DETAIL
    ===================================================== */

    function closeDetail() {

        if (DOM.detail) {

            DOM.detail.hidden =
                true;

        }


        state.selected =
            null;

    }


    /* =====================================================
       COUNT
    ===================================================== */

    function updateCount(
        visible,
        total
    ) {

        if (!DOM.count) {
            return;
        }


        DOM.count.textContent =
            visible === total
                ? total
                : `${visible}/${total}`;

    }


    /* =====================================================
       STATUS CLASS
    ===================================================== */

    function getStatusClass(
        status
    ) {

        switch (status) {

            case "Active":
                return "strong";

            case "Old":
                return "medium";

            case "Fork":
                return "fork";

            default:
                return "";

        }

    }


    function getImportanceClass(
        level
    ) {

        switch (level) {

            case "High":
                return "strong";

            case "Medium":
                return "medium";

            default:
                return "basic";

        }

    }


    /* =====================================================
       FORMAT NUMBER
    ===================================================== */

    function formatNumber(
        value
    ) {

        const numberValue =
            Number(value);


        if (
            !Number.isFinite(
                numberValue
            )
        ) {

            return "N/A";

        }


        return numberValue.toLocaleString(
            "en-IN"
        );

    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    function formatDate(
        value
    ) {

        if (!value) {

            return "Not Verifiable";

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

            return "Not Verifiable";

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    /* =====================================================
       SECURITY
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

    window.renderRepositories =
        renderRepositories;


    window.RepositoryExplorer = {

        render:
            renderRepositories,

        search:
            function (
                value
            ) {

                state.search =
                    String(
                        value || ""
                    )
                    .toLowerCase();

                applyFilters();

            },

        filter:
            function (
                value
            ) {

                state.filter =
                    value || "all";

                applyFilters();

            },

        open:
            openDetail,

        close:
            closeDetail,

        getState:
            function () {

                return {

                    repositories:
                        [
                            ...state.repositories
                        ],

                    filtered:
                        [
                            ...state.filtered
                        ],

                    selected:
                        state.selected

                };

            }

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
