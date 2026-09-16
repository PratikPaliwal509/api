const axios = require("axios");

const GRAPH_API = `https://graph.facebook.com/v19.0`;
const publishPost = async ({ message, link = null }) => {
    try {
        const pageId = process.env.META_PAGE_ID?.trim();
        const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN?.trim();

        if (!pageId) {
            throw new Error("META_PAGE_ID is missing");
        }

        if (!pageAccessToken) {
            throw new Error("META_PAGE_ACCESS_TOKEN is missing");
        }

        if (!message?.trim()) {
            throw new Error("Post message is required");
        }

        const requestBody = {
            message: message.trim()
        };

        if (link) {
            requestBody.link = link.trim();
        }

        const response = await axios.post(
            `${GRAPH_API}/${pageId}/feed`,
            requestBody,
            {
                params: {
                    access_token: pageAccessToken
                }
            }
        );

        return {
            success: true,
            id: response.data.id,
            data: response.data
        };

    } catch (error) {
        console.error(
            "Facebook publish error:",
            error.response?.data || error.message
        );

        throw error;
    }
};

// Get Facebook Page details
const getPageDetails = async () => {
    try {
        const response = await axios.get(
            `${GRAPH_API}/${process.env.META_PAGE_ID}`,
            {
                params: {
                    fields: "id,name,about,website,link,picture",
                    access_token: process.env.META_PAGE_ACCESS_TOKEN
                }
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "Facebook Get Page Details Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// Get Facebook Page posts
const getPosts = async () => {
    try {
        const response = await axios.get(
            `${GRAPH_API}/${process.env.META_PAGE_ID}/posts`,
            {
                params: {
                    fields: "id,message,created_time,permalink_url,full_picture",
                    access_token: process.env.META_PAGE_ACCESS_TOKEN
                }
            }
        );

        return response.data;

    } catch (error) {
        console.error(
            "Facebook Get Posts Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};

// Debug Page Access Token
const debugPageToken = async () => {
    try {
        const response = await axios.get(
            `${GRAPH_API}/${process.env.META_PAGE_ID}`,
            {
                params: {
                    fields: "id,name",
                    access_token: process.env.META_PAGE_ACCESS_TOKEN
                }
            }
        );

        console.log("TOKEN CAN ACCESS PAGE:", response.data);

        return response.data;

    } catch (error) {
        console.error(
            "TOKEN TEST ERROR:",
            error.response?.data || error.message
        );

        throw error;
    }
};

module.exports = {
    publishPost,
    getPageDetails,
    getPosts,
    debugPageToken
};