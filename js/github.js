/* =========================================================
   GitHub Developer Analyzer
   github.js — GitHub / Backend API Client
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

        REQUEST_TIMEOUT: 60000

    };


    /* =====================================================
       API ERROR
    ===================================================== */

    class GitHubAPIError extends Error {

        constructor(
            message,
            status = 0,
            data = null
        ) {

            super(message);

            this.name =
                "GitHubAPIError";

            this.status =
                status;

            this.data =
                data;

        }

    }


    /* =====================================================
       USERNAME VALIDATION
    ===================================================== */

    function isValidUsername(
        username
    ) {

        if (
            typeof username !==
            "string"
        ) {

            return false;

        }


        username =
            username.trim();


        return (
            username.length > 0 &&
            username.length <= 39 &&
            /^[a-zA-Z0-9-]+$/.test(
                username
            )
        );

    }


    /* =====================================================
       FETCH WITH TIMEOUT
    ===================================================== */

    async function request(
        url,
        options = {}
    ) {

        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                function () {

                    controller.abort();

                },
                CONFIG.REQUEST_TIMEOUT
            );


        try {

            const response =
                await fetch(
                    url,
                    {
                        ...options,

                        signal:
                            controller.signal,

                        headers: {

                            "Accept":
                                "application/json",

                            ...(options.headers || {})

                        }
                    }
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            let data;


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                try {

                    data =
                        await response.json();

                } catch {

                    data = null;

                }

            } else {

                const text =
                    await response.text();

                data =
                    text
                        ? {
                            message: text
                        }
                        : null;

            }


            if (!response.ok) {

                throw new GitHubAPIError(

                    getErrorMessage(
                        response.status,
                        data
                    ),

                    response.status,

                    data

                );

            }


            return data;

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                throw new GitHubAPIError(
                    "GitHub analysis request timed out.",
                    408
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
                0
            );

        } finally {

            clearTimeout(
                timeout
            );

        }

    }


    /* =====================================================
       ERROR MESSAGE
    ===================================================== */

    function getErrorMessage(
        status,
        data
    ) {

        const serverMessage =
            data?.message ||
            data?.error;


        if (serverMessage) {

            return serverMessage;

        }


        switch (status) {

            case 400:

                return (
                    "Invalid GitHub username."
                );


            case 401:

                return (
                    "GitHub authentication failed."
                );


            case 403:

                return (
                    "GitHub API rate limit reached."
                );


            case 404:

                return (
                    "GitHub developer not found."
                );


            case 408:

                return (
                    "Request timed out."
                );


            case 429:

                return (
                    "Too many requests. Please try again later."
                );


            case 500:

                return (
                    "Analysis server error."
                );


            case 502:

            case 503:

                return (
                    "GitHub service is temporarily unavailable."
                );


            default:

                return (
                    "GitHub analysis failed."
                );

        }

    }


    /* =====================================================
       ANALYZE DEVELOPER
    ===================================================== */

    async function analyzeDeveloper(
        username
    ) {

        if (
            !isValidUsername(
                username
            )
        ) {

            throw new GitHubAPIError(
                "Invalid GitHub username."
            );

        }


        const cleanUsername =
            username.trim();


        const endpoint =
            `${CONFIG.API_BASE_URL}` +
            `${CONFIG.ENDPOINTS.ANALYZE}/` +
            `${encodeURIComponent(
                cleanUsername
            )}`;


        return await request(
            endpoint,
            {
                method: "GET",

                cache: "no-store"
            }
        );

    }


    /* =====================================================
       CHECK API
    ===================================================== */

    async function checkAPI() {

        try {

            return await request(
                `${CONFIG.API_BASE_URL}/health`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

        } catch (error) {

            throw error;

        }

    }


    /* =====================================================
       NORMALIZE PROFILE
    ===================================================== */

    function normalizeProfile(
        profile
    ) {

        if (
            !profile ||
            typeof profile !==
            "object"
        ) {

            return null;

        }


        return {

            login:
                profile.login || null,

            name:
                profile.name || null,

            avatar_url:
                profile.avatar_url || null,

            html_url:
                profile.html_url || null,

            bio:
                profile.bio || null,

            company:
                profile.company || null,

            location:
                profile.location || null,

            blog:
                profile.blog || null,

            twitter_username:
                profile.twitter_username ||
                null,

            public_repos:
                profile.public_repos ??
                null,

            public_gists:
                profile.public_gists ??
                null,

            followers:
                profile.followers ??
                null,

            following:
                profile.following ??
                null,

            created_at:
                profile.created_at ||
                null,

            updated_at:
                profile.updated_at ||
                null

        };

    }


    /* =====================================================
       NORMALIZE REPOSITORY
    ===================================================== */

    function normalizeRepository(
        repo
    ) {

        if (
            !repo ||
            typeof repo !==
            "object"
        ) {

            return null;

        }


        return {

            id:
                repo.id ?? null,

            name:
                repo.name || "Unknown",

            full_name:
                repo.full_name || null,

            html_url:
                repo.html_url || null,

            description:
                repo.description || null,

            language:
                repo.language || null,

            languages:
                repo.languages || {},

            stargazers_count:
                repo.stargazers_count ??
                repo.stars ??
                0,

            forks_count:
                repo.forks_count ??
                repo.forks ??
                0,

            watchers_count:
                repo.watchers_count ??
                0,

            open_issues_count:
                repo.open_issues_count ??
                0,

            size:
                repo.size ??
                0,

            default_branch:
                repo.default_branch ||
                "main",

            fork:
                Boolean(
                    repo.fork
                ),

            archived:
                Boolean(
                    repo.archived
                ),

            disabled:
                Boolean(
                    repo.disabled
                ),

            visibility:
                repo.visibility ||
                "public",

            created_at:
                repo.created_at ||
                null,

            updated_at:
                repo.updated_at ||
                null,

            pushed_at:
                repo.pushed_at ||
                null,

            topics:
                Array.isArray(
                    repo.topics
                )
                    ? repo.topics
                    : [],

            license:
                repo.license ||
                null

        };

    }


    /* =====================================================
       NORMALIZE RESPONSE
    ===================================================== */

    function normalizeAnalysis(
        data
    ) {

        if (
            !data ||
            typeof data !==
            "object"
        ) {

            throw new GitHubAPIError(
                "Invalid analysis response."
            );

        }


        const profile =
            normalizeProfile(
                data.profile ||
                data.user ||
                data.developer
            );


        const repositories =
            Array.isArray(
                data.repositories
            )
                ? data.repositories
                    .map(
                        normalizeRepository
                    )
                    .filter(Boolean)
                : [];


        return {

            ...data,

            profile,

            repositories

        };

    }


    /* =====================================================
       PUBLIC ANALYZE METHOD
    ===================================================== */

    async function getDeveloperAnalysis(
        username
    ) {

        const data =
            await analyzeDeveloper(
                username
            );


        return normalizeAnalysis(
            data
        );

    }


    /* =====================================================
       GITHUB PROFILE URL
    ===================================================== */

    function createProfileURL(
        username
    ) {

        if (
            !isValidUsername(
                username
            )
        ) {

            return null;

        }


        return (
            "https://github.com/" +
            encodeURIComponent(
                username
            )
        );

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.GitHubAPI = {

        analyze:
            getDeveloperAnalysis,

        health:
            checkAPI,

        profileURL:
            createProfileURL,

        validateUsername:
            isValidUsername,

        GitHubAPIError

    };


})();
