const express = require("express");
const { google } = require("googleapis");
const prisma = require("../../config/db"); // ← use your existing prisma instance
const { encrypt } = require("../../utils/encryption");

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    // Decode state
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { userId, agencyId, clientId } = stateData;

    console.log("Decoded state →", stateData);

    if (!agencyId || !userId) {
      console.error("Missing agencyId or userId in state");
      return res.redirect(`${process.env.FRONTEND_URL}/?error=invalid_state`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Save to database
    const connectedAccount = await prisma.connectedAccount.create({
      data: {
        agency_id: agencyId,
        client_id: clientId ? Number(clientId) : null,
        platform: "google",
        account_email: userInfo.data.email,
        account_name: userInfo.data.name,
        account_id_external: userInfo.data.id,
        access_token: encrypt(tokens.access_token),
        refresh_token: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: tokens.scope ? tokens.scope.split(" ") : [],
        status: "active",
        connected_by: userId,
        metadata: {},
      },
    });

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/integrations/google/success?id=${connectedAccount.connected_account_id}`,
    );
  } catch (error) {
    console.error("Google callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/integrations/google/error`);
  }
});

module.exports = router;
