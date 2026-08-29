/* =========================================================
   GitHub Developer Analyzer
   routes.js — API Route Manager
========================================================= */

"use strict";

const express = require("express");

const router = express.Router();


/* =========================================================
   SERVICES
========================================================= */

const github =
    require("./github");


const analysis =
    require("./analysis");


const repository =
    require("./repository");


/* =========================================================
   HEALTH
========================================================= */

router.get(
    "/health",
    function (req, res) {

        res.json({

            success: true,

            service:
                "GitHub Developer Analyzer",

            timestamp:
                new Date().toISOString()

        });

    }
);


/* =========================================================
   PROFILE
========================================================= */

router.get(
    "/github/profile/:username",
    async function (req, res) {

        try {

            const username =
                getUsername(
                    req.params.username
                );


            validateUsername(
                username
            );


            const profile =
                await github.getProfile(
                    username
                );


            res.json({

                success: true,

                data:
                    profile

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   REPOSITORIES
========================================================= */

router.get(
    "/github/repos/:username",
    async function (req, res) {

        try {

            const username =
                getUsername(
                    req.params.username
                );


            validateUsername(
                username
            );


            const repositories =
                await github.getAllRepositories(
                    username
                );


            res.json({

                success: true,

                count:
                    repositories.length,

                data:
                    repositories

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   COMPLETE ANALYSIS
========================================================= */

router.get(
    "/github/analyze/:username",
    async function (req, res) {

        try {

            const username =
                getUsername(
                    req.params.username
                );


            validateUsername(
                username
            );


            /*
             * Fetch developer profile
             * and repositories.
             */

            const [
                profile,
                repositories
            ] = await Promise.all([

                github.getProfile(
                    username
                ),

                github.getAllRepositories(
                    username
                )

            ]);


            /*
             * Analyze repositories.
             */

            const projectAnalysis =
                analysis.analyzeRepositories(
                    repositories
                );


            /*
             * Developer-level analysis.
             */

            const developerAnalysis =
                analysis.analyzeDeveloper(
                    profile,
                    repositories,
                    projectAnalysis
                );


            res.json({

                success: true,

                profile:

                    profile,

                repositories: {

                    total:
                        repositories.length,

                    projects:
                        projectAnalysis

                },

                analysis:
                    developerAnalysis,

                metadata: {

                    source:
                        "GitHub API",

                    evidencePolicy:
                        "No evidence = Not Verifiable"

                }

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   SINGLE REPOSITORY
========================================================= */

router.get(
    "/github/repository/:owner/:repo",
    async function (req, res) {

        try {

            const owner =
                clean(
                    req.params.owner
                );


            const repo =
                clean(
                    req.params.repo
                );


            if (
                !owner ||
                !repo
            ) {

                throw createError(
                    400,
                    "Repository owner and name are required."
                );

            }


            const data =
                await github.getRepository(
                    owner,
                    repo
                );


            res.json({

                success: true,

                data

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   REPOSITORY LANGUAGES
========================================================= */

router.get(
    "/github/repository/:owner/:repo/languages",
    async function (req, res) {

        try {

            const owner =
                clean(
                    req.params.owner
                );


            const repo =
                clean(
                    req.params.repo
                );


            const data =
                await github.getLanguages(
                    owner,
                    repo
                );


            res.json({

                success: true,

                data

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   COMMITS
========================================================= */

router.get(
    "/github/repository/:owner/:repo/commits",
    async function (req, res) {

        try {

            const owner =
                clean(
                    req.params.owner
                );


            const repo =
                clean(
                    req.params.repo
                );


            const data =
                await github.getCommits(
                    owner,
                    repo
                );


            res.json({

                success: true,

                count:
                    data.length,

                data

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   ISSUES
========================================================= */

router.get(
    "/github/repository/:owner/:repo/issues",
    async function (req, res) {

        try {

            const owner =
                clean(
                    req.params.owner
                );


            const repo =
                clean(
                    req.params.repo
                );


            const data =
                await github.getIssues(
                    owner,
                    repo
                );


            res.json({

                success: true,

                count:
                    data.length,

                data

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   PULL REQUESTS
========================================================= */

router.get(
    "/github/repository/:owner/:repo/pulls",
    async function (req, res) {

        try {

            const owner =
                clean(
                    req.params.owner
                );


            const repo =
                clean(
                    req.params.repo
                );


            const data =
                await github.getPullRequests(
                    owner,
                    repo
                );


            res.json({

                success: true,

                count:
                    data.length,

                data

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   CONTRIBUTORS
========================================================= */

router.get(
    "/github/repository/:owner/:repo/contributors",
    async function (req, res) {

        try {

            const owner =
                clean(
                    req.params.owner
                );


            const repo =
                clean(
                    req.params.repo
                );


            const data =
                await github.getContributors(
                    owner,
                    repo
                );


            res.json({

                success: true,

                count:
                    data.length,

                data

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   README
========================================================= */

router.get(
    "/github/repository/:owner/:repo/readme",
    async function (req, res) {

        try {

            const owner =
                clean(
                    req.params.owner
                );


            const repo =
                clean(
                    req.params.repo
                );


            const data =
                await github.getReadme(
                    owner,
                    repo
                );


            res.json({

                success: true,

                data

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   CODE ANALYSIS
========================================================= */

router.get(
    "/github/repository/:owner/:repo/analyze",
    async function (req, res) {

        try {

            const owner =
                clean(
                    req.params.owner
                );


            const repo =
                clean(
                    req.params.repo
                );


            const repositoryData =
                await github.getRepository(
                    owner,
                    repo
                );


            const languages =
                await github.getLanguages(
                    owner,
                    repo
                );


            const commits =
                await github.getCommits(
                    owner,
                    repo
                );


            const issues =
                await github.getIssues(
                    owner,
                    repo
                );


            const pulls =
                await github.getPullRequests(
                    owner,
                    repo
                );


            const contributors =
                await github.getContributors(
                    owner,
                    repo
                );


            const readme =
                await github.getReadme(
                    owner,
                    repo
                );


            const result =
                repository.analyze(
                    {
                        repository:
                            repositoryData,

                        languages,

                        commits,

                        issues,

                        pulls,

                        contributors,

                        readme
                    }
                );


            res.json({

                success: true,

                data:
                    result

            });

        } catch (
            error
        ) {

            sendError(
                res,
                error
            );

        }

    }
);


/* =========================================================
   USERNAME CLEANER
========================================================= */

function getUsername(
    value
) {

    let username =
        clean(
            value
        );


    /*
     * Support:
     *
     * username
     * @username
     * github.com/username
     * https://github.com/username
     */

    username =
        username.replace(
            /^@/,
            ""
        );


    username =
        username.replace(
            /^https?:\/\/(www\.)?github\.com\//i,
            ""
        );


    username =
        username.replace(
            /^github\.com\//i,
            ""
        );


    username =
        username
            .split("/")
            .filter(Boolean)[0] ||
        "";


    return username;

}


/* =========================================================
   USERNAME VALIDATION
========================================================= */

function validateUsername(
    username
) {

    if (
        !username ||
        !/^[a-zA-Z0-9-]{1,39}$/.test(
            username
        )
    ) {

        throw createError(
            400,
            "Invalid GitHub username."
        );

    }

}


/* =========================================================
   CLEAN INPUT
========================================================= */

function clean(
    value
) {

    return String(
        value || ""
    )
    .trim()
    .replace(
       (/[<>"'`]/g),
        ""
    );

}


/* =========================================================
   ERROR FACTORY
========================================================= */

function createError(
    status,
    message
) {

    const error =
        new Error(
            message
        );


    error.status =
        status;


    return error;

}


/* =========================================================
   ERROR RESPONSE
========================================================= */

function sendError(
    res,
    error
) {

    console.error(
        "Route Error:",
        error
    );


    let status =
        Number(
            error?.status
        ) || 500;


    if (
        status < 400 ||
        status > 599
    ) {

        status = 500;

    }


    res.status(
        status
    ).json({

        success: false,

        error:
            error?.message ||
            "Request failed.",

        evidence:
            "Not Verifiable"

    });

}


/* =========================================================
   EXPORT
========================================================= */

module.exports =
    router;
