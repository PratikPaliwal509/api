const axios = require("axios");

const GRAPH_API = "https://graph.facebook.com/v26.0";

const ALLOWED_SECTIONS = [
    "summary",
    "trends",
    "campaigns",
    "comparison",
    "adsets",
    "ads",
    "billing",
    "funnel",
    "insights",
    "appendix",
];

/* =====================================================
   CREDENTIALS
===================================================== */

const getMetaCredentials = () => {
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    let adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!accessToken) throw new Error("META_PAGE_ACCESS_TOKEN is missing");
    if (!adAccountId) throw new Error("META_AD_ACCOUNT_ID is missing");

    // Meta needs the "act_" prefix
    if (!String(adAccountId).startsWith("act_")) {
        adAccountId = `act_${adAccountId}`;
    }

    return { accessToken, adAccountId };
};

/* =====================================================
   DATE HELPERS (UTC based - no timezone shifting)
===================================================== */

const parseDate = (str) => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
};

const formatDate = (date) => date.toISOString().split("T")[0];

const addDays = (str, days) => {
    const d = parseDate(str);
    d.setUTCDate(d.getUTCDate() + days);
    return formatDate(d);
};

const diffDays = (from, to) =>
    Math.round((parseDate(to) - parseDate(from)) / 86400000);

const lastDayOfMonth = (year, monthIndex) =>
    new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const isLastDayOfMonth = (str) => {
    const d = parseDate(str);
    return d.getUTCDate() === lastDayOfMonth(d.getUTCFullYear(), d.getUTCMonth());
};

// Shift a date by N months (clamps day, keeps "end of month" as end of month)
const addMonths = (str, months) => {
    const d = parseDate(str);
    const wasLastDay = isLastDayOfMonth(str);
    const day = d.getUTCDate();

    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + months);

    const last = lastDayOfMonth(d.getUTCFullYear(), d.getUTCMonth());
    d.setUTCDate(wasLastDay ? last : Math.min(day, last));

    return formatDate(d);
};

const resolveComparisonRange = ({
    compareType,
    fromDate,
    toDate,
    compareFromDate,
    compareToDate,
}) => {
    switch (compareType) {
        case "none":
            return null;

        case "custom":
            return { from: compareFromDate, to: compareToDate };

        case "previous_month":
            return {
                from: addMonths(fromDate, -1),
                to: addMonths(toDate, -1),
            };

        case "previous_year":
            return {
                from: addMonths(fromDate, -12),
                to: addMonths(toDate, -12),
            };

        case "previous_period":
        default: {
            const days = diffDays(fromDate, toDate) + 1;
            return {
                from: addDays(fromDate, -days),
                to: addDays(fromDate, -1),
            };
        }
    }
};

/* =====================================================
   METRIC HELPERS
===================================================== */

// Returns null when growth cannot be calculated (previous = 0, current > 0)
const calculateGrowth = (current, previous) => {
    current = Number(current || 0);
    previous = Number(previous || 0);

    if (previous === 0) return current === 0 ? 0 : null;

    return ((current - previous) / previous) * 100;
};

const getActionValue = (actions = [], actionType) => {
    const action = actions.find((item) => item.action_type === actionType);
    return Number(action?.value || 0);
};

// Meta reports leads under different action types depending on the form/pixel
const getLeads = (actions = []) =>
    getActionValue(actions, "lead") ||
    getActionValue(actions, "onsite_conversion.lead_grouped") ||
    getActionValue(actions, "offsite_conversion.fb_pixel_lead");

/* =====================================================
   META API
===================================================== */

const fetchPaged = async (url, params) => {
    const all = [];
    let nextUrl = url;
    let nextParams = params;

    while (nextUrl) {
        const response = await axios.get(nextUrl, { params: nextParams });
        all.push(...(response.data.data || []));
        nextUrl = response.data.paging?.next || null;
        nextParams = undefined; // "next" URL already contains everything
    }

    return all;
};

const metaError = (error, fallback) => {
    console.error(
        "META ERROR:",
        JSON.stringify(error.response?.data || error.message, null, 2)
    );
    return new Error(
        error.response?.data?.error?.message || error.message || fallback
    );
};

const fetchInsights = async ({
    accessToken,
    adAccountId,
    level,
    fromDate,
    toDate,
    campaignIds = [],
    timeIncrement,
    fields,
}) => {
    const params = {
        access_token: accessToken,
        level,
        fields,
        time_range: JSON.stringify({ since: fromDate, until: toDate }),
        limit: 500,
    };

    if (timeIncrement) params.time_increment = timeIncrement;

    // Specific campaign(s) only
    if (campaignIds.length > 0) {
        params.filtering = JSON.stringify([
            { field: "campaign.id", operator: "IN", value: campaignIds },
        ]);
    }

    try {
        return await fetchPaged(`${GRAPH_API}/${adAccountId}/insights`, params);
    } catch (error) {
        throw metaError(error, "Failed to fetch Meta insights");
    }
};

