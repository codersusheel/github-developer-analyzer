const cache = require("./cache");

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

            const key =
                cache.analysisKey(
                    username
                );

            const result =
                await cache.getOrSet(
                    key,
                    async function () {

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

                        const projects =
                            analysis.analyzeProjects(
                                repositories
                            );

                        const developer =
                            analysis.analyzeDeveloper({
                                profile,
                                repositories
                            });

                        return {

                            profile,

                            repositories: {

                                total:
                                    repositories.length,

                                projects

                            },

                            analysis:
                                developer

                        };

                    }
                );

            res.json({

                success: true,

                ...result,

                metadata: {

                    evidencePolicy:
                        "No evidence = Not Verifiable"

                }

            });

        } catch (error) {

            sendError(
                res,
                error
            );

        }

    }
);