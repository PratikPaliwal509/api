const axios = require("axios");

const GRAPH_API = `https://graph.facebook.com/v19.0`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Adds +/-30% jitter to a delay so concurrent requests don't retry in lockstep.
const withJitter = (ms) => Math.round(ms * (0.7 + Math.random() * 0.6));

// code 1 = "Please reduce the amount of data you're asking for, then retry your request"
// Meta's own eng team has said this is a transient out-of-memory error on their
// backend, most commonly triggered by @Page mentions and/or a heavy combined
// payload (long text + link + media) on pages with a lot of interaction history.
const isKnownFlakyError = (error) => error.response?.data?.error?.code === 1;

const isRetryableFacebookError = (error) => {
    const fbError = error.response?.data?.error;
    if (fbError) {
        if (fbError.code === 1) return true;
        if ([2, 4, 17, 341].includes(fbError.code)) return true;
    }
    if (error.response?.status >= 500) return true;
    return false;
};

// Matches Facebook @Page / @[id] mention syntax, and plain "@Name" mentions
// typed by a user. Mentions are the most commonly reported trigger for code:1.
const MENTION_PATTERN = /@\[[^\]]+\]|@[A-Za-z0-9._-]{2,}/g;

const hasMentions = (message) => MENTION_PATTERN.test(message);

const stripMentions = (message) =>
    message.replace(MENTION_PATTERN, (match) => {
        // Keep readability: turn "@CompanyName" into "CompanyName" rather than deleting it
        return match.replace(/^@\[?/, "").replace(/\]$/, "").split("|")[0];
    }).replace(/\s{2,}/g, " ").trim();

// Looks for a post matching our message, created since we started this attempt.
// Uses a loose match (startsWith/includes) rather than strict equality, since
// Facebook can auto-linkify or lightly reformat the stored message.
const findRecentMatchingPost = async ({ pageId, pageAccessToken, message, sinceUnixSeconds }) => {
    try {
        const response = await axios.get(`${GRAPH_API}/${pageId}/feed`, {
            params: {
                access_token: pageAccessToken,
                fields: "id,message,created_time",
                limit: 10
            }
        });

        const posts = response.data?.data || [];
        const normalizedTarget = message.trim().slice(0, 80).toLowerCase();

        return posts.find((post) => {
            if (!post.message) return false;
            const createdUnix = Math.floor(new Date(post.created_time).getTime() / 1000);
            if (createdUnix < sinceUnixSeconds) return false;

            const normalizedPost = post.message.trim().slice(0, 80).toLowerCase();
            return normalizedPost === normalizedTarget || normalizedPost.includes(normalizedTarget) || normalizedTarget.includes(normalizedPost);
        }) || null;
    } catch (checkError) {
        console.error(
            "Facebook duplicate-check failed:",
            checkError.response?.data || checkError.message
        );
        return null;
    }
};

// Polls the feed a few times with delay, giving Facebook's backend time to
// catch up before we give up looking for the post.
const waitForPostToAppear = async ({ pageId, pageAccessToken, message, sinceUnixSeconds, attempts = 4, delayMs = 4000 }) => {
    for (let i = 0; i < attempts; i++) {
        await sleep(withJitter(delayMs));
        const found = await findRecentMatchingPost({ pageId, pageAccessToken, message, sinceUnixSeconds });
        if (found) return found;
    }
    return null;
};

const publishPost = async ({
    message,
    link = null,
    maxRetries = 3,
    baseDelayMs = 3000
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

    let workingMessage = message.trim();
    let workingLink = link ? link.trim() : null;

    if (hasMentions(workingMessage)) {
        console.warn(
            "Message contains @mentions — these are the most common trigger for the Facebook code:1 error. " +
            "Will try as-is first, then fall back to a mention-free version if needed."
        );
    }

    const attemptStartedUnix = Math.floor(Date.now() / 1000) - 5;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // Progressive simplification: once we've used up more than half our
        // retries and are still failing, start stripping the elements known
        // to trigger the "post too heavy" version of this error.
        const shouldSimplify = attempt > Math.ceil(maxRetries / 2);
        const messageForThisAttempt = shouldSimplify && hasMentions(workingMessage)
            ? stripMentions(workingMessage)
            : workingMessage;
        const linkForThisAttempt = shouldSimplify ? null : workingLink;

        const requestBody = { message: messageForThisAttempt };
        if (linkForThisAttempt) requestBody.link = linkForThisAttempt;

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
                retries: attempt,
                simplified: shouldSimplify,
                mentionsStripped: shouldSimplify && messageForThisAttempt !== workingMessage,
                linkDropped: shouldSimplify && Boolean(workingLink)
            };
        } catch (error) {
            lastError = error;

            console.error(
                `Facebook publish error (attempt ${attempt + 1}/${maxRetries + 1}, simplified=${shouldSimplify}):`,
                error.response?.data || error.message
            );

            const attemptsLeft = attempt < maxRetries;

            if (isRetryableFacebookError(error) && attemptsLeft) {
                await sleep(withJitter(baseDelayMs * Math.pow(2, attempt)));

                const existingPost = await findRecentMatchingPost({
                    pageId,
                    pageAccessToken,
                    message: messageForThisAttempt,
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

                continue; // retry, possibly with a simplified payload next loop
            }

            break;
        }
    }

    // Retries (including simplified attempts) exhausted. If this is the
    // known-flaky error, do one more extended poll before giving up — but
    // only ever report success once we've actually found the post.
    if (isKnownFlakyError(lastError)) {
        console.log("code:1 error persisted after retries — polling feed before giving up...");

        const found = await waitForPostToAppear({
            pageId,
            pageAccessToken,
            message: workingMessage,
            sinceUnixSeconds: attemptStartedUnix,
            attempts: 6,
            delayMs: 5000
        });

        if (found) {
            return {
                success: true,
                id: found.id,
                data: found,
                recoveredFromError: true
            };
        }

        // Genuinely could not verify the post exists. Don't fake success —
        // surface the real error, but with a clearer hint for this case.
        if (hasMentions(workingMessage)) {
            lastError.hint = "This message contains @mentions, which are the most common trigger for this error. " +
                "Consider posting without the mention and adding it manually afterward.";
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