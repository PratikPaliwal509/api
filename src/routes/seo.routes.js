const express = require("express");

const {
    generateSEOReport,
} = require("../controllers/seo.controller");

const router = express.Router();


router.get(
    "/report",
    generateSEOReport
);


module.exports = router;