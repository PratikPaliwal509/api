const axios = require("axios");

const GRAPH_API = `https://graph.facebook.com/v19.0`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// code 1 = "Please reduce the amount of data you're asking for, then retry your request"
// This is a known transient Facebook Graph API backend issue — worth retrying.
// A few other codes (rate limiting) and any 5xx are also worth retrying.
const isRetryableFacebookError = (error) => {
    const fbError = error.response?.data?.error;
    if (fbError) {
        if (fbError.code === 1) return true;
        if ([2, 4, 17, 341].includes(fbError.code)) return true;
    }
    if (error.response?.status >= 500) return true;
    return false;
};

// Looks at the most recent posts on the page feed for one matching our message,
// created since we started this publish attempt. Facebook sometimes creates the
// post successfully but returns an error anyway (or is slow to reflect it) — this
// stops us from posting the same message twice on retry.
const findRecentMatchingPost = async ({ pageId, pageAccessToken, message, sinceUnixSeconds }) => {
    try {
        const response = await axios.get(`${GRAPH_API}/${pageId}/feed`, {
            params: {
                access_token: pageAccessToken,
                fields: "id,message,created_time",
                limit: 5
            }
        });

        const posts = response.data?.data || [];

        return posts.find((post) => {
            if (!post.message) return false;
            const createdUnix = Math.floor(new Date(post.created_time).getTime() / 1000);
            return post.message.trim() === message.trim() && createdUnix >= sinceUnixSeconds;
        }) || null;
    } catch (checkError) {
        console.error(
            "Facebook duplicate-check failed:",
            checkError.response?.data || checkError.message
        );
        return null;
    }
};

const publishPost = async ({
    message,
    link = null,
    maxRetries = 3,
    baseDelayMs = 2000
}) => {
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

    // Small buffer so we don't miss a post created a second or two before this attempt
    const attemptStartedUnix = Math.floor(Date.now() / 1000) - 5;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(
                `${GRAPH_API}/${pageId}/feed`,
                requestBody,
                { params: { access_token: pageAccessToken } }
            );

            return {
                success: true,
                id: response.data.id,
                data: response.data,
                retries: attempt
            };
        } catch (error) {
            lastError = error;

            console.error(
                `Facebook publish error (attempt ${attempt + 1}/${maxRetries + 1}):`,
                error.response?.data || error.message
            );

            const retryable = isRetryableFacebookError(error);
            const attemptsLeft = attempt < maxRetries;

            if (!retryable || !attemptsLeft) {
                break;
            }

            // Before retrying, check whether the post actually went through
            const existingPost = await findRecentMatchingPost({
                pageId,
                pageAccessToken,
                message: message.trim(),
                sinceUnixSeconds: attemptStartedUnix
            });

            if (existingPost) {
                console.log("Post already exists despite error — skipping retry:", existingPost.id);
                return {
                    success: true,
                    id: existingPost.id,
                    data: existingPost,
                    recoveredFromError: true,
                    retries: attempt
                };
            }

            const delay = baseDelayMs * Math.pow(2, attempt);
            console.log(`Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }

    throw lastError;
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