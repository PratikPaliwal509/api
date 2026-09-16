const express = require("express");
const router = express.Router();

const {
    createPost,
    getPageDetails,
    getPosts,
    debugPageToken
} = require("../controllers/facebook.controller");

router.post("/post", createPost);
router.get("/posts", getPosts);
router.get("/details", getPageDetails);

router.get("/debug-token", debugPageToken);

module.exports = router;