const { searchConsole } = require("../config/google");

const getSearchPerformance = async (startDate, endDate, siteUrl) => {
    try {
        if (!siteUrl) {
            throw new Error("GSC site URL is required");
        }

        const response = await searchConsole.searchanalytics.query({
            siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions: [],
                rowLimit: 1,
            },
        });

        const row = response.data.rows?.[0];

        return {
            clicks: row?.clicks || 0,
            impressions: row?.impressions || 0,
            ctr: row?.ctr || 0,
            position: row?.position || 0,
        };
    } catch (error) {
        console.error(
            "GSC SEARCH PERFORMANCE ERROR:",
            error.response?.data || error.message
        );

        throw error;
    }
};


const getKeywordRankings = async (startDate, endDate, siteUrl) => {
    try {
        if (!siteUrl) {
            throw new Error("GSC site URL is required");
        }

        const response = await searchConsole.searchanalytics.query({
            siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions: ["query"],
                rowLimit: 100,
                orderBy: [
                    {
                        field: "impressions",
                        descending: true,
                    },
                ],
            },
        });

        return (response.data.rows || []).map((row) => ({
            keyword: row.keys?.[0] || "",
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: Number((row.position || 0).toFixed(1)),
        }));
    } catch (error) {
        console.error(
            "GSC KEYWORD RANKINGS ERROR:",
            error.response?.data || error.message
        );

        throw error;
    }
};


const getKeywordPages = async (startDate, endDate, siteUrl) => {
    try {
        if (!siteUrl) {
            throw new Error("GSC site URL is required");
        }

        const response = await searchConsole.searchanalytics.query({
            siteUrl,
            requestBody: {
                startDate,
                endDate,
                dimensions: ["query", "page"],
                rowLimit: 100,
                orderBy: [
                    {
                        field: "impressions",
                        descending: true,
                    },
                ],
            },
        });

        return (response.data.rows || []).map((row) => ({
            keyword: row.keys?.[0] || "",
            page: row.keys?.[1] || "",
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: Number((row.position || 0).toFixed(1)),
        }));
    } catch (error) {
        console.error(
            "GSC KEYWORD PAGES ERROR:",
            error.response?.data || error.message
        );

        throw error;
    }
};


module.exports = {
    getSearchPerformance,
    getKeywordRankings,
    getKeywordPages,
};