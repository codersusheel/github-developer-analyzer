/* =========================================================
   GitHub Developer Analyzer
   server.js — Secure GitHub API Server
========================================================= */

"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT =
    Number(process.env.PORT) || 3000;

const GITHUB_TOKEN =
    process.env.GITHUB_TOKEN || "";


/* =========================================================
   FRONTEND
========================================================= */

const FRONTEND_DIR =
    path.join(__dirname, "..");

app.use(
    express.static(FRONTEND_DIR)
);


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
    cors({
        origin:
            process.env.FRONTEND_ORIGIN || "*"
    })
);

app.use(
    express.json({
        limit: "1mb"
    })
);


/* =========================================================
   SECURITY HEADERS
========================================================= */

app.disable("x-powered-by");

app.use(
    function (req, res, next) {

        res.setHeader(
            "X-Content-Type-Options",
            "nosniff"
        );

        res.setHeader(
            "Referrer-Policy",
            "strict-origin-when-cross-origin"
        );

        next();
    }
);


/* =========================================================
   GITHUB REQUEST
========================================================= */

async function githubRequest(
    endpoint
) {

    const headers = {

        "Accept":
            "application/vnd.github+json",

        "X-GitHub-Api-Version":
            "2022-11-28",

        "User-Agent":
            "GitHub-Developer-Analyzer"
    };


    /*
     * Token only exists on server.
     * Never send it to browser.
     */

    if (GITHUB_TOKEN) {

        headers.Authorization =
            `Bearer ${GITHUB_TOKEN}`;

    }


    const response =
        await fetch(
            `https://api.github.com${endpoint}`,
            {
                method: "GET",
                headers
            }
        );


    let data = null;

    try {

        data =
            await response.json();

    } catch {

        data = null;

    }


    if (!response.ok) {

        const error =
            new Error(
                getGitHubErrorMessage(
                    response.status,
                    data
                )
            );


        error.status =
            response.status;


        error.github =
            data;


        throw error;

    }


    return data;

}


/* =========================================================
   GITHUB ERROR
========================================================= */

function getGitHubErrorMessage(
    status,
    data
) {

    if (
        status === 401
    ) {

        return (
            "GitHub authentication failed. " +
            "Check GITHUB_TOKEN."
        );

    }


    if (
        status === 403 ||
        status === 429
    ) {

        return (
            "GitHub API rate limit reached. " +
            "Please try again later."
        );

    }


    if (
        status === 404
    ) {

        return (
            "GitHub user or repository not found."
        );

    }


    return (
        data?.message ||
        `GitHub API request failed (${status}).`
    );

}


/* =========================================================
   USERNAME VALIDATION
========================================================= */

function validUsername(
    username
) {

    return (
        typeof username === "string" &&
        /^[a-zA-Z0-9-]{1,39}$/.test(
            username
        )
    );

}


/* =========================================================
   PROFILE
========================================================= */

