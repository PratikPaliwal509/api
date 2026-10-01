const axios = require("axios");

const GRAPH_API = "https://graph.facebook.com/v26.0";

/**
 * Get Meta credentials
 */
const getMetaCredentials = () => {
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!accessToken) {
        throw new Error("META_PAGE_ACCESS_TOKEN is missing");
    }

    if (!adAccountId) {
        throw new Error("META_AD_ACCOUNT_ID is missing");
    }

    return {
        accessToken,
        adAccountId,
    };
};


/**
 * Calculate percentage growth
 */
const calculateGrowth = (current, previous) => {

    current = Number(current || 0);
    previous = Number(previous || 0);

    if (previous === 0) {
        if (current === 0) return 0;

        return 100;
    }

    return ((current - previous) / previous) * 100;
};


/**
 * Get action value from Meta actions array
 */
const getActionValue = (actions = [], actionType) => {

    const action = actions.find(
        item => item.action_type === actionType
    );

    return Number(action?.value || 0);
};


/**
 * Fetch insights from Meta
 */
const fetchInsights = async ({
    accessToken,
    adAccountId,
    level,
    fromDate,
    toDate,
}) => {

    const fields = [
        "campaign_id",
        "campaign_name",
        "adset_id",
        "adset_name",
        "ad_id",
        "ad_name",
        "spend",
        "impressions",
        "reach",
        "clicks",
        "ctr",
        "cpc",
        "cpm",
        "actions",
    ].join(",");

    let allData = [];

    let url = `${GRAPH_API}/${adAccountId}/insights`;

    let params = {
        access_token: accessToken,
        level,
        fields,
        time_range: JSON.stringify({
            since: fromDate,
            until: toDate,
        }),
        limit: 500,
    };

    try {

        while (url) {

            console.log("META INSIGHTS REQUEST");
            console.log("URL:", url);
            console.log("LEVEL:", level);
            console.log("FROM:", fromDate);
            console.log("TO:", toDate);

            const response = await axios.get(url, {
                params,
            });

            const data = response.data;

            allData.push(
                ...(data.data || [])
            );

            url = data.paging?.next || null;

            params = {};
        }

        return allData;

    } catch (error) {

        console.error(
            "META INSIGHTS ERROR:",
            JSON.stringify(
                error.response?.data || error.message,
                null,
                2
            )
        );

        throw new Error(
            error.response?.data?.error?.message ||
            error.message ||
            "Failed to fetch Meta insights"
        );
    }
};


/**
 * Convert Meta insight into standard format
 */
const normalizeInsight = (item) => {

    const leads = getActionValue(
        item.actions,
        "lead"
    );

    const purchases = getActionValue(
        item.actions,
        "purchase"
    );

    return {

        campaignId:
            item.campaign_id || null,

        campaignName:
            item.campaign_name || "Unknown Campaign",

        adSetId:
            item.adset_id || null,

        adSetName:
            item.adset_name || "Unknown Ad Set",

        adId:
            item.ad_id || null,

        adName:
            item.ad_name || "Unknown Ad",

        spend:
            Number(item.spend || 0),

        impressions:
            Number(item.impressions || 0),

        reach:
            Number(item.reach || 0),

        clicks:
            Number(item.clicks || 0),

        ctr:
            Number(item.ctr || 0),

        cpc:
            Number(item.cpc || 0),

        cpm:
            Number(item.cpm || 0),

        leads,

        purchases,
    };
};


/**
 * Aggregate records
 */
const aggregateRecords = (records) => {

    const result = {

        spend: 0,

        impressions: 0,

        reach: 0,

        clicks: 0,

        leads: 0,

        purchases: 0,
    };


    for (const item of records) {

        result.spend += item.spend;

        result.impressions += item.impressions;

        result.reach += item.reach;

        result.clicks += item.clicks;

        result.leads += item.leads;

        result.purchases += item.purchases;
    }


    // Calculate derived metrics

    result.ctr =
        result.impressions > 0
            ? (result.clicks / result.impressions) * 100
            : 0;


    result.cpc =
        result.clicks > 0
            ? result.spend / result.clicks
            : 0;


    result.cpm =
        result.impressions > 0
            ? (result.spend / result.impressions) * 1000
            : 0;


    result.costPerLead =
        result.leads > 0
            ? result.spend / result.leads
            : 0;


    return result;
};


