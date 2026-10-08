const express = require("express");

const router = express.Router();

const {
    getAdsReport,
    getCampaignOptions,
} = require("../controllers/metaAdsReport.controller");

// const authMiddleware = require("../middleware/authMiddleware");

// List of campaigns for the "Specific campaign" selector in the modal
router.get(
    "/reports/campaign-options",
    // authMiddleware,
    getCampaignOptions
);

// Main report endpoint
router.get(
    "/reports/ads",
    // authMiddleware,
    getAdsReport
);

module.exports = router;
