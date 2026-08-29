/* =========================================================
   GitHub Developer Analyzer
   github-api.js — Frontend API Client
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const API_BASE =
        window.GITHUB_ANALYZER_API ||
        "/api";


    const REQUEST_TIMEOUT =
        30000;


    /* =====================================================
       ERROR CLASS
    ===================================================== */

    class GitHubAPIError extends Error {

        constructor(
            message,
            status = 0,
            code = "API_ERROR"
        ) {

            super(
                message
            );

            this.name =
                "GitHubAPIError";

            this.status =
                status;

            this.code =
                code;

        }

    }


    /* =====================================================
       REQUEST
    ===================================================== */

    async function request(
        endpoint,
        options = {}
    ) {

        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                function () {

                    controller.abort();

                },
                REQUEST_TIMEOUT
            );


        try {

            const response =
                await fetch(
                    `${API_BASE}${endpoint}`,
                    {
                        method:
                            options.method ||
                            "GET",

                        headers: {

                            "Accept":
                                "application/json",

                            "Content-Type":
                                "application/json",

                            ...(options.headers || {})

                        },

                        body:
                            options.body
                                ? JSON.stringify(
                                    options.body
                                )
                                : undefined,

                        signal:
                            controller.signal,

                        credentials:
                            "same-origin"

                    }
                );


            let result = null;


            try {

                result =
                    await response.json();

            } catch {

                throw new GitHubAPIError(
                    "Server returned an invalid response.",
                    response.status,
                    "INVALID_RESPONSE"
                );

            }


            if (
                !response.ok ||
                result?.success === false
            ) {

                throw new GitHubAPIError(

                    result?.error ||
                    getHTTPError(
                        response.status
                    ),

                    response.status,

                    getErrorCode(
                        response.status
                    )

                );

            }


            return result;

        } catch (
            error
        ) {

            if (
                error?.name ===
                "AbortError"
            ) {

                throw new GitHubAPIError(
                    "Request timed out. Please try again.",
                    408,
                    "TIMEOUT"
                );

            }


            if (
                error instanceof
                GitHubAPIError
            ) {

                throw error;

            }


            throw new GitHubAPIError(
                "Unable to connect to the analysis server.",
                0,
                "NETWORK_ERROR"
            );

        } finally {

            clearTimeout(
                timeout
            );

        }

    }


    /* =====================================================
       USERNAME
    ===================================================== */

    function normalizeUsername(
        input
    ) {

        let value =
            String(
                input || ""
            ).trim();


        if (!value) {

            throw new GitHubAPIError(
                "GitHub username or profile URL is required.",
                400,
                "INVALID_USERNAME"
            );

        }


        /*
         * Remove trailing slash.
         */

        value =
            value.replace(
                /\/+$/,
                ""
            );


        /*
         * Full GitHub URL.
         */

        try {

            if (
                /^https?:\/\//i.test(
                    value
                )
            ) {

                const url =
                    new URL(
                        value
                    );


                if (
                    url.hostname
                        .toLowerCase() !==
                    "github.com" &&
                    url.hostname
                        .toLowerCase() !==
                    "www.github.com"
                ) {

                    throw new GitHubAPIError(
                        "Please enter a valid GitHub profile URL.",
                        400,
                        "INVALID_GITHUB_URL"
                    );

                }


                value =
                    url.pathname
                        .split("/")
                        .filter(Boolean)[0] ||
                    "";

            }

        } catch (
            error
        ) {

            if (
                error instanceof
                GitHubAPIError
            ) {

                throw error;

            }

        }


        /*
         * github.com/username
         */

        value =
            value.replace(
                /^https?:\/\/(www\.)?github\.com\//i,
                ""
            );


        value =
            value.replace(
                /^(www\.)?github\.com\//i,
                ""
            );


        /*
         * @username
         */

        value =
            value.replace(
                /^@/,
                ""
            );


        /*
         * Remove path after username.
         */

        value =
            value
                .split("/")
                .filter(Boolean)[0] ||
            "";


        /*
         * GitHub username rules.
         */

        if (
            !/^[a-zA-Z0-9-]{1,39}$/.test(
                value
            )
        ) {

            throw new GitHubAPIError(
                "Invalid GitHub username.",
                400,
                "INVALID_USERNAME"
            );

        }


        return value;

    }


    /* =====================================================
       PROFILE
    ===================================================== */

    async function getProfile(
        username
    ) {

        const user =
            normalizeUsername(
                username
            );


        const response =
            await request(
                `/github/profile/${encodeURIComponent(
                    user
                )}`
            );


        return response.data;

    }


    /* =====================================================
       REPOSITORIES
    ===================================================== */

    async function getRepositories(
        username
    ) {

        const user =
            normalizeUsername(
                username
            );


        const response =
            await request(
                `/github/repos/${encodeURIComponent(
                    user
                )}`
            );


        return Array.isArray(
            response.data
        )
            ? response.data
            : [];

    }


    /* =====================================================
       COMPLETE ANALYSIS
    ===================================================== */

    async function analyze(
        username
    ) {

        const user =
            normalizeUsername(
                username
            );


        const response =
            await request(
                `/github/analyze/${encodeURIComponent(
                    user
                )}`
            );


        return {

            ...response,

            profile:
                response.profile ||
                null,

            repositories:
                response.repositories ||
                {
                    total: 0,
                    projects: []
                },

            analysis:
                response.analysis ||
                null,

            metadata:
                response.metadata ||
                {}

        };

    }


    /* =====================================================
       SINGLE REPOSITORY
    ===================================================== */

    async function getRepository(
        owner,
        repo
    ) {

        owner =
            cleanPart(
                owner
            );


        repo =
            cleanPart(
                repo
            );


        const response =
            await request(
                `/github/repository/${encodeURIComponent(
                    owner
                )}/${encodeURIComponent(
                    repo
                )}`
            );


        return response.data;

    }


    /* =====================================================
       LANGUAGES
    ===================================================== */

    async function getLanguages(
        owner,
        repo
    ) {

        const response =
            await request(
                `/github/repository/${encodeURIComponent(
                    cleanPart(owner)
                )}/${encodeURIComponent(
                    cleanPart(repo)
                )}/languages`
            );


        return response.data || {};

    }


    /* =====================================================
       COMMITS
    ===================================================== */

    async function getCommits(
        owner,
        repo
    ) {

        const response =
            await request(
                `/github/repository/${encodeURIComponent(
                    cleanPart(owner)
                )}/${encodeURIComponent(
                    cleanPart(repo)
                )}/commits`
            );


        return Array.isArray(
            response.data
        )
            ? response.data
            : [];

    }


    /* =====================================================
       ISSUES
    ===================================================== */

    async function getIssues(
        owner,
        repo
    ) {

        const response =
            await request(
                `/github/repository/${encodeURIComponent(
                    cleanPart(owner)
                )}/${encodeURIComponent(
                    cleanPart(repo)
                )}/issues`
            );


        return Array.isArray(
            response.data
        )
            ? response.data
            : [];

    }


    /* =====================================================
       PULL REQUESTS
    ===================================================== */

    async function getPullRequests(
        owner,
        repo
    ) {

        const response =
            await request(
                `/github/repository/${encodeURIComponent(
                    cleanPart(owner)
                )}/${encodeURIComponent(
                    cleanPart(repo)
                )}/pulls`
            );


        return Array.isArray(
            response.data
        )
            ? response.data
            : [];

    }


    /* =====================================================
       CONTRIBUTORS
    ===================================================== */

    async function getContributors(
        owner,
        repo
    ) {

        const response =
            await request(
                `/github/repository/${encodeURIComponent(
                    cleanPart(owner)
                )}/${encodeURIComponent(
                    cleanPart(repo)
                )}/contributors`
            );


        return Array.isArray(
            response.data
        )
            ? response.data
            : [];

    }


    /* =====================================================
       README
    ===================================================== */

    async function getReadme(
        owner,
        repo
    ) {

        const response =
            await request(
                `/github/repository/${encodeURIComponent(
                    cleanPart(owner)
                )}/${encodeURIComponent(
                    cleanPart(repo)
                )}/readme`
            );


        return response.data || null;

    }


    /* =====================================================
       REPOSITORY ANALYSIS
    ===================================================== */

    async function analyzeRepository(
        owner,
        repo
    ) {

        const response =
            await request(
                `/github/repository/${encodeURIComponent(
                    cleanPart(owner)
                )}/${encodeURIComponent(
                    cleanPart(repo)
                )}/analyze`
            );


        return response.data || null;

    }


    /* =====================================================
       HEALTH
    ===================================================== */

    async function health() {

        return await request(
            "/health"
        );

    }


    /* =====================================================
       CLEAN URL PART
    ===================================================== */

    function cleanPart(
        value
    ) {

        const result =
            String(
                value || ""
            )
            .trim()
            .replace(
                /[<>"'`]/g,
                ""
            );


        if (!result) {

            throw new GitHubAPIError(
                "Repository information is required.",
                400,
                "INVALID_PARAMETER"
            );

        }


        return result;

    }


    /* =====================================================
       HTTP ERROR
    ===================================================== */

    function getHTTPError(
        status
    ) {

        switch (
            Number(status)
        ) {

            case 400:

                return "Invalid request.";

            case 401:

                return "Authentication failed.";

            case 403:

                return (
                    "GitHub API rate limit reached. " +
                    "Please try again later."
                );

            case 404:

                return "GitHub profile or repository not found.";

            case 408:

                return "Request timed out.";

            case 429:

                return "Too many requests. Please try again later.";

            case 500:

                return "Analysis server error.";

            case 502:

                return "GitHub service is temporarily unavailable.";

            case 503:

                return "Analysis server is temporarily unavailable.";

            default:

                return "Request failed.";

        }

    }


    /* =====================================================
       ERROR CODE
    ===================================================== */

    function getErrorCode(
        status
    ) {

        switch (
            Number(status)
        ) {

            case 400:
                return "BAD_REQUEST";

            case 401:
                return "UNAUTHORIZED";

            case 403:
                return "RATE_LIMIT";

            case 404:
                return "NOT_FOUND";

            case 408:
                return "TIMEOUT";

            case 429:
                return "TOO_MANY_REQUESTS";

            case 500:
                return "SERVER_ERROR";

            case 502:
                return "GITHUB_UNAVAILABLE";

            case 503:
                return "SERVICE_UNAVAILABLE";

            default:
                return "API_ERROR";

        }

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.GitHubAPI = {

        request,

        getProfile,

        getRepositories,

        getAllRepositories:
            getRepositories,

        analyze,

        getRepository,

        getLanguages,

        getCommits,

        getIssues,

        getPullRequests,

        getContributors,

        getReadme,

        analyzeRepository,

        health,

        normalizeUsername,

        GitHubAPIError

    };


})();