const AD_LEVEL_FIELDS = [
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

const TREND_FIELDS = [
    "spend",
    "impressions",
    "reach",
    "clicks",
    "actions",
].join(",");

/**
 * All campaigns of the ad account (used by the modal selector)
 */
const getCampaignList = async () => {
    const { accessToken, adAccountId } = getMetaCredentials();

    try {
        const campaigns = await fetchPaged(
            `${GRAPH_API}/${adAccountId}/campaigns`,
            {
                access_token: accessToken,
                fields: "id,name,status,effective_status",
                limit: 500,
            }
        );

        return campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.effective_status || c.status,
        }));
    } catch (error) {
        throw metaError(error, "Failed to fetch campaigns");
    }
};

/**
 * Account info (currency / name / lifetime spent / spending limit).
 * Non-critical: report still works if this fails.
 */
const fetchAccountInfo = async ({ accessToken, adAccountId }) => {
    try {
        const response = await axios.get(`${GRAPH_API}/${adAccountId}`, {
            params: {
                access_token: accessToken,
                fields: "name,currency,amount_spent,balance,spend_cap",
            },
        });

        const d = response.data || {};

        // Meta returns these in the currency's smallest unit (e.g. paise)
        const minor = (v) =>
            v === undefined || v === null || v === "" ? null : Number(v) / 100;

        return {
            name: d.name || null,
            currency: d.currency || "INR",
            amountSpent: minor(d.amount_spent),
            balance: minor(d.balance),
            spendCap: Number(d.spend_cap) > 0 ? minor(d.spend_cap) : null,
        };
    } catch (error) {
        console.error(
            "Account info error:",
            error.response?.data || error.message
        );
        return { name: null, currency: "INR" };
    }
};

/* =====================================================
   NORMALIZE / AGGREGATE
===================================================== */

const normalizeInsight = (item) => ({
    campaignId: item.campaign_id || null,
    campaignName: item.campaign_name || "Unknown Campaign",
    adSetId: item.adset_id || null,
    adSetName: item.adset_name || "Unknown Ad Set",
    adId: item.ad_id || null,
    adName: item.ad_name || "Unknown Ad",

    spend: Number(item.spend || 0),
    impressions: Number(item.impressions || 0),
    reach: Number(item.reach || 0),
    clicks: Number(item.clicks || 0),
    ctr: Number(item.ctr || 0),
    cpc: Number(item.cpc || 0),
    cpm: Number(item.cpm || 0),

    leads: getLeads(item.actions),
    purchases: getActionValue(item.actions, "purchase"),
    landingPageViews: getActionValue(item.actions, "landing_page_view"),
});

const aggregateRecords = (records) => {
    const result = {
        spend: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        leads: 0,
        purchases: 0,
        landingPageViews: 0,
    };

    for (const r of records) {
        result.spend += r.spend;
        result.impressions += r.impressions;
        result.reach += r.reach; // NOTE: summed across ads, see README note
        result.clicks += r.clicks;
        result.leads += r.leads;
        result.purchases += r.purchases;
        result.landingPageViews += r.landingPageViews;
    }

    result.ctr =
        result.impressions > 0 ? (result.clicks / result.impressions) * 100 : 0;
    result.cpc = result.clicks > 0 ? result.spend / result.clicks : 0;
    result.cpm =
        result.impressions > 0 ? (result.spend / result.impressions) * 1000 : 0;
    result.costPerLead = result.leads > 0 ? result.spend / result.leads : 0;

    return result;
};

const GROWTH_KEYS = [
    "spend",
    "impressions",
    "reach",
    "clicks",
    "leads",
    "purchases",
    "ctr",
    "cpc",
    "cpm",
    "costPerLead",
];

const createComparison = (currentRecords, previousRecords, withComparison) => {
    const current = aggregateRecords(currentRecords);

    if (!withComparison) {
        return { current, previous: null, growth: null };
    }

    const previous = aggregateRecords(previousRecords);
    const growth = {};

    GROWTH_KEYS.forEach((key) => {
        growth[key] = calculateGrowth(current[key], previous[key]);
    });

    return { current, previous, growth };
};

/* =====================================================
   HIERARCHY: Campaign -> Ad Set -> Ad
===================================================== */

const getOrCreate = (map, id, factory) => {
    if (!map.has(id)) map.set(id, factory());
    return map.get(id);
};

const newNode = (id, name, extra = {}) => ({
    id,
    name,
    currentRecords: [],
    previousRecords: [],
    ...extra,
});

