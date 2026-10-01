const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const GRAPH_API = `https://graph.facebook.com/${process.env.META_API_VERSION || "v23.0"
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
    bidStrategy = "LOWEST_COST_WITHOUT_CAP",
    bidAmount
}) => {

    const { adAccountId, accessToken } = getCredentials();
    console.log("req.on" + `${GRAPH_API}/${adAccountId}/adsets`)
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

    // =========================================
    // BUILD META PARAMETERS
    // =========================================

    const params = {

        name,

        campaign_id:
            campaignId,

        daily_budget:
            Number(dailyBudget),

        billing_event:
            billingEvent,

        optimization_goal:
            optimizationGoal,

        bid_strategy:
            bidStrategy,

        targeting:
            JSON.stringify(targeting),

        status,

        access_token:
            accessToken
    };

    if (
        bidStrategy === "LOWEST_COST_WITH_BID_CAP" ||
        bidStrategy === "TARGET_COST"
    ) {
        if (!bidAmount) {
            throw new Error(
                "bidAmount is required for the selected bid strategy"
            );
        }

        params.bid_amount = bidAmount;
    }
    try {


        const response = await axios.post(
            `${GRAPH_API}/${adAccountId}/adsets`,
            null,
            {
                params
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


        const response = await axios.get(url, {
            params: {
                fields,
                access_token: process.env.META_PAGE_ACCESS_TOKEN
            }
        });

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

        return response.data;

    } catch (error) {
        console.error(
            "Meta Creative API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};

// ==========================================
// DELETE CAMPAIGN
// ==========================================

const deleteCampaign = async (campaignId) => {

    const { accessToken } = getCredentials();

    if (!campaignId) {
        throw new Error("campaignId is required");
    }

    try {

        const response = await axios.delete(
            `${GRAPH_API}/${campaignId}`,
            {
                params: {
                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META DELETE CAMPAIGN ERROR:",
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
// DELETE AD SET
// ==========================================

const deleteAdSet = async (adSetId) => {

    const { accessToken } = getCredentials();

    if (!adSetId) {
        throw new Error("adSetId is required");
    }

    try {

        const response = await axios.delete(
            `${GRAPH_API}/${adSetId}`,
            {
                params: {
                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META DELETE AD SET ERROR:",
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
// DELETE AD
// ==========================================

const deleteAd = async (adId) => {

    const { accessToken } = getCredentials();

    if (!adId) {
        throw new Error("adId is required");
    }

    try {

        const response = await axios.delete(
            `${GRAPH_API}/${adId}`,
            {
                params: {
                    access_token: accessToken
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META DELETE AD ERROR:",
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
// DELETE CREATIVE + ITS IMAGE
// ==========================================

// ==========================================
// DELETE CREATIVE + ITS IMAGE
// ==========================================

const deleteCreative = async (creativeId) => {

    const { adAccountId, accessToken } =
        getCredentials();

    if (!creativeId) {
        throw new Error("creativeId is required");
    }

    let imageHash = null;
    let creativeDeleteResponse = null;
    let imageDeleteResponse = null;

    try {

        // ==========================================
        // 1. GET CREATIVE DETAILS
        // ==========================================

        const creativeResponse = await axios.get(
            `${GRAPH_API}/${creativeId}`,
            {
                params: {
                    fields:
                        "id,name,object_story_spec",
                    access_token: accessToken
                }
            }
        );

        const creative = creativeResponse.data;

        console.log(
            "CREATIVE BEFORE DELETE:",
            JSON.stringify(creative, null, 2)
        );

        // ==========================================
        // 2. EXTRACT IMAGE HASH
        // ==========================================

        imageHash =
            creative?.object_story_spec
                ?.link_data?.image_hash ||
            creative?.object_story_spec
                ?.photo_data?.image_hash ||
            null;

        console.log(
            "IMAGE HASH FOUND:",
            imageHash
        );

        // ==========================================
        // 3. DELETE CREATIVE
        // ==========================================

        const creativeDelete =
            await axios.delete(
                `${GRAPH_API}/${creativeId}`,
                {
                    params: {
                        access_token: accessToken
                    }
                }
            );

        // IMPORTANT:
        // Store only response.data
        creativeDeleteResponse =
            creativeDelete.data;

        console.log(
            "CREATIVE DELETE RESPONSE:",
            creativeDeleteResponse
        );

        // ==========================================
        // 4. DELETE IMAGE
        // ==========================================

        if (imageHash) {

            try {

                console.log(
                    "DELETING IMAGE HASH:",
                    imageHash
                );

                const imageDelete =
                    await axios.delete(
                        `${GRAPH_API}/${adAccountId}/adimages`,
                        {
                            params: {
                                hash: imageHash,
                                access_token: accessToken
                            }
                        }
                    );

                // IMPORTANT:
                // Do NOT store complete Axios response
                imageDeleteResponse =
                    imageDelete.data;

                console.log(
                    "IMAGE DELETE RESPONSE:",
                    imageDeleteResponse
                );

            } catch (imageError) {

                console.error(
                    "META IMAGE DELETE ERROR:",
                    JSON.stringify(
                        imageError.response?.data ||
                        imageError.message,
                        null,
                        2
                    )
                );

                imageDeleteResponse = {
                    success: false,
                    error:
                        imageError.response?.data?.error ||
                        imageError.message
                };
            }

        } else {

            console.log(
                "No image hash found for creative"
            );

            imageDeleteResponse = {
                success: false,
                message:
                    "No image hash found"
            };
        }

        // ==========================================
        // 5. FINAL RESULT
        // ==========================================

        return {
            creativeDeleted:
                creativeDeleteResponse?.success === true,

            creative:
                creativeDeleteResponse,

            imageHash,

            imageDeleted:
                imageDeleteResponse?.success === true,

            imageDeleteResponse
        };

    } catch (error) {

        console.error(
            "META DELETE CREATIVE ERROR:",
            JSON.stringify(
                error.response?.data ||
                error.message,
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
const updateCampaign = async (campaignId, {
    name,
    status,
    daily_budget,
    lifetime_budget
}) => {

    const { accessToken } = getCredentials();

    if (!campaignId) {
        throw new Error("campaignId is required");
    }

    const params = {
        access_token: accessToken
    };

    if (name !== undefined) {
        params.name = name;
    }

    if (status !== undefined) {
        params.status = status;
    }

    if (daily_budget !== undefined) {
        params.daily_budget = daily_budget;
    }

    if (lifetime_budget !== undefined) {
        params.lifetime_budget = lifetime_budget;
    }

    try {

        const response = await axios.post(
            `${GRAPH_API}/${campaignId}`,
            null,
            {
                params
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META UPDATE CAMPAIGN ERROR:",
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
const updateAdSet = async (adSetId, {
    name,
    status,
    daily_budget,
    lifetime_budget,
    targeting,
    bid_strategy,
    bid_amount,
    start_time,
    end_time
}) => {

    const { accessToken } = getCredentials();

    if (!adSetId) {
        throw new Error("adSetId is required");
    }

    const params = {
        access_token: accessToken
    };

    if (name !== undefined) {
        params.name = name;
    }

    if (status !== undefined) {
        params.status = status;
    }

    if (daily_budget !== undefined) {
        params.daily_budget = daily_budget;
    }

    if (lifetime_budget !== undefined) {
        params.lifetime_budget = lifetime_budget;
    }

    if (targeting !== undefined) {
        params.targeting = JSON.stringify(targeting);
    }

    if (bid_strategy !== undefined) {
        params.bid_strategy = bid_strategy;
    }

    if (bid_amount !== undefined) {
        params.bid_amount = bid_amount;
    }

    if (start_time !== undefined) {
        params.start_time = start_time;
    }

    if (end_time !== undefined) {
        params.end_time = end_time;
    }

    try {

        const response = await axios.post(
            `${GRAPH_API}/${adSetId}`,
            null,
            {
                params
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META UPDATE AD SET ERROR:",
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
const updateAd = async (adId, {
    name,
    status,
    creative
}) => {

    const { accessToken } = getCredentials();

    if (!adId) {
        throw new Error("adId is required");
    }

    const params = {
        access_token: accessToken
    };

    if (name !== undefined) {
        params.name = name;
    }

    if (status !== undefined) {
        params.status = status;
    }

    if (creative !== undefined) {

        params.creative =
            typeof creative === "string"
                ? creative
                : JSON.stringify(creative);
    }

    try {

        const response = await axios.post(
            `${GRAPH_API}/${adId}`,
            null,
            {
                params
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "META UPDATE AD ERROR:",
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
const updateCreative = async (
    creativeId,
    {
        name,
        message,
        link
    }
) => {
    const { accessToken } = getCredentials();

    if (!creativeId) {
        throw new Error("creativeId is required");
    }

    try {

        // 1. Get existing creative details
        const existingResponse = await axios.get(
            `${GRAPH_API}/${creativeId}`,
            {
                params: {
                    fields: "name,object_story_spec",
                    access_token: accessToken
                }
            }
        );

        const existingCreative = existingResponse.data;
        console.log(existingCreative)
        const existingSpec = existingCreative.object_story_spec;

        if (!existingSpec) {
            throw new Error(
                "Existing creative object_story_spec was not found"
            );
        }

        const existingLinkData =
            existingSpec.link_data || {};

        // 2. Preserve existing values when
        //    they are not supplied in request
        const updatedObjectStorySpec = {

            page_id:
                existingSpec.page_id,

            link_data: {

                ...existingLinkData,

                message:
                    message !== undefined
                        ? message
                        : existingLinkData.message,

                link:
                    link !== undefined
                        ? link
                        : existingLinkData.link,

                image_hash:
                    existingLinkData.image_hash
            }
        };
        console.log("Updated Object Story Spec:", updatedObjectStorySpec);
        // 3. Update creative
        const params = {
            access_token: accessToken,

            object_story_spec:
                JSON.stringify(
                    updatedObjectStorySpec
                )
        };

        if (name !== undefined) {
            params.name = name;
        }

        console.log("Updating creative with params:", params);
        const response = await axios.post(
            `${GRAPH_API}/${creativeId}`,
            null,
            {
                params
            }
        );
        console.log("Update creative response:", response);
        return response.data;

    } catch (error) {

        console.error(
            "META UPDATE CREATIVE ERROR:",
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
    uploadAdImage,
    deleteCampaign,
    deleteAdSet,
    deleteAd,
    deleteCreative,
    updateCampaign,
    updateAdSet,
    updateAd,
    updateCreative

};