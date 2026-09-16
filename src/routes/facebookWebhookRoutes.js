const express = require("express");

const router = express.Router();

const {
    verifyWebhook,
    receiveWebhook
} = require("../controllers/facebookWebhookController");


// GET /api/webhooks/facebook
// Used by Meta to verify the webhook
router.get(
    "/facebook",
    verifyWebhook
);


// POST /api/webhooks/facebook
// Used by Meta to send webhook events
router.post(
    "/facebook",
    receiveWebhook
);


module.exports = router;