const buildHierarchy = (currentRecords, previousRecords, withComparison) => {
    const campaigns = new Map();

    const ingest = (records, bucket) => {
        for (const r of records) {
            if (!r.campaignId) continue;

            const campaign = getOrCreate(campaigns, r.campaignId, () =>
                newNode(r.campaignId, r.campaignName, { adSets: new Map() })
            );
            campaign[bucket].push(r);

            if (!r.adSetId) continue;

            const adSet = getOrCreate(campaign.adSets, r.adSetId, () =>
                newNode(r.adSetId, r.adSetName, { ads: new Map() })
            );
            adSet[bucket].push(r);

            if (!r.adId) continue;

            const ad = getOrCreate(adSet.ads, r.adId, () =>
                newNode(r.adId, r.adName)
            );
            ad[bucket].push(r);
        }
    };

    ingest(currentRecords, "currentRecords");
    if (withComparison) ingest(previousRecords, "previousRecords");

    const format = (node) => ({
        id: node.id,
        name: node.name,
        ...createComparison(
            node.currentRecords,
            node.previousRecords,
            withComparison
        ),
    });

    const bySpend = (a, b) => b.current.spend - a.current.spend;

    return Array.from(campaigns.values())
        .map((campaign) => ({
            ...format(campaign),
            adSets: Array.from(campaign.adSets.values())
                .map((adSet) => ({
                    ...format(adSet),
                    ads: Array.from(adSet.ads.values())
                        .map(format)
                        .sort(bySpend),
                }))
                .sort(bySpend),
        }))
        .sort(bySpend);
};

/* =====================================================
   MAIN
===================================================== */

const generateAdsReport = async ({
    fromDate,
    toDate,
    compareType = "previous_period",
    compareFromDate,
    compareToDate,
    campaignIds = [],
    sections = ALLOWED_SECTIONS,
}) => {
    const credentials = getMetaCredentials();
    const { accessToken, adAccountId } = credentials;

    const comparison = resolveComparisonRange({
        compareType,
        fromDate,
        toDate,
        compareFromDate,
        compareToDate,
    });
    const withComparison = !!comparison;

    console.log("REPORT CURRENT :", fromDate, toDate);
    console.log("REPORT COMPARE :", comparison);
    console.log("REPORT CAMPAIGNS:", campaignIds.length ? campaignIds : "ALL");

    const base = { accessToken, adAccountId, campaignIds };

    // Fetch everything in parallel
    const [
        currentData,
        previousData,
        dailyData,
        accountInfo,
        campaignList,
    ] = await Promise.all([
        // current period, AD level (campaign/adset/ad are all built from this)
        fetchInsights({
            ...base,
            level: "ad",
            fromDate,
            toDate,
            fields: AD_LEVEL_FIELDS,
        }),

        // comparison period
        withComparison
            ? fetchInsights({
                ...base,
                level: "ad",
                fromDate: comparison.from,
                toDate: comparison.to,
                fields: AD_LEVEL_FIELDS,
            })
            : Promise.resolve([]),

        // daily trend (only if the section is selected)
        sections.includes("trends")
            ? fetchInsights({
                ...base,
                level: "account",
                fromDate,
                toDate,
                timeIncrement: 1,
                fields: TREND_FIELDS,
            })
            : Promise.resolve([]),

        fetchAccountInfo(credentials),

        // names for the selected campaigns
        campaignIds.length > 0 ? getCampaignList() : Promise.resolve([]),
    ]);

    const currentRecords = currentData.map(normalizeInsight);
    const previousRecords = previousData.map(normalizeInsight);

    const summary = createComparison(
        currentRecords,
        previousRecords,
        withComparison
    );

    const campaigns = buildHierarchy(
        currentRecords,
        previousRecords,
        withComparison
    );

    const dailyTrend = dailyData
        .map((d) => ({
            date: d.date_start,
            spend: Number(d.spend || 0),
            impressions: Number(d.impressions || 0),
            reach: Number(d.reach || 0),
            clicks: Number(d.clicks || 0),
            leads: getLeads(d.actions),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const days = diffDays(fromDate, toDate) + 1;

    const counts = {
        campaigns: campaigns.length,
        adSets: campaigns.reduce((n, c) => n + c.adSets.length, 0),
        ads: campaigns.reduce(
            (n, c) => n + c.adSets.reduce((m, s) => m + s.ads.length, 0),
            0
        ),
    };

    const selectedCampaigns = campaignIds.map((id) => ({
        id,
        name:
            campaignList.find((c) => c.id === id)?.name ||
            campaigns.find((c) => c.id === id)?.name ||
            id,
    }));

    return {
        account: accountInfo,
        currency: accountInfo.currency || "INR",

        scope: {
            type: campaignIds.length > 0 ? "selected" : "all",
            campaigns: selectedCampaigns,
        },

        sections,
        counts,

        period: { from: fromDate, to: toDate, days },
        comparison: comparison
            ? { ...comparison, type: compareType }
            : null,

        summary,
        campaigns,
        dailyTrend,

        billing: {
            totalSpend: summary.current.spend,
            days,
            averageDailySpend: days > 0 ? summary.current.spend / days : 0,
            costPerLead: summary.current.costPerLead,
            accountAmountSpent: accountInfo.amountSpent ?? null,
            accountBalance: accountInfo.balance ?? null,
            accountSpendCap: accountInfo.spendCap ?? null,
        },
    };
};

module.exports = {
    generateAdsReport,
    getCampaignList,
    ALLOWED_SECTIONS,
};
