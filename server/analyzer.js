/* =========================================================
   GitHub Developer Analyzer
   analyzer.js — Main Analysis Engine
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const Analyzer = {

    VERSION: "1.0.0",

    EVIDENCE_POLICY:
        "No evidence = Not Verifiable",

    SCORE_MAX:
        10,

    OVERALL_MAX:
        100

};


/* =========================================================
   SAFE HELPERS
========================================================= */

function safeArray(value) {

    return Array.isArray(value)
        ? value
        : [];

}


function safeNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;

}


function safeString(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value).trim();

}


function clamp(
    value,
    min = 0,
    max = 10
) {

    return Math.max(
        min,
        Math.min(
            max,
            safeNumber(
                value
            )
        )
    );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function dateValue(
    value
) {

    if (!value) {

        return 0;

    }


    const time =
        new Date(
            value
        ).getTime();


    return Number.isFinite(
        time
    )
        ? time
        : 0;

}


function daysSince(
    value
) {

    const timestamp =
        dateValue(
            value
        );


    if (!timestamp) {

        return null;

    }


    return Math.floor(
        (
            Date.now() -
            timestamp
        ) /
        86400000
    );

}


/* =========================================================
   REPOSITORY STATUS
========================================================= */

function getRepositoryStatus(
    repo
) {

    if (!repo) {

        return "Not Verifiable";

    }


    if (
        repo.archived === true
    ) {

        return "Archived";

    }


    const days =
        daysSince(
            repo.pushed_at ||
            repo.updated_at
        );


    if (
        days === null
    ) {

        return "Not Verifiable";

    }


    if (
        days <= 30
    ) {

        return "Active";

    }


    if (
        days <= 180
    ) {

        return "Maintained";

    }


    if (
        days <= 365
    ) {

        return "Old";

    }


    return "Abandoned";

}


/* =========================================================
   FORK / ORIGINAL
========================================================= */

function getProjectType(
    repo
) {

    if (!repo) {

        return "Not Verifiable";

    }


    if (
        repo.fork === true
    ) {

        return "Fork";

    }


    return "Original";

}


/* =========================================================
   TECHNOLOGY DETECTION
========================================================= */

function detectTechnologies(
    repositories
) {

    const technologies =
        new Set();


    safeArray(
        repositories
    ).forEach(
        function (repo) {

            if (
                repo.language
            ) {

                technologies.add(
                    repo.language
                );

            }


            safeArray(
                repo.topics
            ).forEach(
                function (topic) {

                    technologies.add(
                        topic
                    );

                }
            );

        }
    );


    return Array.from(
        technologies
    ).sort(
        function (a, b) {

            return a.localeCompare(
                b
            );

        }
    );

}


/* =========================================================
   LANGUAGE STATISTICS
========================================================= */

function calculateLanguages(
    repositories
) {

    const languages =
        {};


    safeArray(
        repositories
    ).forEach(
        function (repo) {

            const language =
                safeString(
                    repo.language
                );


            if (!language) {

                return;

            }


            languages[language] =
                (
                    languages[language] ||
                    0
                ) + 1;

        }
    );


    return languages;

}


/* =========================================================
   PROJECT CLASSIFICATION
========================================================= */

function classifyRepository(
    repo
) {

    const stars =
        safeNumber(
            repo.stargazers_count
        );


    const size =
        safeNumber(
            repo.size
        );


    const forks =
        safeNumber(
            repo.forks_count
        );


    const issues =
        safeNumber(
            repo.open_issues_count
        );


    const language =
        Boolean(
            repo.language
        );


    /*
     * This is NOT a claim about actual
     * code complexity. It is only a
     * GitHub metadata signal.
     */

    let score = 0;


    if (stars >= 10) {
        score += 2;
    }

    if (stars >= 50) {
        score += 1;
    }

    if (forks >= 3) {
        score += 1;
    }

    if (size >= 100) {
        score += 2;
    }

    if (size >= 1000) {
        score += 2;
    }

    if (issues > 0) {
        score += 1;
    }

    if (language) {
        score += 1;
    }


    if (score >= 7) {

        return "Strong";

    }


    if (score >= 4) {

        return "Medium";

    }


    return "Basic";

}


/* =========================================================
   CLAIM ANALYSIS
========================================================= */

function analyzeClaim(
    repo
) {

    const description =
        safeString(
            repo.description
        );


    const topics =
        safeArray(
            repo.topics
        );


    const language =
        safeString(
            repo.language
        );


    /*
     * Metadata alone cannot prove
     * a full-stack claim.
     */

    const text =
        (
            description +
            " " +
            topics.join(" ")
        )
            .toLowerCase();


    const frontendSignals =
        [
            "react",
            "vue",
            "angular",
            "frontend",
            "nextjs",
            "next.js",
            "html",
            "css"
        ];


    const backendSignals =
        [
            "node",
            "nodejs",
            "express",
            "django",
            "flask",
            "laravel",
            "php",
            "backend",
            "api"
        ];


    const databaseSignals =
        [
            "mysql",
            "mongodb",
            "postgresql",
            "postgres",
            "firebase",
            "database",
            "sql"
        ];


    const hasFrontend =
        frontendSignals.some(
            function (item) {

                return text.includes(
                    item
                );

            }
        );


    const hasBackend =
        backendSignals.some(
            function (item) {

                return text.includes(
                    item
                );

            }
        );


    const hasDatabase =
        databaseSignals.some(
            function (item) {

                return text.includes(
                    item
                );

            }
        );


    const fullStackClaim =
        /full[\s-]?stack/i.test(
            text
        );


    if (
        !fullStackClaim
    ) {

        return {

            status:
                "Not Verifiable",

            claim:
                description ||
                "No explicit claim found.",

            evidence:
                "No explicit full-stack claim was detected."

        };

    }


    if (
        hasFrontend &&
        hasBackend &&
        hasDatabase
    ) {

        return {

            status:
                "Supported",

            claim:
                description,

            evidence:
                "Frontend, backend and database signals were detected in repository metadata."

        };

    }


    const missing = [];


    if (!hasFrontend) {

        missing.push(
            "Frontend"
        );

    }


    if (!hasBackend) {

        missing.push(
            "Backend"
        );

    }


    if (!hasDatabase) {

        missing.push(
            "Database"
        );

    }


    return {

        status:
            "Partially Supported",

        claim:
            description,

        evidence:
            `Missing or unverified: ${missing.join(
                ", "
            )}.`

    };

}


/* =========================================================
   PROJECT ANALYSIS
========================================================= */

function analyzeProjects(
    repositories
) {

    return safeArray(
        repositories
    ).map(
        function (repo) {

            const claim =
                analyzeClaim(
                    repo
                );


            return {

                ...repo,

                status:
                    getRepositoryStatus(
                        repo
                    ),

                projectType:
                    getProjectType(
                        repo
                    ),

                classification:
                    classifyRepository(
                        repo
                    ),

                claimAnalysis:
                    claim

            };

        }
    );

}


/* =========================================================
   PROJECT SUMMARY
========================================================= */

function createProjectSummary(
    projects
) {

    const summary = {

        total:
            projects.length,

        strong:
            0,

        medium:
            0,

        basic:
            0,

        active:
            0,

        old:
            0,

        abandoned:
            0,

        archived:
            0,

        forks:
            0,

        original:
            0

    };


    projects.forEach(
        function (project) {

            switch (
            project.classification
            ) {

                case "Strong":
                    summary.strong++;
                    break;

                case "Medium":
                    summary.medium++;
                    break;

                default:
                    summary.basic++;

            }


            switch (
            project.status
            ) {

                case "Active":
                    summary.active++;
                    break;

                case "Old":
                    summary.old++;
                    break;

                case "Abandoned":
                    summary.abandoned++;
                    break;

                case "Archived":
                    summary.archived++;
                    break;

            }


            if (
                project.projectType ===
                "Fork"
            ) {

                summary.forks++;

            } else {

                summary.original++;

            }

        }
    );


    return summary;

}


/* =========================================================
   DEVELOPMENT CONSISTENCY
========================================================= */

function calculateConsistency(
    repositories
) {

    const dates =
        safeArray(
            repositories
        )
            .map(
                function (repo) {

                    return dateValue(
                        repo.pushed_at
                    );

                }
            )
            .filter(
                Boolean
            )
            .sort(
                function (a, b) {

                    return a - b;

                }
            );


    if (
        dates.length < 2
    ) {

        return null;

    }


    let activePeriods = 0;


    for (
        let i = 1;
        i < dates.length;
        i++
    ) {

        const difference =
            (
                dates[i] -
                dates[i - 1]
            ) /
            86400000;


        if (
            difference <= 90
        ) {

            activePeriods++;

        }

    }


    const ratio =
        activePeriods /
        (
            dates.length - 1
        );


    return clamp(
        ratio * 10
    );

}


/* =========================================================
   DEVELOPMENT EFFORT
========================================================= */

function calculateEffort(
    repositories
) {

    if (
        !repositories.length
    ) {

        return null;

    }


    let score = 0;


    repositories.forEach(
        function (repo) {

            const size =
                safeNumber(
                    repo.size
                );


            const commits =
                safeNumber(
                    repo.commit_count
                );


            if (
                size >= 100
            ) {

                score += 1;

            }


            if (
                size >= 1000
            ) {

                score += 1;

            }


            if (
                commits >= 10
            ) {

                score += 1;

            }


            if (
                commits >= 50
            ) {

                score += 1;

            }

        }
    );


    return clamp(
        score /
        repositories.length *
        2
    );

}


/* =========================================================
   GITHUB PRACTICE SCORE
========================================================= */

function calculateGitHubScore(
    profile,
    repositories
) {

    if (
        !profile
    ) {

        return null;

    }


    let score = 5;


    if (
        repositories.length >= 3
    ) {

        score += 1;

    }


    if (
        repositories.length >= 10
    ) {

        score += 1;

    }


    if (
        safeNumber(
            profile.followers
        ) >= 10
    ) {

        score += 0.5;

    }


    const forks =
        repositories.filter(
            function (repo) {

                return repo.fork === true;

            }
        ).length;


    const originals =
        repositories.length -
        forks;


    if (
        originals > forks
    ) {

        score += 1;

    }


    return clamp(
        score
    );

}


/* =========================================================
   DOCUMENTATION SCORE
========================================================= */

function calculateDocumentation(
    repositories
) {

    if (
        !repositories.length
    ) {

        return null;

    }


    let documented = 0;


    repositories.forEach(
        function (repo) {

            if (
                safeString(
                    repo.description
                )
            ) {

                documented++;

            }

        }
    );


    return clamp(
        (
            documented /
            repositories.length
        ) *
        10
    );

}


/* =========================================================
   ORIGINALITY
========================================================= */

function calculateOriginality(
    repositories
) {

    if (
        !repositories.length
    ) {

        return null;

    }


    const original =
        repositories.filter(
            function (repo) {

                return repo.fork !== true;

            }
        ).length;


    return clamp(
        (
            original /
            repositories.length
        ) *
        10
    );

}


/* =========================================================
   COMPLEXITY SIGNAL
========================================================= */

function calculateComplexity(
    repositories
) {

    if (
        !repositories.length
    ) {

        return null;

    }


    let score = 0;


    repositories.forEach(
        function (repo) {

            const size =
                safeNumber(
                    repo.size
                );


            const topics =
                safeArray(
                    repo.topics
                ).length;


            const issues =
                safeNumber(
                    repo.open_issues_count
                );


            if (
                size >= 100
            ) {

                score += 1;

            }


            if (
                size >= 1000
            ) {

                score += 1;

            }


            if (
                topics >= 2
            ) {

                score += 0.5;

            }


            if (
                issues > 0
            ) {

                score += 0.5;

            }

        }
    );


    return clamp(
        (
            score /
            repositories.length
        ) *
        3
    );

}


/* =========================================================
   FINAL SCORE
========================================================= */

function calculateOverall(
    scores
) {

    const values =
        Object.values(
            scores
        )
            .filter(
                function (value) {

                    return Number.isFinite(
                        Number(value)
                    );

                }
            );


    if (
        !values.length
    ) {

        return null;

    }


    const average =
        values.reduce(
            function (
                total,
                value
            ) {

                return total +
                    Number(value);

            },
            0
        ) /
        values.length;


    return Math.round(
        (
            average /
            10
        ) *
        100
    );

}


/* =========================================================
   DEVELOPER LEVEL
========================================================= */

function getDeveloperLevel(
    score
) {

    if (
        score === null
    ) {

        return "Not Verifiable";

    }


    if (
        score >= 90
    ) {

        return "Expert";

    }


    if (
        score >= 75
    ) {

        return "Advanced";

    }


    if (
        score >= 60
    ) {

        return "Intermediate";

    }


    if (
        score >= 40
    ) {

        return "Developing";

    }


    return "Beginner";

}


/* =========================================================
   STRENGTHS
========================================================= */

function getStrengths(
    scores,
    projects
) {

    const strengths = [];


    if (
        scores.codingSkill >= 8
    ) {

        strengths.push(
            "Strong technical skill signals"
        );

    }


    if (
        scores.complexity >= 8
    ) {

        strengths.push(
            "Projects show strong complexity signals"
        );

    }


    if (
        scores.github >= 8
    ) {

        strengths.push(
            "Good GitHub development practices"
        );

    }


    if (
        scores.documentation >= 8
    ) {

        strengths.push(
            "Good repository documentation"
        );

    }


    if (
        projects.some(
            function (project) {

                return (
                    project.classification ===
                    "Strong"
                );

            }
        )
    ) {

        strengths.push(
            "Multiple strong project signals"
        );

    }


    return strengths;

}


/* =========================================================
   WEAKNESSES
========================================================= */

function getWeaknesses(
    scores,
    summary
) {

    const weaknesses = [];


    if (
        scores.documentation < 5
    ) {

        weaknesses.push(
            "Repository documentation needs improvement"
        );

    }


    if (
        scores.originality < 5
    ) {

        weaknesses.push(
            "Many repositories are fork-based"
        );

    }


    if (
        summary.abandoned > 0
    ) {

        weaknesses.push(
            `${summary.abandoned} project(s) appear inactive or abandoned`
        );

    }


    if (
        scores.consistency !== null &&
        scores.consistency < 5
    ) {

        weaknesses.push(
            "Development activity appears inconsistent"
        );

    }


    return weaknesses;

}


/* =========================================================
   MAIN ANALYZER
========================================================= */

function analyzeDeveloper(
    data
) {

    if (
        !data ||
        typeof data !==
        "object"
    ) {

        throw new Error(
            "Developer analysis data is required."
        );

    }


    const profile =
        data.profile ||
        null;


    const repositories =
        safeArray(
            data.repositories
        );


    /*
     * Analyze every repository.
     */

    const projects =
        analyzeProjects(
            repositories
        );


    const summary =
        createProjectSummary(
            projects
        );


    /*
     * Technology data.
     */

    const technologies =
        detectTechnologies(
            repositories
        );


    const languages =
        calculateLanguages(
            repositories
        );


    /*
     * Scores.
     *
     * These are evidence-based signals,
     * not absolute measurements of a person.
     */

    const scores = {

        codingSkill:
            calculateCodingSkill(
                repositories
            ),

        codeQuality:
            calculateCodeQuality(
                repositories
            ),

        complexity:
            calculateComplexity(
                repositories
            ),

        developmentEffort:
            calculateEffort(
                repositories
            ),

        originality:
            calculateOriginality(
                repositories
            ),

        problemSolving:
            calculateProblemSolving(
                repositories
            ),

        github:
            calculateGitHubScore(
                profile,
                repositories
            ),

        documentation:
            calculateDocumentation(
                repositories
            ),

        security:
            null,

        consistency:
            calculateConsistency(
                repositories
            )

    };


    const overall =
        calculateOverall(
            scores
        );


    return {

        version:
            Analyzer.VERSION,

        evidencePolicy:
            Analyzer.EVIDENCE_POLICY,

        developerLevel:
            getDeveloperLevel(
                overall
            ),

        rating: {

            overall,

            max:
                Analyzer.OVERALL_MAX

        },

        scores,

        technologies,

        languages,

        repositories: {

            summary,

            projects

        },

        strengths:
            getStrengths(
                scores,
                projects
            ),

        weaknesses:
            getWeaknesses(
                scores,
                summary
            )

    };

}


/* =========================================================
   CODING SKILL
========================================================= */

function calculateCodingSkill(
    repositories
) {

    if (
        !repositories.length
    ) {

        return null;

    }


    let score = 0;


    repositories.forEach(
        function (repo) {

            if (
                repo.language
            ) {

                score += 1;

            }


            if (
                safeNumber(
                    repo.size
                ) >= 100
            ) {

                score += 1;

            }


            if (
                safeNumber(
                    repo.stargazers_count
                ) >= 5
            ) {

                score += 1;

            }

        }
    );


    return clamp(
        (
            score /
            repositories.length
        ) *
        3
    );

}


/* =========================================================
   CODE QUALITY
========================================================= */

function calculateCodeQuality(
    repositories
) {

    if (
        !repositories.length
    ) {

        return null;

    }


    let score = 5;


    repositories.forEach(
        function (repo) {

            if (
                repo.license
            ) {

                score += 0.25;

            }


            if (
                repo.description
            ) {

                score += 0.25;

            }


            if (
                repo.default_branch
            ) {

                score += 0.25;

            }

        }
    );


    return clamp(
        score
    );

}


/* =========================================================
   PROBLEM SOLVING
========================================================= */

function calculateProblemSolving(
    repositories
) {

    if (
        !repositories.length
    ) {

        return null;

    }


    let score = 4;


    repositories.forEach(
        function (repo) {

            if (
                safeNumber(
                    repo.open_issues_count
                ) > 0
            ) {

                score += 0.3;

            }


            if (
                safeNumber(
                    repo.forks_count
                ) > 0
            ) {

                score += 0.3;

            }


            if (
                safeNumber(
                    repo.stargazers_count
                ) > 5
            ) {

                score += 0.4;

            }

        }
    );


    return clamp(
        score
    );

}


/* =========================================================
   SECURITY
========================================================= */

function calculateSecurity(
    repositoryData
) {

    /*
     * Security cannot be reliably scored
     * from basic repository metadata alone.
     *
     * Keep it Not Verifiable until the
     * code/security scanner provides evidence.
     */

    if (
        !repositoryData
    ) {

        return null;

    }


    return null;

}


/* =========================================================
   EXPORT
========================================================= */

if (
    typeof module !==
    "undefined" &&
    module.exports
) {

    module.exports = {

        analyzeDeveloper,

        analyzeProjects,

        createProjectSummary,

        detectTechnologies,

        calculateLanguages,

        calculateOverall,

        getDeveloperLevel,

        getRepositoryStatus,

        getProjectType,

        calculateSecurity

    };

}


/* =========================================================
   BROWSER EXPORT
========================================================= */

if (
    typeof window !==
    "undefined"
) {

    window.GitHubAnalyzer =
    {

        analyzeDeveloper,

        analyzeProjects,

        createProjectSummary,

        detectTechnologies,

        calculateLanguages,

        calculateOverall,

        getDeveloperLevel,

        getRepositoryStatus,

        getProjectType,

        calculateSecurity

    };

}
