/* =========================================================
   GitHub Developer Analyzer
   config.js — Central Configuration
========================================================= */

"use strict";

require("dotenv").config();


/* =========================================================
   HELPERS
========================================================= */

function number(
    value,
    fallback
) {

    const parsed =
        Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : fallback;

}


function boolean(
    value,
    fallback = false
) {

    if (
        value === undefined ||
        value === null
    ) {

        return fallback;

    }


    return [
        "true",
        "1",
        "yes",
        "on"
    ].includes(
        String(value)
            .trim()
            .toLowerCase()
    );

}


/* =========================================================
   ENVIRONMENT
========================================================= */

const NODE_ENV =
    process.env.NODE_ENV ||
    "development";


const IS_PRODUCTION =
    NODE_ENV ===
    "production";


/* =========================================================
   SERVER
========================================================= */

const SERVER = {

    HOST:
        process.env.HOST ||
        "0.0.0.0",

    PORT:
        number(
            process.env.PORT,
            3000
        ),

    NODE_ENV,

    IS_PRODUCTION

};


/* =========================================================
   FRONTEND
========================================================= */

const FRONTEND = {

    ORIGIN:
        process.env.FRONTEND_ORIGIN ||
        "*"

};


/* =========================================================
   GITHUB
========================================================= */

const GITHUB = {

    API_URL:
        process.env.GITHUB_API_URL ||
        "https://api.github.com",

    API_VERSION:
        process.env.GITHUB_API_VERSION ||
        "2022-11-28",

    TOKEN:
        process.env.GITHUB_TOKEN ||
        "",

    USER_AGENT:
        process.env.GITHUB_USER_AGENT ||
        "GitHub-Developer-Analyzer",

    PER_PAGE:
        number(
            process.env.GITHUB_PER_PAGE,
            100
        ),

    MAX_PAGES:
        number(
            process.env.GITHUB_MAX_PAGES,
            100
        ),

    REQUEST_TIMEOUT:
        number(
            process.env.GITHUB_REQUEST_TIMEOUT,
            30000
        )

};


/* =========================================================
   CACHE
========================================================= */

const CACHE = {

    ENABLED:
        boolean(
            process.env.CACHE_ENABLED,
            true
        ),

    TTL:
        number(
            process.env.CACHE_TTL,
            10 * 60 * 1000
        ),

    MAX_ENTRIES:
        number(
            process.env.CACHE_MAX_ENTRIES,
            100
        )

};


/* =========================================================
   ANALYSIS
========================================================= */

const ANALYSIS = {

    VERSION:
        "1.0.0",

    EVIDENCE_POLICY:
        "No evidence = Not Verifiable",

    SCORE_MAX:
        10,

    OVERALL_MAX:
        100,

    /*
     * Minimum data required before
     * attempting a developer rating.
     */

    MIN_REPOSITORIES:
        number(
            process.env.MIN_ANALYSIS_REPOSITORIES,
            1
        ),

    /*
     * Do not treat GitHub popularity
     * as developer skill.
     */

    USE_STARS_FOR_SKILL:
        false,

    USE_FOLLOWERS_FOR_SKILL:
        false,

    USE_REPOSITORY_COUNT_FOR_SKILL:
        false

};


/* =========================================================
   SECURITY
========================================================= */

const SECURITY = {

    TRUST_PROXY:
        boolean(
            process.env.TRUST_PROXY,
            false
        ),

    MAX_REQUEST_BODY:
        process.env.MAX_REQUEST_BODY ||
        "1mb",

    RATE_LIMIT_ENABLED:
        boolean(
            process.env.RATE_LIMIT_ENABLED,
            true
        ),

    RATE_LIMIT_WINDOW:
        number(
            process.env.RATE_LIMIT_WINDOW,
            15 * 60 * 1000
        ),

    RATE_LIMIT_MAX:
        number(
            process.env.RATE_LIMIT_MAX,
            100
        )

};


/* =========================================================
   API
========================================================= */

const API = {

    PREFIX:
        process.env.API_PREFIX ||
        "/api",

    VERSION:
        process.env.API_VERSION ||
        "v1"

};


/* =========================================================
   LOGGING
========================================================= */

const LOGGING = {

    ENABLED:
        boolean(
            process.env.LOGGING_ENABLED,
            true
        ),

    LEVEL:
        process.env.LOG_LEVEL ||
        (
            IS_PRODUCTION
                ? "info"
                : "debug"
        )

};


/* =========================================================
   FEATURE FLAGS
========================================================= */

const FEATURES = {

    PROFILE_ANALYSIS:
        true,

    REPOSITORY_ANALYSIS:
        true,

    CLAIM_ANALYSIS:
        true,

    COMMIT_ANALYSIS:
        true,

    ISSUE_ANALYSIS:
        true,

    PULL_REQUEST_ANALYSIS:
        true,

    CONTRIBUTOR_ANALYSIS:
        true,

    README_ANALYSIS:
        true,

    CODE_ANALYSIS:
        boolean(
            process.env.CODE_ANALYSIS_ENABLED,
            false
        ),

    SECURITY_ANALYSIS:
        boolean(
            process.env.SECURITY_ANALYSIS_ENABLED,
            false
        ),

    AI_REVIEW:
        boolean(
            process.env.AI_REVIEW_ENABLED,
            false
        )

};


/* =========================================================
   VALIDATION
========================================================= */

function validateConfig() {

    const warnings = [];


    if (
        !GITHUB.TOKEN
    ) {

        warnings.push(
            "GITHUB_TOKEN is not configured. " +
            "GitHub API rate limits may be lower."
        );

    }


    if (
        GITHUB.PER_PAGE < 1 ||
        GITHUB.PER_PAGE > 100
    ) {

        throw new Error(
            "GITHUB_PER_PAGE must be between 1 and 100."
        );

    }


    if (
        CACHE.TTL < 1000
    ) {

        throw new Error(
            "CACHE_TTL must be at least 1000ms."
        );

    }


    if (
        CACHE.MAX_ENTRIES < 1
    ) {

        throw new Error(
            "CACHE_MAX_ENTRIES must be greater than 0."
        );

    }


    return {

        valid: true,

        warnings

    };

}


/* =========================================================
   CONFIG OBJECT
========================================================= */

const CONFIG = {

    SERVER,

    FRONTEND,

    GITHUB,

    CACHE,

    ANALYSIS,

    SECURITY,

    API,

    LOGGING,

    FEATURES,

    validate:
        validateConfig

};


/* =========================================================
   STARTUP VALIDATION
========================================================= */

const validation =
    validateConfig();


if (
    validation.warnings.length
) {

    validation.warnings.forEach(
        function (warning) {

            console.warn(
                `[CONFIG] ${warning} `
            );

        }
    );

}


/* =========================================================
   EXPORT
========================================================= */

module.exports =
    Object.freeze(
        CONFIG
    );
