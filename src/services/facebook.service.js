const axios = require("axios");

const GRAPH_API = `https://graph.facebook.com/v24.0`;
// const GRAPH_API = `https://graph.facebook.com/${process.env.META_API_VERSION}`;
const publishPost = async (message) => {
    try {
        const pageId = process.env.META_PAGE_ID;
        const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;

        if (!pageId) throw new Error("META_PAGE_ID is missing");
        if (!pageAccessToken) throw new Error("META_PAGE_ACCESS_TOKEN is missing");
        if (!message || !message.trim()) throw new Error("Post message is required");
console.log("Publishing Facebook Post:", message);
        const body = new URLSearchParams();
        body.append("message", message.trim());
        body.append("access_token", pageAccessToken);

        // Force Meta to only calculate and return the created object ID
        body.append("fields", "id");

        const response = await axios.post(
            `${GRAPH_API}/${pageId}/feed`,
            null,
            {
                params: {
                    message,
                    access_token: pageAccessToken
                }
            }
        );
        return {
            id: response.data.id
        };
    } catch (error) {

        console.error("FACEBOOK PUBLISH ERROR");
        console.error("HTTP STATUS:", error.response?.status);

        console.error(
            "FACEBOOK ERROR:",
            JSON.stringify(error.response?.data, null, 2)
        );

        console.error(
            "FACEBOOK HEADERS:",
            JSON.stringify(error.response?.headers, null, 2)
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