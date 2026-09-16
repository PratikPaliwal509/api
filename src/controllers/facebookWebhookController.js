const facebookWebhookService = require("../services/facebookWebhookService");

const verifyWebhook = (req, res) => {
    try {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        const result = facebookWebhookService.verifyFacebookWebhook({
            mode,
            token,
            challenge
        });

        if (result.success) {
            console.log("Facebook webhook verified");

            return res
                .status(200)
                .send(result.challenge);
        }

        return res.sendStatus(403);

    } catch (error) {
        console.error(
            "Facebook webhook verification error:",
            error
        );

        return res.sendStatus(500);
    }
};


const receiveWebhook = (req, res) => {
    try {
        facebookWebhookService.handleFacebookWebhookEvent(
            req.body
        );

        // Meta expects HTTP 200
        return res.sendStatus(200);

    } catch (error) {
        console.error(
            "Facebook webhook processing error:",
            error
        );

        return res.sendStatus(500);
    }
};


module.exports = {
    verifyWebhook,
    receiveWebhook
};