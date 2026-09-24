const metaAdsService = require("../services/metaAds.service");


/**
 * GET AD ACCOUNT
 */
const getAdAccount = async (req, res) => {
    try {

        const data =
            await metaAdsService.getAdAccount();

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Get Meta Ad Account Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * GET CAMPAIGNS
 */
const getCampaigns = async (req, res) => {
    try {

        const data =
            await metaAdsService.getCampaigns();

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Get Meta Campaigns Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * GET AD SETS
 */
const getAdSets = async (req, res) => {
    try {

        const {
            campaignId
        } = req.query;

        const data =
            await metaAdsService.getAdSets(
                campaignId || null
            );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Get Meta Ad Sets Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * GET ADS
 */
const getAds = async (req, res) => {
    try {

        const {
            adSetId
        } = req.query;

        const data =
            await metaAdsService.getAds(
                adSetId || null
            );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Get Meta Ads Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * GET INSIGHTS
 */
const getInsights = async (req, res) => {
    try {

        const {
            date_preset = "last_30d",
            level = "campaign"
        } = req.query;

        const data =
            await metaAdsService.getInsights({
                datePreset: date_preset,
                level
            });

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Get Meta Insights Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * CREATE CAMPAIGN
 */
const createCampaign = async (req, res) => {
    try {

        const data = await metaAdsService.createCampaign(
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Campaign created successfully",
            data
        });

    } catch (error) {

        console.error(
            "Create Meta Campaign Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * CREATE AD SET
 */
const createAdSet = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const data = await metaAdsService.createAdSet({
            ...req.body,
            campaignId
        });

        return res.status(201).json({
            success: true,
            message: "Ad Set created successfully",
            data
        });

    } catch (error) {
        console.error(
            "Create Meta Ad Set Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ==========================================
// GET AD CREATIVES
// ==========================================

// const getAdCreatives = async (req, res) => {

//     try {

//         const data =
//             await metaAdsService.getAdCreatives();

//         return res.status(200).json({
//             success: true,
//             data
//         });

//     } catch (error) {

//         console.error(
//             "Get Meta Ad Creatives Error:",
//             error.message
//         );

//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


/**
 * CREATE CREATIVE
 */
const createAdCreative = async (req, res) => {
    try {

        const data = await metaAdsService.createAdCreative({
            ...req.body,
            pageId: process.env.META_PAGE_ID
        });
        return res.status(201).json({
            success: true,
            message: "Ad Creative created successfully",
            data
        });

    } catch (error) {

        console.error(
            "Create Meta Creative Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * CREATE AD
 */
const createAd = async (req, res) => {
    try {
        const data = await metaAdsService.createAd(req.body);

        return res.status(201).json({
            success: true,
            message: "Ad created successfully",
            data
        });

    } catch (error) {
        console.error(
            "Create Meta Ad Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const uploadAdImage = async (req, res) => {
    try {
        const data = await metaAdsService.uploadAdImage(req.file);

        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            data
        });
    } catch (error) {
        console.error("Upload Meta Ad Image Error:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * GET CAMPAIGN BY ID
 */
const getCampaignById = async (req, res) => {
    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Campaign ID is required"
            });
        }

        const data =
            await metaAdsService.getCampaignById(id);

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Get Meta Campaign By ID Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getCampaignAdSets = async (req, res) => {
    try {
        const { campaignId } = req.params;

        if (!campaignId) {
            return res.status(400).json({
                success: false,
                message: "Campaign ID is required"
            });
        }

        const data =
            await metaAdsService.getCampaignAdSets(campaignId);

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error(
            "Get Campaign Ad Sets Controller Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * GET SINGLE AD SET
 */
const getAdSetById = async (req, res) => {
    try {
        const { adSetId } = req.params;

        if (!adSetId) {
            return res.status(400).json({
                success: false,
                message: "Ad Set ID is required"
            });
        }

        const data =
            await metaAdsService.getAdSetById(adSetId);

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Get Ad Set By ID Controller Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message ||
                "Failed to fetch ad set details"
        });
    }
};
/**
 * GET ADS BY AD SET
 */
const getAdSetAds = async (req, res) => {
    try {
        const { adSetId } = req.params;

        if (!adSetId) {
            return res.status(400).json({
                success: false,
                message: "Ad Set ID is required",
            });
        }

        const data =
            await metaAdsService.getAdSetAds(adSetId);

        return res.status(200).json({
            success: true,
            data: data?.data || [],
            paging: data?.paging || null,
        });

    } catch (error) {
        console.error(
            "Get Ad Set Ads Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch ad set ads",
        });
    }
};
const getAdCreatives = async (req, res) => {
    try {
        const { adId } = req.params;

        if (!adId) {
            return res.status(400).json({
                success: false,
                message: "Ad ID is required"
            });
        }

        const creatives = await metaAdsService.getAdCreatives(adId);

        return res.status(200).json({
            success: true,
            data: creatives
        });
    } catch (error) {
        console.error("Get Ad Creative Error:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch ad creative"
        });
    }
};

const getAdDetails = async (req, res) => {
    try {
        const { adId } = req.params;

        if (!adId) {
            return res.status(400).json({
                success: false,
                message: "Ad ID is required",
            });
        }

        const data = await metaAdsService.getAdDetails(adId);

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {
        console.error(
            "Get Meta Ad Details Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch ad details",
        });
    }
};
const getCreativeDetails = async (req, res) => {
    try {
        const { creativeId } = req.params;

        console.log("Fetching Creative ID:", creativeId);

        if (!creativeId) {
            return res.status(400).json({
                success: false,
                message: "Creative ID is required",
            });
        }

        const data =
            await metaAdsService.getCreativeDetails(
                creativeId
            );

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {
        console.error(
            "META CREATIVE ERROR:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            success: false,
            message:
                error.response?.data?.error?.message ||
                error.message ||
                "Failed to fetch creative",

            error: error.response?.data?.error || null,
        });
    }
};
module.exports = {
    getAdAccount,
    getCampaigns,
    getAdSets,
    getAdSetAds,
    getCreativeDetails,
    getAds,
    getAdDetails,
    getCampaignAdSets,
    getInsights,
    getAdSetById,
    getCampaignById,
    createCampaign,
    createAdSet,
    getAdCreatives,
    createAdCreative,
    createAd,
    uploadAdImage
};