/**
 * Create comparison object
 */
const createComparison = (
    currentRecords,
    previousRecords
) => {

    const current =
        aggregateRecords(currentRecords);

    const previous =
        aggregateRecords(previousRecords);


    const growth = {

        spend: calculateGrowth(
            current.spend,
            previous.spend
        ),

        impressions: calculateGrowth(
            current.impressions,
            previous.impressions
        ),

        reach: calculateGrowth(
            current.reach,
            previous.reach
        ),

        clicks: calculateGrowth(
            current.clicks,
            previous.clicks
        ),

        leads: calculateGrowth(
            current.leads,
            previous.leads
        ),

        purchases: calculateGrowth(
            current.purchases,
            previous.purchases
        ),

        ctr: calculateGrowth(
            current.ctr,
            previous.ctr
        ),

        cpc: calculateGrowth(
            current.cpc,
            previous.cpc
        ),

        cpm: calculateGrowth(
            current.cpm,
            previous.cpm
        ),

        costPerLead: calculateGrowth(
            current.costPerLead,
            previous.costPerLead
        ),
    };


    return {
        current,
        previous,
        growth,
    };
};


/**
 * Group campaign → adset → ads
 */
const buildHierarchy = (
    currentRecords,
    previousRecords
) => {

    const campaigns = {};


    // -------------------------------
    // CURRENT
    // -------------------------------

    for (const record of currentRecords) {

        if (!record.campaignId) continue;


        if (!campaigns[record.campaignId]) {

            campaigns[record.campaignId] = {

                id: record.campaignId,

                name: record.campaignName,

                currentRecords: [],

                previousRecords: [],

                adSets: {},
            };
        }


        campaigns[
            record.campaignId
        ].currentRecords.push(record);


        if (
            record.adSetId &&
            !campaigns[
                record.campaignId
            ].adSets[record.adSetId]
        ) {

            campaigns[
                record.campaignId
            ].adSets[record.adSetId] = {

                id: record.adSetId,

                name: record.adSetName,

                currentRecords: [],

                previousRecords: [],

                ads: {},
            };
        }


        if (record.adSetId) {

            const adSet =
                campaigns[
                    record.campaignId
                ].adSets[
                record.adSetId
                ];


            adSet.currentRecords.push(
                record
            );


            if (
                record.adId &&
                !adSet.ads[record.adId]
            ) {

                adSet.ads[record.adId] = {

                    id: record.adId,

                    name: record.adName,

                    currentRecords: [],

                    previousRecords: [],
                };
            }


            if (record.adId) {

                adSet.ads[
                    record.adId
                ].currentRecords.push(
                    record
                );
            }
        }
    }


    // -------------------------------
    // PREVIOUS
    // -------------------------------

    for (const record of previousRecords) {

        if (!record.campaignId) continue;


        if (!campaigns[record.campaignId]) {

            campaigns[record.campaignId] = {

                id: record.campaignId,

                name: record.campaignName,

                currentRecords: [],

                previousRecords: [],

                adSets: {},
            };
        }


        campaigns[
            record.campaignId
        ].previousRecords.push(record);


        if (
            record.adSetId &&
            !campaigns[
                record.campaignId
            ].adSets[record.adSetId]
        ) {

            campaigns[
                record.campaignId
            ].adSets[record.adSetId] = {

                id: record.adSetId,

                name: record.adSetName,

                currentRecords: [],

                previousRecords: [],

                ads: {},
            };
        }


        if (record.adSetId) {

            const adSet =
                campaigns[
                    record.campaignId
                ].adSets[
                record.adSetId
                ];


            adSet.previousRecords.push(
                record
            );


            if (
                record.adId &&
                !adSet.ads[record.adId]
            ) {

                adSet.ads[record.adId] = {

                    id: record.adId,

                    name: record.adName,

                    currentRecords: [],

                    previousRecords: [],
                };
            }


            if (record.adId) {

                adSet.ads[
                    record.adId
                ].previousRecords.push(
                    record
                );
            }
        }
    }


    // -------------------------------
    // FORMAT RESPONSE
    // -------------------------------

    return Object.values(campaigns).map(
        campaign => {

            const campaignComparison =
                createComparison(
                    campaign.currentRecords,
                    campaign.previousRecords
                );


            const adSets =
                Object.values(
                    campaign.adSets
                ).map(adSet => {

                    const adSetComparison =
                        createComparison(
                            adSet.currentRecords,
                            adSet.previousRecords
                        );


                    const ads =
                        Object.values(
                            adSet.ads
                        ).map(ad => {

                            return {

                                id: ad.id,

                                name: ad.name,

                                ...createComparison(
                                    ad.currentRecords,
                                    ad.previousRecords
                                ),
                            };
                        });


                    return {

                        id: adSet.id,

                        name: adSet.name,

                        ...adSetComparison,

                        ads,
                    };
                });


            return {

                id: campaign.id,

                name: campaign.name,

                ...campaignComparison,

                adSets,
            };
        }
    );
};


