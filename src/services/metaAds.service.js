const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const GRAPH_API = `https://graph.facebook.com/${
    process.env.META_API_VERSION || "v23.0"
}`;

const getCredentials = () => {
    const adAccountId = String(
        process.env.META_AD_ACCOUNT_ID || ""
    ).trim();

    const accessToken = String(
        process.env.META_USER_ACCESS_TOKEN || ""
    ).trim();

    if (!adAccountId) {
        throw new Error("META_AD_ACCOUNT_ID is missing");
    }

    if (!accessToken) {
        throw new Error("META_USER_ACCESS_TOKEN is missing");
    }

    return {
        adAccountId,
        accessToken
    };
};


/**
 * Get Ad Account Details
 */
const getAdAccount = async () => {
    const { adAccountId, accessToken } = getCredentials();

    try {
        const response = await axios.get(
            `${GRAPH_API}/${adAccountId}`,
            {
                params: {
                    fields: [
                        "id",
                        "name",
                        "account_status",
                        "currency",
                        "timezone_name",
                        "amount_spent",
                        "spend_cap"
                    ].join(","),

                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {
        throw new Error(
            error.response?.data?.error?.message ||
            error.message
        );
    }
};


/**
 * Get Campaigns
 */
const getCampaigns = async () => {
    const { adAccountId, accessToken } = getCredentials();

    try {
        const response = await axios.get(
            `${GRAPH_API}/${adAccountId}/campaigns`,
            {
                params: {
                    fields: [
                        "id",
                        "name",
                        "status",
                        "objective",
                        "daily_budget",
                        "lifetime_budget",
                        "created_time",
                        "updated_time"
                    ].join(","),

                    limit: 100,

                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {
        throw new Error(
            error.response?.data?.error?.message ||
            error.message
        );
    }
};


/**
 * Get Ad Sets
 */
const getAdSets = async (campaignId = null) => {
    const { adAccountId, accessToken } = getCredentials();

    try {
        const endpoint = `${GRAPH_API}/${adAccountId}/adsets`
        // const endpoint = campaignId
        //     ? `${GRAPH_API}/${campaignId}/adsets`
        //     : `${GRAPH_API}/${adAccountId}/adsets`;

        const response = await axios.get(endpoint, {
            params: {
                fields: [
                    "id",
                    "name",
                    "campaign_id",
                    "status",
                    "daily_budget",
                    "lifetime_budget",
                    "billing_event",
                    "optimization_goal",
                    "targeting",
                    "start_time",
                    "end_time"
                ].join(","),

                limit: 100,

                access_token: accessToken
            }
        });

        return response.data;

    } catch (error) {
        throw new Error(
            error.response?.data?.error?.message ||
            error.message
        );
    }
};


/**
 * Get Ads
 */
const getAds = async (adSetId = null) => {
    const { adAccountId, accessToken } = getCredentials();

    try {
        const endpoint = adSetId
            ? `${GRAPH_API}/${adSetId}/ads`
            : `${GRAPH_API}/${adAccountId}/ads`;

        const response = await axios.get(endpoint, {
            params: {
                fields: [
                    "id",
                    "name",
                    "adset_id",
                    "campaign_id",
                    "status",
                    "creative",
                    "created_time",
                    "updated_time"
                ].join(","),

                limit: 100,

                access_token: accessToken
            }
        });

        return response.data;

    } catch (error) {
        throw new Error(
            error.response?.data?.error?.message ||
            error.message
        );
    }
};


/**
 * Get Ad Insights
 */
const getInsights = async ({
    datePreset = "last_30d",
    level = "campaign"
} = {}) => {

    const { adAccountId, accessToken } = getCredentials();

    try {
        const response = await axios.get(
            `${GRAPH_API}/${adAccountId}/insights`,
            {
                params: {
                    level,
                    date_preset: datePreset,

                    fields: [
                        "campaign_id",
                        "campaign_name",
                        "adset_id",
                        "adset_name",
                        "ad_id",
                        "ad_name",
                        "impressions",
                        "reach",
                        "clicks",
                        "spend",
                        "cpc",
                        "cpm",
                        "ctr",
                        "actions"
                    ].join(","),

                    limit: 100,

                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {
        throw new Error(
            error.response?.data?.error?.message ||
            error.message
        );
    }
};


/**
 * Create Campaign
 */
const createCampaign = async ({
    name,
    objective,
    status = "PAUSED",
    specialAdCategories = [],
    isAdsetBudgetSharingEnabled = false
}) => {

    const { adAccountId, accessToken } = getCredentials();

    if (!name) {
        throw new Error("Campaign name is required");
    }

    if (!objective) {
        throw new Error("Campaign objective is required");
    }

    try {

        const response = await axios.post(
            `${GRAPH_API}/${adAccountId}/campaigns`,
            null,
            {
                params: {
                    name,
                    objective,
                    status,

                    special_ad_categories:
                        JSON.stringify(specialAdCategories),

                    is_adset_budget_sharing_enabled:
                        isAdsetBudgetSharingEnabled,

                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META FULL ERROR:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        const metaError = error.response?.data?.error;

        throw new Error(
            metaError?.error_user_msg ||
            metaError?.message ||
            error.message
        );
    }
};

/**
 * Create Ad Set
 */
const createAdSet = async ({
    campaignId,
    name,
    dailyBudget,
    billingEvent = "IMPRESSIONS",
    optimizationGoal = "LINK_CLICKS",
    targeting,
    status = "PAUSED",
    bidStrategy = "LOWEST_COST_WITHOUT_CAP"
}) => {

    const { adAccountId, accessToken } = getCredentials();

    if (!campaignId) {
        throw new Error("campaignId is required");
    }

    if (!name) {
        throw new Error("Ad Set name is required");
    }

    if (!dailyBudget) {
        throw new Error("dailyBudget is required");
    }

    if (!targeting) {
        throw new Error("targeting is required");
    }

    try {
        const response = await axios.post(
            `${GRAPH_API}/${adAccountId}/adsets`,
            null,
            {
                params: {
                    name,
                    campaign_id: campaignId,
                    daily_budget: dailyBudget,
                    billing_event: billingEvent,
                    optimization_goal: optimizationGoal,
                    bid_strategy: bidStrategy,
                    targeting: JSON.stringify(targeting),
                    status,
                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "META AD SET FULL ERROR:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        const metaError = error.response?.data?.error;

        throw new Error(
            metaError?.error_user_msg ||
            metaError?.message ||
            error.message
        );
    }
};

// ==========================================
// GET AD CREATIVES
// ==========================================


// const getAdCreatives = async () => {
//    const adAccountId = String(
//         process.env.META_AD_ACCOUNT_ID || ""
//     ).trim();
//            const accessToken = String(
//         process.env.META_USER_ACCESS_TOKEN || ""
//     ).trim();
//     // const { adAccountId, accessToken } = getCredentials();

//     try {

//         const response = await axios.get(
//             `${GRAPH_API}/${adAccountId}/adcreatives`,
//             {
//                 params: {
//                     fields: [
//                         "id",
//                         "name",
//                         "status",
//                         "object_story_spec",
//                         "created_time",
//                         "updated_time"
//                     ].join(","),

//                     limit: 100,

//                     access_token: accessToken
//                 }
//             }
//         );

//         return response.data;

//     } catch (error) {

//         console.error(
//             "META GET CREATIVES ERROR:",
//             JSON.stringify(
//                 error.response?.data,
//                 null,
//                 2
//             )
//         );

//         const metaError =
//             error.response?.data?.error;

//         throw new Error(
//             metaError?.error_user_msg ||
//             metaError?.message ||
//             error.message
//         );
//     }
// };

/**
 * Create Ad Creative
 */
const createAdCreative = async ({
    name,
    pageId,
    message,
    imageHash,
    link
}) => {

    const { adAccountId, accessToken } = getCredentials();

    if (!name) {
        throw new Error("Creative name is required");
    }

    if (!pageId) {
        throw new Error("pageId is required");
    }

    if (!message) {
        throw new Error("message is required");
    }

    if (!imageHash) {
        throw new Error("imageHash is required");
    }

    if (!link) {
        throw new Error("link is required");
    }

    try {

        const objectStorySpec = {
            page_id: pageId,

            link_data: {
                message,
                link,
                image_hash: imageHash
            }
        };

        const response = await axios.post(
            `${GRAPH_API}/${adAccountId}/adcreatives`,
            null,
            {
                params: {
                    name,

                    object_story_spec:
                        JSON.stringify(objectStorySpec),

                    access_token: accessToken
                }
            }
        );

        return response.data;

   } catch (error) {
    console.error(
        "META CREATIVE FULL ERROR:",
        JSON.stringify(error.response?.data, null, 2)
    );

    const metaError = error.response?.data?.error;

    throw new Error(
        metaError?.error_user_msg ||
        metaError?.message ||
        error.message
    );
}
};


/**
 * Create Ad
 */
const createAd = async ({
    name,
    adSetId,
    creativeId
}) => {

    const { adAccountId, accessToken } = getCredentials();

    if (!name) {
        throw new Error("Ad name is required");
    }

    if (!adSetId) {
        throw new Error("adSetId is required");
    }

    if (!creativeId) {
        throw new Error("creativeId is required");
    }

    try {

        const response = await axios.post(
            `${GRAPH_API}/${adAccountId}/ads`,
            null,
            {
                params: {
                    name,

                    adset_id: adSetId,

                    creative: JSON.stringify({
                        creative_id: creativeId
                    }),

                    // Always create as paused
                    status: "PAUSED",

                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META CREATE AD FULL ERROR:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        const metaError =
            error.response?.data?.error;

        throw new Error(
            metaError?.error_user_msg ||
            metaError?.message ||
            error.message
        );
    }
};

const uploadAdImage = async (file) => {
    const { adAccountId, accessToken } = getCredentials();

    if (!file) {
        throw new Error("Image file is required");
    }

    try {
        const formData = new FormData();

        formData.append(
            "filename",
            file.buffer,
            {
                filename: file.originalname,
                contentType: file.mimetype
            }
        );

        formData.append(
            "access_token",
            accessToken
        );

        const response = await axios.post(
            `${GRAPH_API}/${adAccountId}/adimages`,
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META IMAGE UPLOAD ERROR:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        const metaError = error.response?.data?.error;

        throw new Error(
            metaError?.error_user_msg ||
            metaError?.message ||
            error.message
        );
    }
};

/**
 * GET CAMPAIGN BY ID
 */
const getCampaignById = async (campaignId) => {
    const { accessToken } = getCredentials();

    if (!campaignId) {
        throw new Error("campaignId is required");
    }

    try {
        const response = await axios.get(
            `${GRAPH_API}/${campaignId}`,
            {
                params: {
                    fields: [
                        "id",
                        "name",
                        "status",
                        "objective",
                        "daily_budget",
                        "lifetime_budget",
                        "created_time",
                        "updated_time",
                        "special_ad_categories",
                        "buying_type"
                    ].join(","),

                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META GET CAMPAIGN BY ID ERROR:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        const metaError =
            error.response?.data?.error;

        throw new Error(
            metaError?.error_user_msg ||
            metaError?.message ||
            error.message
        );
    }
};
const getCampaignAdSets = async (campaignId) => {
    try {
        if (!campaignId) {
            throw new Error("Campaign ID is required");
        }

        const response = await axios.get(
            `${GRAPH_API}/${campaignId}/adsets`,
            {
                params: {
                    fields: [
                        "id",
                        "name",
                        "campaign_id",
                        "status",
                        "effective_status",
                        "daily_budget",
                        "lifetime_budget",
                        "billing_event",
                        "optimization_goal",
                        "bid_strategy",
                        "targeting",
                        "start_time",
                        "end_time",
                        "created_time",
                        "updated_time"
                    ].join(","),

                    // IMPORTANT
                    access_token: process.env.META_USER_ACCESS_TOKEN
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META ADSETS ERROR:",
            JSON.stringify(
                error.response?.data || error.message,
                null,
                2
            )
        );

        throw new Error(
            error.response?.data?.error?.message ||
            error.response?.data?.error?.error_user_msg ||
            error.message ||
            "Failed to fetch campaign ad sets"
        );
    }
};

/**
 * GET SINGLE AD SET
 */

const getAdSetById = async (adSetId) => {
    try {
        if (!adSetId) {
            throw new Error("Ad Set ID is required");
        }

        if (!process.env.META_PAGE_ACCESS_TOKEN) {
            throw new Error(
                "META_PAGE_ACCESS_TOKEN is not configured"
            );
        }

        const fields = [
            "id",
            "name",
            "campaign_id",
            "account_id",
            "status",
            "configured_status",
            "effective_status",
            "daily_budget",
            "lifetime_budget",
            "budget_remaining",
            "billing_event",
            "optimization_goal",
            "bid_strategy",
            "bid_amount",
            "start_time",
            "end_time",
            "targeting",
            "promoted_object",
            "destination_type",
            "created_time",
            "updated_time"
        ].join(",");

        const url =
            `${GRAPH_API}/${adSetId}`;

        console.log("=================================");
        console.log("GET META AD SET");
        console.log("URL:", url);
        console.log("Ad Set ID:", adSetId);
        console.log("=================================");

        const response = await axios.get(url, {
            params: {
                fields,
                access_token: process.env.META_PAGE_ACCESS_TOKEN
            }
        });

        console.log(
            "Meta Ad Set Response:",
            JSON.stringify(response.data, null, 2)
        );

        return response.data;

    } catch (error) {

        console.error("=================================");
        console.error("META AD SET ERROR");
        console.error("=================================");

        console.error(
            "Status:",
            error.response?.status
        );

        console.error(
            "Meta Error:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        console.error(
            "Message:",
            error.message
        );

        console.error("=================================");

        throw error;
    }
};
/**
 * Get all ads belonging to an Ad Set
 */
const getAdSetAds = async (adSetId) => {
    try {
        if (!adSetId) {
            throw new Error("Ad Set ID is required");
        }

        const version =
            process.env.META_API_VERSION || "v26.0";

        const pageAccessToken =
            process.env.META_PAGE_ACCESS_TOKEN;

        if (!pageAccessToken) {
            throw new Error(
                "META_PAGE_ACCESS_TOKEN is not configured"
            );
        }

        const url =
            `https://graph.facebook.com/${version}/${adSetId}/ads`;

        const params = new URLSearchParams({
            fields: [
                "id",
                "name",
                "status",
                "effective_status",
                "configured_status",
                "created_time",
                "updated_time",
                "campaign_id",
                "adset_id",
                "creative{id,name}",
            ].join(","),
            access_token: pageAccessToken,
        });

        const response = await fetch(
            `${url}?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error(
                "Meta Get Ad Set Ads Error:",
                data.error || data
            );

            throw new Error(
                data?.error?.message ||
                "Failed to fetch ads from Meta"
            );
        }

        return data;

    } catch (error) {
        console.error(
            "getAdSetAds Service Error:",
            error.message
        );

        throw error;
    }
};
const getAdCreatives = async (adId) => {
    try {
        if (!adId) {
            throw new Error("Ad ID is required");
        }

        const version = process.env.META_API_VERSION || "v26.0";
        const accessToken = process.env.META_PAGE_ACCESS_TOKEN;

        if (!accessToken) {
            throw new Error("META_PAGE_ACCESS_TOKEN is not configured");
        }

        // Meta Graph API fields for Ad Creative
        const fields = [
            "id",
            "name",
            "title",
            "body",
            "object_story_spec",
            "image_url",
            "thumbnail_url",
            "video_id",
            "status"
        ].join(",");

        // Use /adcreatives edge to get creatives attached to an Ad ID
        const url = `https://graph.facebook.com/${version}/${adId}/adcreatives`;
        const params = new URLSearchParams({
            fields,
            access_token: accessToken
        });

        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(
                data?.error?.message || "Failed to fetch ad creative from Meta"
            );
        }

        // Meta returns `{ data: [ { ...creative } ] }` on the adcreatives edge
        return data.data || [];
    } catch (error) {
        console.error("getAdCreatives Service Error:", error.message);
        throw error;
    }
};
const getAdDetails = async (adId) => {
    try {
        const url = `${GRAPH_API}/${adId}`;

        const response = await axios.get(url, {
            params: {
                fields:
                    "id,name,status,effective_status,configured_status,created_time,updated_time,adset_id,campaign_id,creative",
                access_token: process.env.META_PAGE_ACCESS_TOKEN,
            },
        });

        return response.data;

    } catch (error) {
        console.error(
            "META AD DETAILS ERROR:",
            JSON.stringify(error.response?.data, null, 2)
        );

        throw error;
    }
};
const getCreativeDetails = async (creativeId) => {
    try {
        console.log(
            "Calling Meta API for creative:",
            creativeId
        );

        const response = await axios.get(
            `${GRAPH_API}/${creativeId}`,
            {
                params: {
                    fields:
                        "id,name,status,account_id,object_story_id,object_story_spec,asset_feed_spec,effective_object_story_id,thumbnail_url,image_url,video_id,call_to_action_type,link_url,body,title,url_tags,created_time,updated_time",

                    access_token: process.env.META_PAGE_ACCESS_TOKEN,
                },
            }
        );

        console.log(
            "Meta Creative Response:",
            response.data
        );

        return response.data;

    } catch (error) {
        console.error(
            "Meta Creative API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};
module.exports = {
    getAdAccount,
    getCampaigns,
    getAdSets,
    getAds,
    getAdDetails,
    getCreativeDetails,
    getCampaignById,
    getInsights,
    getAdSetAds,
    getAdCreatives,
    getCampaignAdSets,
    getAdSetById,
    createCampaign,
    // getAdCreatives,
    createAdSet,
    createAdCreative,
    createAd,
    uploadAdImage
};