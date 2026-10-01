const express = require("express");

const router = express.Router();

const {
    getAdsReport,
} = require("../controllers/metaAdsReport.controller");

// const authMiddleware = require("../middleware/authMiddleware");


router.get(
    "/reports/ads",
    // authMiddleware,
    getAdsReport
);


module.exports = router;