app.get(
    "/api/github/profile/:username",
    async function (req, res) {

        const username =
            String(
                req.params.username || ""
            ).trim();


        if (
            !validUsername(
                username
            )
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Invalid GitHub username."

            });

        }


        try {

            const profile =
                await githubRequest(
                    `/users/${encodeURIComponent(
                        username
                    )}`
                );


            return res.json({

                success: true,

                data: profile

            });

        } catch (
            error
        ) {

            return sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   ALL REPOSITORIES
========================================================= */

app.get(
    "/api/github/repos/:username",
    async function (req, res) {

        const username =
            String(
                req.params.username || ""
            ).trim();


        if (
            !validUsername(
                username
            )
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Invalid GitHub username."

            });

        }


        try {

            const repositories =
                await getAllRepositories(
                    username
                );


            return res.json({

                success: true,

                count:
                    repositories.length,

                data:
                    repositories

            });

        } catch (
            error
        ) {

            return sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   REPOSITORIES WITH PAGINATION
========================================================= */

async function getAllRepositories(
    username
) {

    const all = [];

    const perPage = 100;

    let page = 1;


    while (true) {

        const repositories =
            await githubRequest(
                `/users/${encodeURIComponent(
                    username
                )}/repos?per_page=${perPage}&page=${page}&sort=updated`
            );


        if (
            !Array.isArray(
                repositories
            ) ||
            !repositories.length
        ) {

            break;

        }


        all.push(
            ...repositories
        );


        /*
         * GitHub returns maximum
         * 100 items per page.
         */

        if (
            repositories.length <
            perPage
        ) {

            break;

        }


        page++;


        /*
         * Safety limit.
         * Prevent accidental infinite loops.
         */

        if (
            page > 100
        ) {

            break;

        }

    }


    return all;

}


/* =========================================================
   COMPLETE DEVELOPER DATA
========================================================= */

app.get(
    "/api/github/analyze/:username",
    async function (req, res) {

        const username =
            String(
                req.params.username || ""
            ).trim();


        if (
            !validUsername(
                username
            )
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Invalid GitHub username."

            });

        }


        try {

            /*
             * Profile + repositories.
             *
             * They are independent requests,
             * so request them together.
             */

            const [
                profile,
                repositories
            ] = await Promise.all([

                githubRequest(
                    `/users/${encodeURIComponent(
                        username
                    )}`
                ),

                getAllRepositories(
                    username
                )

            ]);


            /*
             * Prepare clean analyzer data.
             */

            const normalizedRepos =
                repositories.map(
                    normalizeRepository
                );


            return res.json({

                success: true,

                profile,

                repositories: {

                    total:
                        normalizedRepos.length,

                    projects:
                        normalizedRepos

                },

                metadata: {

                    source:
                        "GitHub API",

                    authenticated:
                        Boolean(
                            GITHUB_TOKEN
                        ),

                    evidencePolicy:
                        "No evidence = Not Verifiable"

                }

            });

        } catch (
            error
        ) {

            return sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   NORMALIZE REPOSITORY
========================================================= */

function normalizeRepository(
    repo
) {

    return {

        id:
            repo.id,

        name:
            repo.name,

        full_name:
            repo.full_name,

        description:
            repo.description,

        html_url:
            repo.html_url,

        clone_url:
            repo.clone_url,

        ssh_url:
            repo.ssh_url,

        homepage:
            repo.homepage,

        language:
            repo.language,

        languages_url:
            repo.languages_url,

        topics:
            Array.isArray(
                repo.topics
            )
                ? repo.topics
                : [],

        visibility:
            repo.visibility,

        private:
            Boolean(
                repo.private
            ),

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

        size:
            repo.size,

        default_branch:
            repo.default_branch,

        stargazers_count:
            repo.stargazers_count,

        watchers_count:
            repo.watchers_count,

        forks_count:
            repo.forks_count,

        open_issues_count:
            repo.open_issues_count,

        created_at:
            repo.created_at,

        updated_at:
            repo.updated_at,

        pushed_at:
            repo.pushed_at,

        license:
            repo.license
                ? {
                    key:
                        repo.license.key,

                    name:
                        repo.license.name
                }
                : null,

        owner:
            repo.owner
                ? {
                    login:
                        repo.owner.login,

                    avatar_url:
                        repo.owner.avatar_url,

                    html_url:
                        repo.owner.html_url
                }
                : null

    };

}


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    function (req, res) {

        res.json({

            success: true,

            service:
                "GitHub Developer Analyzer",

            githubAuthentication:
                Boolean(
                    GITHUB_TOKEN
                ),

            timestamp:
                new Date().toISOString()

        });

    }
);


/* =========================================================
   FRONTEND HOME
========================================================= */

app.get(
    "/",
    function (req, res) {

        res.sendFile(
            path.join(
                FRONTEND_DIR,
                "index.html"
            )
        );

    }
);


/* =========================================================
   ERROR RESPONSE
========================================================= */

function sendError(
    res,
    error
) {

    console.error(
        "GitHub API Error:",
        error
    );


    const status =
        Number(
            error?.status
        ) || 500;


    return res.status(
        status >= 400 &&
            status <= 599
            ? status
            : 500
    ).json({

        success: false,

        error:
            error?.message ||
            "GitHub analysis failed.",

        evidence:
            "Not Verifiable"

    });

}


/* =========================================================
   404
========================================================= */

app.use(
    function (req, res) {

        res.status(404).json({

            success: false,

            error:
                "API endpoint not found."

        });

    }
);


/* =========================================================
   SERVER ERROR
========================================================= */

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "Server Error:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(
                error
            );

        }


        return res.status(
            500
        ).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    function () {

        console.log(
            "=========================================="
        );

        console.log(
            " GitHub Developer Analyzer"
        );

        console.log(
            ` Server: http://localhost:${PORT}`
        );

        console.log(
            ` GitHub Token: ${GITHUB_TOKEN
                ? "Configured"
                : "Not Configured"
            }`
        );

        console.log(
            "=========================================="
        );

    }
);
