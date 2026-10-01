const express = require("express");

const router = express.Router();

const facebookReportController =
    require("../controllers/facebookReport.controller");


// Generate Facebook Posts Report
router.get(
    "/posts",
    facebookReportController.generatePostReport
);


module.exports = router;