const verifyFacebookWebhook = ({
    mode,
    token,
    challenge
}) => {
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

    if (
        mode === "subscribe" &&
        token === VERIFY_TOKEN
    ) {
        return {
            success: true,
            challenge
        };
    }

    return {
        success: false
    };
};


const handleFacebookWebhookEvent = (body) => {
    console.log("Meta webhook event:");
    console.log(JSON.stringify(body, null, 2));

    // Later you can process different Meta events here.
    //
    // Example:
    // if (body.object === "page") {
    //     body.entry.forEach(entry => {
    //         ...
    //     });
    // }

    return {
        success: true
    };
};


module.exports = {
    verifyFacebookWebhook,
    handleFacebookWebhookEvent
};