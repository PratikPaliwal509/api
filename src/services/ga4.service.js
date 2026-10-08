const { analyticsData } = require("../config/google");


/**
 * Get overall GA4 metrics
 */
const getGA4Metrics = async (
    startDate,
    endDate,
    propertyId
) => {

    try {

        if (!propertyId) {
            throw new Error(
                "GA4 Property ID is not configured for this website"
            );
        }

        const response =
            await analyticsData.properties.runReport({

                property:
                    `properties/${propertyId}`,

                requestBody: {

                    dateRanges: [
                        {
                            startDate,
                            endDate,
                        },
                    ],

                    metrics: [
                        {
                            name: "totalUsers",
                        },
                        {
                            name: "sessions",
                        },
                        {
                            name: "screenPageViews",
                        },
                        {
                            name: "engagementRate",
                        },
                        {
                            name: "averageSessionDuration",
                        },
                    ],
                },
            });


        const row =
            response.data.rows?.[0];


        if (!row) {

            return {
                users: 0,
                sessions: 0,
                pageViews: 0,
                engagementRate: 0,
                averageSessionDuration: 0,
            };

        }


        return {

            users:
                Number(
                    row.metricValues?.[0]?.value || 0
                ),

            sessions:
                Number(
                    row.metricValues?.[1]?.value || 0
                ),

            pageViews:
                Number(
                    row.metricValues?.[2]?.value || 0
                ),

            engagementRate:
                Number(
                    (
                        Number(
                            row.metricValues?.[3]?.value || 0
                        ) * 100
                    ).toFixed(2)
                ),

            averageSessionDuration:
                Number(
                    row.metricValues?.[4]?.value || 0
                ),
        };

    } catch (error) {

        console.error(
            "GA4 Metrics Error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};


/**
 * Get organic search traffic
 */
const getOrganicTraffic = async (
    startDate,
    endDate,
    propertyId
) => {

    try {

        if (!propertyId) {
            throw new Error(
                "GA4 Property ID is not configured for this website"
            );
        }

        const response =
            await analyticsData.properties.runReport({

                property:
                    `properties/${propertyId}`,

                requestBody: {

                    dateRanges: [
                        {
                            startDate,
                            endDate,
                        },
                    ],

                    dimensions: [
                        {
                            name:
                                "sessionDefaultChannelGroup",
                        },
                    ],

                    metrics: [
                        {
                            name: "sessions",
                        },
                    ],
                },
            });


        const rows =
            response.data.rows || [];


        const organicRow =
            rows.find(
                row =>
                    row.dimensionValues?.[0]?.value ===
                    "Organic Search"
            );


        return organicRow
            ? Number(
                organicRow.metricValues?.[0]?.value || 0
            )
            : 0;

    } catch (error) {

        console.error(
            "Organic Traffic Error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};


/**
 * Get traffic by channel
 */
const getTrafficSources = async (
    startDate,
    endDate,
    propertyId
) => {

    try {

        if (!propertyId) {
            throw new Error(
                "GA4 Property ID is not configured for this website"
            );
        }

        const response =
            await analyticsData.properties.runReport({

                property:
                    `properties/${propertyId}`,

                requestBody: {

                    dateRanges: [
                        {
                            startDate,
                            endDate,
                        },
                    ],

                    dimensions: [
                        {
                            name:
                                "sessionDefaultChannelGroup",
                        },
                    ],

                    metrics: [
                        {
                            name: "sessions",
                        },
                        {
                            name: "totalUsers",
                        },
                    ],

                    orderBys: [
                        {
                            metric: {
                                metricName: "sessions",
                            },

                            desc: true,
                        },
                    ],
                },
            });


        return (
            response.data.rows || []
        ).map(row => ({

            channel:
                row.dimensionValues?.[0]?.value ||
                "Unknown",

            sessions:
                Number(
                    row.metricValues?.[0]?.value || 0
                ),

            users:
                Number(
                    row.metricValues?.[1]?.value || 0
                ),

        }));

    } catch (error) {

        console.error(
            "Traffic Sources Error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};


/**
 * Get top pages
 */
const getTopPages = async (
    startDate,
    endDate,
    propertyId
) => {

    try {

        if (!propertyId) {
            throw new Error(
                "GA4 Property ID is not configured for this website"
            );
        }

        const response =
            await analyticsData.properties.runReport({

                property:
                    `properties/${propertyId}`,

                requestBody: {

                    dateRanges: [
                        {
                            startDate,
                            endDate,
                        },
                    ],

                    dimensions: [
                        {
                            name: "pagePath",
                        },
                        {
                            name: "pageTitle",
                        },
                    ],

                    metrics: [
                        {
                            name: "screenPageViews",
                        },
                        {
                            name: "totalUsers",
                        },
                    ],

                    orderBys: [
                        {
                            metric: {
                                metricName:
                                    "screenPageViews",
                            },

                            desc: true,
                        },
                    ],

                    limit: 20,
                },
            });


        return (
            response.data.rows || []
        ).map(row => ({

            page:
                row.dimensionValues?.[0]?.value ||
                "/",

            title:
                row.dimensionValues?.[1]?.value ||
                "Untitled",

            views:
                Number(
                    row.metricValues?.[0]?.value || 0
                ),

            users:
                Number(
                    row.metricValues?.[1]?.value || 0
                ),

        }));

    } catch (error) {

        console.error(
            "Top Pages Error:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
};


module.exports = {
    getGA4Metrics,
    getOrganicTraffic,
    getTrafficSources,
    getTopPages,
};