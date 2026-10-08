const {
    getGA4Metrics,
    getOrganicTraffic,
    getTrafficSources,
    getTopPages,
} = require("../services/ga4.service");


const {
    getSearchPerformance,
    getKeywordRankings,
    getKeywordPages,
} = require("../services/searchConsole.service");


const {
    getWebsiteConfig,
    normalizeUrl,
} = require("../config/website.config");


const calculateChange = (
    current,
    previous
) => {

    if (!previous) {
        return 0;
    }

    return Number(
        (
            ((current - previous) / previous) *
            100
        ).toFixed(1)
    );
};


const generateSEOReport = async (req, res) => {

    try {

        const {
            siteUrl,
            currentStart,
            currentEnd,
            previousStart,
            previousEnd,
        } = req.query;


        /*
        ==========================================
        VALIDATION
        ==========================================
        */

        if (
            !siteUrl ||
            !currentStart ||
            !currentEnd ||
            !previousStart ||
            !previousEnd
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "siteUrl, currentStart, currentEnd, previousStart and previousEnd are required",

            });

        }


        /*
        ==========================================
        WEBSITE CONFIG
        ==========================================
        */

        const website =
            getWebsiteConfig(siteUrl);


        if (!website) {

            return res.status(400).json({

                success: false,

                message:
                    `Website is not configured: ${siteUrl}`,

            });

        }


        const ga4PropertyId =
            website.ga4PropertyId;


        const gscSiteUrl =
            website.gscSiteUrl ||
            siteUrl;


        if (!ga4PropertyId) {

            return res.status(400).json({

                success: false,

                message:
                    `GA4 Property ID is not configured for ${siteUrl}`,

            });

        }


        /*
        ==========================================
        CURRENT PERIOD
        ==========================================
        */

        const [
            currentGA4,
            currentOrganic,
            currentGSC,
            currentKeywords,
            currentTrafficSources,
            currentTopPages,
        ] = await Promise.all([

            getGA4Metrics(
                currentStart,
                currentEnd,
                ga4PropertyId
            ),

            getOrganicTraffic(
                currentStart,
                currentEnd,
                ga4PropertyId
            ),

            getSearchPerformance(
                currentStart,
                currentEnd,
                gscSiteUrl
            ),

            getKeywordRankings(
                currentStart,
                currentEnd,
                gscSiteUrl
            ),

            getTrafficSources(
                currentStart,
                currentEnd,
                ga4PropertyId
            ),

            getTopPages(
                currentStart,
                currentEnd,
                ga4PropertyId
            ),

        ]);


        /*
        ==========================================
        PREVIOUS PERIOD
        ==========================================
        */

        const [
            previousGA4,
            previousOrganic,
            previousGSC,
            previousKeywords,
        ] = await Promise.all([

            getGA4Metrics(
                previousStart,
                previousEnd,
                ga4PropertyId
            ),

            getOrganicTraffic(
                previousStart,
                previousEnd,
                ga4PropertyId
            ),

            getSearchPerformance(
                previousStart,
                previousEnd,
                gscSiteUrl
            ),

            getKeywordRankings(
                previousStart,
                previousEnd,
                gscSiteUrl
            ),

        ]);


        /*
        ==========================================
        KEYWORD COMPARISON
        ==========================================
        */

        const previousKeywordMap =
            new Map(
                previousKeywords.map(keyword => [
                    keyword.keyword,
                    keyword,
                ])
            );


        const keywordComparison =
            currentKeywords.map(keyword => {

                const previous =
                    previousKeywordMap.get(
                        keyword.keyword
                    );


                return {

                    keyword:
                        keyword.keyword,

                    currentPosition:
                        keyword.position,

                    previousPosition:
                        previous?.position ??
                        null,

                    positionChange:
                        previous
                            ? Number(
                                (
                                    previous.position -
                                    keyword.position
                                ).toFixed(1)
                            )
                            : null,

                    clicks:
                        keyword.clicks,

                    impressions:
                        keyword.impressions,

                    ctr:
                        keyword.ctr,

                };

            });


        /*
        ==========================================
        FINAL REPORT
        ==========================================
        */

        const report = {

            website: {

                url: siteUrl,

                normalizedUrl:
                    normalizeUrl(siteUrl),

                ga4PropertyId,

                gscSiteUrl,

            },


            period: {

                current: {

                    start:
                        currentStart,

                    end:
                        currentEnd,

                },

                previous: {

                    start:
                        previousStart,

                    end:
                        previousEnd,

                },

            },


            metricComparison: {

                totalTraffic: {

                    metric:
                        "Total Traffic",

                    current:
                        currentGA4.sessions,

                    previous:
                        previousGA4.sessions,

                    change:
                        calculateChange(
                            currentGA4.sessions,
                            previousGA4.sessions
                        ),

                },


                totalOrganicTraffic: {

                    metric:
                        "Total Organic Traffic",

                    current:
                        currentOrganic,

                    previous:
                        previousOrganic,

                    change:
                        calculateChange(
                            currentOrganic,
                            previousOrganic
                        ),

                },


                clicks: {

                    metric:
                        "Clicks",

                    current:
                        currentGSC.clicks,

                    previous:
                        previousGSC.clicks,

                    change:
                        calculateChange(
                            currentGSC.clicks,
                            previousGSC.clicks
                        ),

                },


                impressions: {

                    metric:
                        "Impressions",

                    current:
                        currentGSC.impressions,

                    previous:
                        previousGSC.impressions,

                    change:
                        calculateChange(
                            currentGSC.impressions,
                            previousGSC.impressions
                        ),

                },


                ctr: {

                    metric:
                        "CTR",

                    current:
                        currentGSC.ctr,

                    previous:
                        previousGSC.ctr,

                    change:
                        calculateChange(
                            currentGSC.ctr,
                            previousGSC.ctr
                        ),

                },


                avgPosition: {

                    metric:
                        "Avg. Position",

                    current:
                        currentGSC.position,

                    previous:
                        previousGSC.position,

                    change:
                        calculateChange(
                            currentGSC.position,
                            previousGSC.position
                        ),

                },

            },


            keywordRanking:
                keywordComparison,


            trafficSources:
                currentTrafficSources,


            topPages:
                currentTopPages,

        };


        return res.json({

            success: true,

            data: report,

        });

    } catch (error) {

        console.error(
            "SEO REPORT ERROR:",
            error.response?.data ||
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to generate SEO report",

            error:
                error.response?.data ||
                error.message,

        });

    }
};


module.exports = {
    generateSEOReport,
};