/**
 * Main report function
 */
const generateAdsReport = async ({
    fromDate,
    toDate,
    compareType = "previous_month",
    compareFromDate,
    compareToDate,
    reportLevel
}) => {

    const {
        accessToken,
        adAccountId,
    } = getMetaCredentials();
    const metaLevel =
        reportLevel === "campaign"
            ? "campaign"
            : reportLevel === "adset"
                ? "adset"
                : "ad";
    // ==========================================
    // CURRENT PERIOD
    // ==========================================

    const currentData = await fetchInsights({
        accessToken,
        adAccountId,
        level: metaLevel,
        fromDate,
        toDate,
    });

    // ==========================================
    // COMPARISON PERIOD
    // ==========================================

    let comparisonFrom;
    let comparisonTo;

    if (compareType === "custom") {

        comparisonFrom = compareFromDate;
        comparisonTo = compareToDate;

    } else {

        // Previous period with same number of days
        const currentStart = new Date(`${fromDate}T00:00:00`);
        const currentEnd = new Date(`${toDate}T00:00:00`);

        const diffDays =
            Math.round(
                (currentEnd - currentStart) /
                (1000 * 60 * 60 * 24)
            ) + 1;

        const previousEnd =
            new Date(currentStart);

        previousEnd.setDate(
            previousEnd.getDate() - 1
        );

        const previousStart =
            new Date(previousEnd);

        previousStart.setDate(
            previousStart.getDate() - diffDays + 1
        );

        comparisonFrom =
            previousStart.toISOString()
                .split("T")[0];

        comparisonTo =
            previousEnd.toISOString()
                .split("T")[0];
    }

    if (!comparisonFrom || !comparisonTo) {

        throw new Error(
            "Comparison dates could not be determined"
        );
    }

    console.log("CURRENT:", fromDate, toDate);
    console.log(
        "COMPARISON:",
        comparisonFrom,
        comparisonTo
    );

    // ==========================================
    // PREVIOUS PERIOD
    // ==========================================

    const previousData = await fetchInsights({
        accessToken,
        adAccountId,
        level: "ad",
        fromDate: comparisonFrom,
        toDate: comparisonTo,
    });

    // ==========================================
    // NORMALIZE
    // ==========================================

    const currentRecords =
        currentData.map(normalizeInsight);

    const previousRecords =
        previousData.map(normalizeInsight);

    // ==========================================
    // SUMMARY
    // ==========================================

    const summary =
        createComparison(
            currentRecords,
            previousRecords
        );

    // ==========================================
    // HIERARCHY
    // ==========================================

    const campaigns =
        buildHierarchy(
            currentRecords,
            previousRecords
        );

    return {

        period: {
            from: fromDate,
            to: toDate,
        },

        comparison: {
            from: comparisonFrom,
            to: comparisonTo,
        },

        summary,

        campaigns,
    };
};


module.exports = {
    generateAdsReport,
};