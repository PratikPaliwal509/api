const facebookService = require("../services/facebook.service");

const createPost = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        const result = await facebookService.publishPost(message);

        return res.status(200).json({
            success: true,
            message: "Post published successfully",
            data: result
        });

    } catch (error) {
        console.error(
            "CREATE FACEBOOK POST ERROR:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            success: false,
            message: "Failed to publish Facebook post",
            error: error.response?.data || {
                message: error.message
            }
        });
    }
};



// GET Facebook Page details
const getPageDetails = async (req, res) => {
    try {
        const data = await facebookService.getPageDetails();

        return res.status(200).json({
            success: true,
            message: "Facebook Page details fetched successfully",
            data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Facebook Page details",
            error: error.response?.data || error.message
        });
    }
};


// GET Facebook Page posts
const getPosts = async (req, res) => {
    try {
        const data = await facebookService.getPosts();

        return res.status(200).json({
            success: true,
            message: "Facebook Page posts fetched successfully",
            data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Facebook Page posts",
            error: error.response?.data || error.message
        });
    }
};
const debugPageToken = async (req, res) => {
    try {
        const data = await facebookService.debugPageToken();

        return res.status(200).json({
            success: true,
            message: "Page access token is working",
            data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Page access token test failed",
            error: error.response?.data || error.message
        });
    }
};

module.exports = {
    createPost,
    getPageDetails,
    getPosts,
    debugPageToken
};