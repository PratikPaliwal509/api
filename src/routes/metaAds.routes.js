const express = require("express");

const router = express.Router();

const metaAdsController =
    require("../controllers/metaAds.controller");

const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPG and PNG images are allowed"));
        }

        cb(null, true);
    }
});
// ============================================
// GET
// ============================================

// Ad account
router.get(
    "/account",
    metaAdsController.getAdAccount
);


// Campaigns
router.get(
    "/campaigns",
    metaAdsController.getCampaigns
);


// Ad Sets
router.get(
    "/adsets",
    metaAdsController.getAdSets
);

router.get( "/ads/:adId/creatives", metaAdsController.getAdCreatives );
// Ads
router.get(
    "/ads",
    metaAdsController.getAds
);


// Insights
router.get(
    "/insights",
    metaAdsController.getInsights
);
// GET CAMPAIGN BY ID
router.get(
    "/campaigns/:id",
    metaAdsController.getCampaignById
);

router.get(
    "/:campaignId/adsets",
    metaAdsController.getCampaignAdSets
);

// ============================================
// CREATE
// ============================================

// Campaign
router.post(
    "/campaigns",
    metaAdsController.createCampaign
);


// Ad Set
router.post(
    "/adsets/:campaignId",
    metaAdsController.createAdSet
);


// Creative
// router.get(
//     "/creatives",
//     metaAdsController.getAdCreatives
// );
router.get(
    "/ads/:adId",
    metaAdsController.getAdDetails
);
router.get(
    "/creatives/:creativeId",
    metaAdsController.getCreativeDetails
);
router.get( "/adsets/:adSetId/ads", metaAdsController.getAdSetAds );
router.get(
    "/adsets/:adSetId",
    metaAdsController.getAdSetById
);
// Creative
router.post(
    "/creatives",
    metaAdsController.createAdCreative
);


// Ad
router.post(
    "/ads",
    metaAdsController.createAd
);

router.post(
    "/images",
    upload.single("image"),
    metaAdsController.uploadAdImage
);

router.delete("/campaigns/:campaignId", metaAdsController.deleteCampaign);
router.delete("/adsets/:adSetId", metaAdsController.deleteAdSet);
router.delete("/ads/:adId", metaAdsController.deleteAd);
router.delete("/creatives/:creativeId", metaAdsController.deleteCreative);

router.put(
    "/campaigns/:campaignId",
    metaAdsController.updateCampaign
);

router.put(
    "/adsets/:adSetId",
    metaAdsController.updateAdSet
);

router.put(
    "/ads/:adId",
    metaAdsController.updateAd
);

router.put(
    "/creatives/:creativeId",
    metaAdsController.updateCreative
);
module.exports = router;