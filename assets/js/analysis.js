/* =========================================================
   GitHub Developer Analyzer
   analysis.js — Evidence Based Analysis Engine
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {

        MAX_REPOSITORIES:
            100,

        SCORE_MAX:
            10,

        RATING_MAX:
            100

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function number(
        value,
        fallback = 0
    ) {

        const n =
            Number(value);

        return Number.isFinite(n)
            ? n
            : fallback;

    }


    function hasValue(
        value
    ) {

        return (
            value !== null &&
            value !== undefined &&
            value !== ""
        );

    }


    function average(
        values
    ) {

        const valid =
            values.filter(
                Number.isFinite
            );


        if (!valid.length) {

            return null;

        }


        return (
            valid.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / valid.length
        );

    }


    function round(
        value,
        digits = 1
    ) {

        if (
            !Number.isFinite(value)
        ) {

            return null;

        }


        const factor =
            Math.pow(
                10,
                digits
            );


        return (
            Math.round(
                value * factor
            ) / factor
        );

    }


    function clamp(
        value,
        min = 0,
        max = 10
    ) {

        return Math.min(
            max,
            Math.max(
                min,
                number(value)
            )
        );

    }


    function text(
        value
    ) {

        if (!hasValue(value)) {

            return "Not Verifiable";

        }


        return String(value);

    }


    /* =====================================================
       REPOSITORY DATA
    ===================================================== */

    function getRepositories(
        data
    ) {

        if (
            !Array.isArray(
                data?.repositories
            )
        ) {

            return [];

        }


        return data.repositories
            .slice(
                0,
                CONFIG.MAX_REPOSITORIES
            );

    }


    /* =====================================================
       LANGUAGE ANALYSIS
    ===================================================== */

    function analyzeLanguages(
        repositories
    ) {

        const languageCount =
            {};

        let repositoriesWithLanguage =
            0;


        repositories.forEach(
            repo => {

                const language =
                    repo.language;


                if (
                    hasValue(language)
                ) {

                    repositoriesWithLanguage++;


                    const key =
                        String(
                            language
                        );


                    languageCount[key] =
                        (
                            languageCount[key] ||
                            0
                        ) + 1;

                }

            }
        );


        const sorted =
            Object.entries(
                languageCount
            )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


        return {

            totalLanguages:
                sorted.length,

            repositoriesWithLanguage,

            languages:
                sorted.map(
                    ([name, count]) => ({
                        name,
                        count,
                        percentage:
                            round(
                                (
                                    count /
                                    Math.max(
                                        repositories.length,
                                        1
                                    )
                                ) * 100,
                                1
                            )
                    })
                ),

            primary:
                sorted.length
                    ? sorted[0][0]
                    : null

        };

    }


    /* =====================================================
       REPOSITORY CLASSIFICATION
    ===================================================== */

    function classifyRepository(
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


        const pushedAt =
            repo.pushed_at ||
            repo.updated_at;


        if (!pushedAt) {

            return "Not Verifiable";

        }


        const date =
            new Date(
                pushedAt
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Not Verifiable";

        }


        const age =
            Date.now() -
            date.getTime();


        const days =
            age /
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
       PROJECT STATUS
    ===================================================== */

    function analyzeProjectStatus(
        repositories
    ) {

        const result = {

            active: 0,

            newProjects: 0,

            old: 0,

            abandoned: 0,

            archived: 0,

            forks: 0,

            notVerifiable: 0

        };


        repositories.forEach(
            repo => {

                const status =
                    classifyRepository(
                        repo
                    );


                switch (status) {

                    case "Active":

                        result.active++;

                        break;


                    case "Old":

                        result.old++;

                        break;


                    case "Old / Abandoned":

                        result.abandoned++;

                        break;


                    case "Old / Archived":

                        result.archived++;

                        break;


                    case "Fork":

                        result.forks++;

                        break;


                    default:

                        result.notVerifiable++;

                }


                /*
                 * New project
                 */

                if (
                    repo.created_at
                ) {

                    const created =
                        new Date(
                            repo.created_at
                        );


                    if (
                        !Number.isNaN(
                            created.getTime()
                        )
                    ) {

                        const days =
                            (
                                Date.now() -
                                created.getTime()
                            ) /
                            (1000 * 60 * 60 * 24);


                        if (
                            days <= 180 &&
                            !repo.fork
                        ) {

                            result.newProjects++;

                        }

                    }

                }

            }
        );


        return result;

    }


    /* =====================================================
       DOCUMENTATION
    ===================================================== */

    function analyzeDocumentation(
        repositories
    ) {

        let withDescription =
            0;

        let withHomepage =
            0;

        let withTopics =
            0;

        let withReadme =
            0;


        repositories.forEach(
            repo => {

                if (
                    hasValue(
                        repo.description
                    )
                ) {

                    withDescription++;

                }


                if (
                    hasValue(
                        repo.homepage
                    )
                ) {

                    withHomepage++;

                }


                if (
                    Array.isArray(
                        repo.topics
                    ) &&
                    repo.topics.length
                ) {

                    withTopics++;

                }


                /*
                 * Backend may provide this.
                 */

                if (
                    repo.has_readme === true ||
                    repo.readme === true
                ) {

                    withReadme++;

                }

            }
        );


        const total =
            repositories.length;


        return {

            descriptions:
                withDescription,

            homepages:
                withHomepage,

            topics:
                withTopics,

            readmes:
                withReadme,

            coverage:
                total
                    ? round(
                        (
                            withDescription /
                            total
                        ) * 100,
                        1
                    )
                    : null

        };

    }


    /* =====================================================
       CODE / COMPLEXITY SIGNALS
    ===================================================== */

    function analyzeComplexity(
        repositories
    ) {

        if (!repositories.length) {

            return {

                score:
                    null,

                level:
                    "Not Verifiable",

                signals:
                    []

            };

        }


        let scoreTotal =
            0;


        const signals =
            [];


        repositories.forEach(
            repo => {

                let score = 0;


                /*
                 * Repository size
                 */

                const size =
                    number(
                        repo.size
                    );


                if (size > 1000) {

                    score += 2;

                } else if (size > 300) {

                    score += 1.5;

                } else if (size > 50) {

                    score += 1;

                }


                /*
                 * Multiple languages
                 */

                if (
                    repo.languages &&
                    typeof repo.languages ===
                    "object"
                ) {

                    const count =
                        Object.keys(
                            repo.languages
                        ).length;


                    if (count >= 4) {

                        score += 2;

                    } else if (count >= 2) {

                        score += 1;

                    }

                }


                /*
                 * Issues
                 */

                if (
                    number(
                        repo.open_issues_count
                    ) > 0
                ) {

                    score += 0.5;

                }


                /*
                 * Topics
                 */

                if (
                    Array.isArray(
                        repo.topics
                    ) &&
                    repo.topics.length >= 3
                ) {

                    score += 0.5;

                }


                score =
                    clamp(
                        score
                    );


                scoreTotal +=
                    score;

            }
        );


        const score =
            clamp(
                scoreTotal /
                repositories.length
            );


        let level;


        if (score >= 8) {

            level = "High";

        } else if (score >= 5) {

            level = "Medium";

        } else {

            level = "Basic";

        }


        signals.push(
            "Repository size",
            "Technology diversity",
            "Issue activity",
            "Project metadata"
        );


        return {

            score:
                round(score),

            level,

            signals

        };

    }


    /* =====================================================
       DEVELOPMENT EFFORT
    ===================================================== */

    function analyzeEffort(
        data,
        repositories
    ) {

        const activity =
            data?.activity ||
            {};


        const commits =
            number(
                activity.commits ??
                data?.commit_count,
                null
            );


        const contributions =
            number(
                activity.contributions,
                null
            );


        const repoCount =
            repositories.length;


        const signals =
            [];


        let scoreValues =
            [];


        /*
         * Commit evidence
         */

        if (
            Number.isFinite(
                commits
            )
        ) {

            if (commits >= 1000) {

                scoreValues.push(10);

            } else if (commits >= 500) {

                scoreValues.push(9);

            } else if (commits >= 200) {

                scoreValues.push(8);

            } else if (commits >= 100) {

                scoreValues.push(7);

            } else if (commits >= 30) {

                scoreValues.push(5);

            } else {

                scoreValues.push(3);

            }


            signals.push(
                "Commit history"
            );

        }


        /*
         * Contribution evidence
         */

        if (
            Number.isFinite(
                contributions
            )
        ) {

            scoreValues.push(
                clamp(
                    Math.log10(
                        contributions + 1
                    ) * 3
                )
            );


            signals.push(
                "Contribution history"
            );

        }


        /*
         * Repository count
         *
         * Low weight because repository
         * count alone must not determine
         * developer capability.
         */

        if (repoCount) {

            scoreValues.push(
                clamp(
                    Math.min(
                        repoCount,
                        20
                    ) / 2
                )
            );


            signals.push(
                "Project breadth"
            );

        }


        const score =
            average(
                scoreValues
            );


        return {

            score:
                score === null
                    ? null
                    : round(
                        clamp(score)
                    ),

            commits:
                Number.isFinite(
                    commits
                )
                    ? commits
                    : null,

            contributions:
                Number.isFinite(
                    contributions
                )
                    ? contributions
                    : null,

            signals

        };

    }


    /* =====================================================
       OPEN SOURCE / TEAM ANALYSIS
    ===================================================== */

    function analyzeCollaboration(
        data
    ) {

        const collaboration =
            data?.collaboration ||
            {};


        const contributors =
            collaboration.contributors;


        const pullRequests =
            collaboration.pull_requests ??
            data?.pull_requests;


        const issues =
            collaboration.issues ??
            data?.issues;


        const teamProjects =
            collaboration.team_projects;


        return {

            contributors:
                hasValue(
                    contributors
                )
                    ? number(
                        contributors
                    )
                    : null,

            pullRequests:
                hasValue(
                    pullRequests
                )
                    ? number(
                        pullRequests
                    )
                    : null,

            issues:
                hasValue(
                    issues
                )
                    ? number(
                        issues
                    )
                    : null,

            teamProjects:
                hasValue(
                    teamProjects
                )
                    ? number(
                        teamProjects
                    )
                    : null

        };

    }


    /* =====================================================
       ORIGINALITY SIGNALS
    ===================================================== */

    function analyzeOriginality(
        repositories
    ) {

        if (!repositories.length) {

            return {

                score:
                    null,

                original:
                    null,

                forks:
                    0,

                signals:
                    []

            };

        }


        const forks =
            repositories.filter(
                repo =>
                    repo.fork === true
            ).length;


        const original =
            repositories.length -
            forks;


        const originalRatio =
            original /
            repositories.length;


        /*
         * This is only a signal.
         *
         * Fork status does NOT prove
         * that a project is original.
         */

        const score =
            clamp(
                originalRatio * 10
            );


        return {

            score:
                round(score),

            original,

            forks,

            ratio:
                round(
                    originalRatio * 100,
                    1
                ),

            signals: [

                "Fork metadata",

                "Repository ownership",

                "Project history"

            ]

        };

    }


    /* =====================================================
       CLAIM VS EVIDENCE
    ===================================================== */

    function analyzeClaims(
        data,
        repositories
    ) {

        const claims =
            data?.claims ||
            data?.profile?.claims ||
            [];


        if (!Array.isArray(claims)) {

            return {

                supported: 0,

                partial: 0,

                unsupported: 0,

                notVerifiable: 0,

                details: []

            };

        }


        const result = {

            supported: 0,

            partial: 0,

            unsupported: 0,

            notVerifiable: 0,

            details: []

        };


        claims.forEach(
            claim => {

                const status =
                    String(
                        claim.status ||
                        "Not Verifiable"
                    );


                const normalized =
                    status
                        .toLowerCase()
                        .replace(
                            /-/g,
                            " "
                        );


                if (
                    normalized.includes(
                        "supported"
                    ) &&
                    !normalized.includes(
                        "partial"
                    )
                ) {

                    result.supported++;

                } else if (
                    normalized.includes(
                        "partial"
                    )
                ) {

                    result.partial++;

                } else if (
                    normalized.includes(
                        "unsupported"
                    )
                ) {

                    result.unsupported++;

                } else {

                    result.notVerifiable++;

                }


                result.details.push({

                    claim:
                        text(
                            claim.claim ||
                            claim.text
                        ),

                    status:
                        status,

                    evidence:
                        text(
                            claim.evidence
                        )

                });

            }
        );


        /*
         * If no claim evidence exists,
         * never invent a result.
         */

        if (
            !result.details.length
        ) {

            result.notVerifiable = 0;

        }


        return result;

    }


    /* =====================================================
       SECURITY
    ===================================================== */

    function analyzeSecurity(
        data,
        repositories
    ) {

        const security =
            data?.security ||
            {};


        /*
         * Prefer backend evidence
         * when available.
         */

        if (
            hasValue(
                security.score
            )
        ) {

            return {

                score:
                    clamp(
                        number(
                            security.score
                        )
                    ),

                level:
                    text(
                        security.level
                    ),

                evidence:
                    security.evidence ||
                    []

            };

        }


        /*
         * Frontend cannot inspect actual
         * source code securely.
         *
         * Therefore we only provide
         * repository metadata signals.
         */

        if (!repositories.length) {

            return {

                score:
                    null,

                level:
                    "Not Verifiable",

                evidence:
                    []

            };

        }


        let score = 5;


        const evidence = [];


        const disabled =
            repositories.filter(
                repo =>
                    repo.disabled === true
            ).length;


        const archived =
            repositories.filter(
                repo =>
                    repo.archived === true
            ).length;


        if (!disabled) {

            score += 1;

            evidence.push(
                "No disabled repositories detected."
            );

        }


        if (
            archived <
            repositories.length
        ) {

            score += 0.5;

        }


        score =
            clamp(score);


        return {

            score:
                round(score),

            level:
                score >= 8
                    ? "Good"
                    : score >= 5
                        ? "Moderate"
                        : "Weak",

            evidence

        };

    }


    /* =====================================================
       DOCUMENTATION SCORE
    ===================================================== */

    function documentationScore(
        documentation
    ) {

        if (
            !documentation
        ) {

            return null;

        }


        const total =
            number(
                documentation.total ||
                documentation.repositories
            );


        /*
         * Description coverage is the
         * strongest metadata signal.
         */

        if (
            !total &&
            !hasValue(
                documentation.coverage
            )
        ) {

            return null;

        }


        const coverage =
            hasValue(
                documentation.coverage
            )
                ? number(
                    documentation.coverage
                )
                : 0;


        return round(
            clamp(
                coverage / 10
            )
        );

    }


    /* =====================================================
       CODE QUALITY
    ===================================================== */

    function calculateCodeQuality(
        data,
        complexity,
        documentation,
        security
    ) {

        /*
         * Prefer backend AI/source-code
         * evidence if available.
         */

        if (
            hasValue(
                data?.code_quality?.score
            )
        ) {

            return clamp(
                number(
                    data.code_quality.score
                )
            );

        }


        const values = [];


        if (
            complexity?.score !== null
        ) {

            values.push(
                complexity.score
            );

        }


        const docs =
            documentationScore(
                documentation
            );


        if (docs !== null) {

            values.push(
                docs
            );

        }


        if (
            security?.score !== null
        ) {

            values.push(
                security.score
            );

        }


        return average(
            values
        );

    }


    /* =====================================================
       PROBLEM SOLVING
    ===================================================== */

    function calculateProblemSolving(
        data,
        repositories,
        complexity,
        effort
    ) {

        if (
            hasValue(
                data?.problem_solving?.score
            )
        ) {

            return clamp(
                number(
                    data.problem_solving.score
                )
            );

        }


        const values = [];


        if (
            complexity?.score !== null
        ) {

            values.push(
                complexity.score
            );

        }


        if (
            effort?.score !== null
        ) {

            values.push(
                effort.score
            );

        }


        /*
         * Useful project metadata.
         */

        const usefulProjects =
            repositories.filter(
                repo =>
                    hasValue(
                        repo.description
                    ) &&
                    !repo.fork
            ).length;


        if (repositories.length) {

            values.push(
                clamp(
                    (
                        usefulProjects /
                        repositories.length
                    ) * 10
                )
            );

        }


        return average(
            values
        );

    }


    /* =====================================================
       GIT / GITHUB SCORE
    ===================================================== */

    function calculateGitHubScore(
        data,
        collaboration,
        effort
    ) {

        if (
            hasValue(
                data?.github_score
            )
        ) {

            return clamp(
                number(
                    data.github_score
                )
            );

        }


        const values = [];


        if (
            effort?.score !== null
        ) {

            values.push(
                effort.score
            );

        }


        if (
            collaboration
        ) {

            if (
                Number.isFinite(
                    collaboration.pullRequests
                )
            ) {

                values.push(
                    clamp(
                        Math.log10(
                            collaboration.pullRequests +
                            1
                        ) * 4
                    )
                );

            }


            if (
                Number.isFinite(
                    collaboration.issues
                )
            ) {

                values.push(
                    clamp(
                        Math.log10(
                            collaboration.issues +
                            1
                        ) * 3
                    )
                );

            }

        }


        return average(
            values
        );

    }


    /* =====================================================
       RATING
    ===================================================== */

    function calculateRating(
        scores
    ) {

        /*
         * IMPORTANT:
         *
         * Stars, followers and repository
         * count are intentionally NOT used
         * as direct developer skill scores.
         */

        const dimensions = [

            scores.codingSkill,

            scores.codeQuality,

            scores.complexity,

            scores.developmentEffort,

            scores.originality,

            scores.problemSolving,

            scores.github,

            scores.documentation,

            scores.security

        ];


        const valid =
            dimensions.filter(
                value =>
                    Number.isFinite(
                        value
                    )
            );


        if (!valid.length) {

            return {

                overall:
                    null,

                percentage:
                    null

            };

        }


        const averageScore =
            average(
                valid
            );


        return {

            overall:
                round(
                    averageScore * 10
                ),

            percentage:
                round(
                    averageScore * 10
                ),

            dimensions:
                {

                    coding_skill:
                        scores.codingSkill,

                    code_quality:
                        scores.codeQuality,

                    complexity:
                        scores.complexity,

                    development_effort:
                        scores.developmentEffort,

                    originality:
                        scores.originality,

                    problem_solving:
                        scores.problemSolving,

                    github:
                        scores.github,

                    documentation:
                        scores.documentation,

                    security:
                        scores.security

                }

        };

    }


    /* =====================================================
       DEVELOPER LEVEL
    ===================================================== */

    function getDeveloperLevel(
        rating
    ) {

        if (
            !Number.isFinite(
                rating
            )
        ) {

            return "Not Verifiable";

        }


        if (rating >= 90) {

            return "Expert";

        }


        if (rating >= 80) {

            return "Advanced";

        }


        if (rating >= 65) {

            return "Intermediate";

        }


        if (rating >= 45) {

            return "Developing";

        }


        return "Beginner";

    }


    /* =====================================================
       PROJECT IMPORTANCE
    ===================================================== */

    function projectImportance(
        repo
    ) {

        if (!repo) {

            return {
                level:
                    "Not Verifiable",
                score:
                    null
            };

        }


        let score = 0;


        /*
         * Project metadata
         */

        if (
            hasValue(
                repo.description
            )
        ) {

            score += 2;

        }


        if (
            hasValue(
                repo.language
            )
        ) {

            score += 1;

        }


        if (
            repo.size &&
            number(repo.size) > 100
        ) {

            score += 2;

        }


        if (
            number(
                repo.open_issues_count
            ) > 0
        ) {

            score += 1;

        }


        if (
            number(
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


        if (
            repo.archived
        ) {

            score -= 1;

        }


        score =
            clamp(
                score
            );


        let level;


        if (score >= 8) {

            level = "High";

        } else if (score >= 5) {

            level = "Medium";

        } else {

            level = "Basic";

        }


        return {

            level,

            score

        };

    }


    /* =====================================================
       PROJECT ANALYSIS
    ===================================================== */

    function analyzeProjects(
        repositories
    ) {

        return repositories.map(
            repo => {

                const importance =
                    projectImportance(
                        repo
                    );


                return {

                    name:
                        text(
                            repo.name
                        ),

                    description:
                        text(
                            repo.description
                        ),

                    language:
                        text(
                            repo.language
                        ),

                    status:
                        classifyRepository(
                            repo
                        ),

                    fork:
                        Boolean(
                            repo.fork
                        ),

                    archived:
                        Boolean(
                            repo.archived
                        ),

                    stars:
                        number(
                            repo.stargazers_count
                        ),

                    forks:
                        number(
                            repo.forks_count
                        ),

                    issues:
                        number(
                            repo.open_issues_count
                        ),

                    importance:
                        importance.level,

                    importanceScore:
                        importance.score,

                    url:
                        repo.html_url ||
                        null

                };

            }
        );

    }


    /* =====================================================
       STRONG / MEDIUM / BASIC PROJECTS
    ===================================================== */

    function summarizeProjects(
        projects
    ) {

        const summary = {

            strong: 0,

            medium: 0,

            basic: 0,

            oldAbandoned: 0,

            forks: 0

        };


        projects.forEach(
            project => {

                if (
                    project.importance ===
                    "High"
                ) {

                    summary.strong++;

                } else if (
                    project.importance ===
                    "Medium"
                ) {

                    summary.medium++;

                } else {

                    summary.basic++;

                }


                if (
                    project.status ===
                    "Old / Abandoned"
                ) {

                    summary.oldAbandoned++;

                }


                if (
                    project.fork
                ) {

                    summary.forks++;

                }

            }
        );


        return summary;

    }


    /* =====================================================
       COMPLETE ANALYSIS
    ===================================================== */

    function analyze(
        data
    ) {

        const repositories =
            getRepositories(
                data
            );


        const languages =
            analyzeLanguages(
                repositories
            );


        const projectStatus =
            analyzeProjectStatus(
                repositories
            );


        const documentation =
            analyzeDocumentation(
                repositories
            );


        const complexity =
            analyzeComplexity(
                repositories
            );


        const effort =
            analyzeEffort(
                data,
                repositories
            );


        const collaboration =
            analyzeCollaboration(
                data
            );


        const originality =
            analyzeOriginality(
                repositories
            );


        const claims =
            analyzeClaims(
                data,
                repositories
            );


        const security =
            analyzeSecurity(
                data,
                repositories
            );


        const codeQuality =
            calculateCodeQuality(
                data,
                complexity,
                documentation,
                security
            );


        const problemSolving =
            calculateProblemSolving(
                data,
                repositories,
                complexity,
                effort
            );


        const githubScore =
            calculateGitHubScore(
                data,
                collaboration,
                effort
            );


        const scores = {

            codingSkill:
                codeQuality,

            codeQuality,

            complexity:
                complexity.score,

            developmentEffort:
                effort.score,

            originality:
                originality.score,

            problemSolving,

            github:
                githubScore,

            documentation:
                documentationScore(
                    documentation
                ),

            security:
                security.score

        };


        const rating =
            calculateRating(
                scores
            );


        const level =
            getDeveloperLevel(
                rating.overall
            );


        const projects =
            analyzeProjects(
                repositories
            );


        const projectSummary =
            summarizeProjects(
                projects
            );


        return {

            analyzedAt:
                new Date().toISOString(),

            repositories:
                {

                    total:
                        repositories.length,

                    projects,

                    summary:
                        projectSummary

                },

            languages,

            projectStatus,

            documentation,

            complexity,

            effort,

            collaboration,

            originality,

            claims,

            security,

            scores,

            rating,

            developerLevel:
                level

        };

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.GitHubAnalysis = {

        analyze,

        languages:
            analyzeLanguages,

        projectStatus:
            analyzeProjectStatus,

        projects:
            analyzeProjects,

        claims:
            analyzeClaims,

        originality:
            analyzeOriginality,

        security:
            analyzeSecurity,

        rating:
            calculateRating,

        developerLevel:
            getDeveloperLevel

    };


})();
