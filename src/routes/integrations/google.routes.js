const express = require("express");
const { google } = require("googleapis");
const prisma = require("../../config/db"); // ← your existing prisma
const { encrypt, decrypt } = require("../../utils/encryption");
const { getAuthenticatedClient } = require("../../utils/googleToken");

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

/**
 * Start Google OAuth
 * GET /api/integrations/google/connect
 */
router.get("/connect", async (req, res) => {
  try {
    const { client_id } = req.query;

    const userId = req.user?.user_id;
    const agencyId = req.user?.agency?.agency_id;

    console.log("Extracted →", { userId, agencyId });

    if (!userId || !agencyId) {
      return res.status(400).json({
        message: "User or Agency ID missing from token",
        user: req.user,
      });
    }

    const state = Buffer.from(
      JSON.stringify({
        userId,
        agencyId,
        clientId: client_id || null,
        timestamp: Date.now(),
      }),
    ).toString("base64");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
      state,
    });

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.json({ url: authUrl });
  } catch (error) {
    console.error("Google connect error:", error);
    res.status(500).json({ message: "Failed to start Google connection" });
  }
});
/**
 * List connected Google accounts
 * GET /api/integrations/google/accounts
 */
router.get("/accounts", async (req, res) => {
  try {
    const agencyId = req.user.agency_id;
    const { client_id } = req.query;

    const accounts = await prisma.connectedAccount.findMany({
      where: {
        agency_id: agencyId,
        platform: "google",
        ...(client_id ? { client_id: Number(client_id) } : {}),
        status: "active",
      },
      select: {
        connected_account_id: true,
        account_email: true,
        account_name: true,
        client_id: true,
        status: true,
        last_synced_at: true,
        created_at: true,
        metadata: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
});

/**
 * Disconnect account
 * DELETE /api/integrations/google/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const agencyId = req.user.agency_id;
    const id = Number(req.params.id);

    const account = await prisma.connectedAccount.findFirst({
      where: {
        connected_account_id: id,
        agency_id: agencyId,
        platform: "google",
      },
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Optional: revoke token
    try {
      const accessToken = decrypt(account.access_token);
      await oauth2Client.revokeToken(accessToken);
    } catch (err) {
      console.warn("Could not revoke token:", err.message);
    }

    await prisma.connectedAccount.update({
      where: { connected_account_id: id },
      data: { status: "revoked" },
    });

    res.json({ message: "Account disconnected successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to disconnect account" });
  }
});

/**
 * Get GA4 Properties for a connected Google account
 * GET /api/integrations/google/:id/ga4-properties
 */
router.get("/:id/ga4-properties", async (req, res) => {
  try {
    const connectedAccountId = Number(req.params.id);
    const agencyId = req.user?.agency?.agency_id;

    // Security check – make sure this account belongs to the current agency
    const account = await prisma.connectedAccount.findFirst({
      where: {
        connected_account_id: connectedAccountId,
        agency_id: agencyId,
        platform: "google",
        status: "active",
      },
    });

    if (!account) {
      return res.status(404).json({ message: "Connected account not found" });
    }

    // Get authenticated client (auto-refreshes token if needed)
    const authClient = await getAuthenticatedClient(connectedAccountId);

    // Use Google Analytics Admin API
    const analyticsAdmin = google.analyticsadmin({
      version: "v1beta",
      auth: authClient,
    });

    // List all account summaries (this gives properties too)
    const response = await analyticsAdmin.accountSummaries.list();

    const properties = [];

    if (response.data.accountSummaries) {
      for (const accountSummary of response.data.accountSummaries) {
        if (accountSummary.propertySummaries) {
          for (const prop of accountSummary.propertySummaries) {
            properties.push({
              propertyId: prop.property, // e.g. "properties/123456789"
              displayName: prop.displayName,
              propertyType: prop.propertyType,
              parent: accountSummary.account, // parent account
              accountDisplayName: accountSummary.displayName,
            });
          }
        }
      }
    }

    res.json({
      success: true,
      connectedAccountId,
      email: account.account_email,
      properties,
    });
  } catch (error) {
    console.error("GA4 Properties error:", error);
    res.status(500).json({
      message: "Failed to fetch GA4 properties",
      error: error.message,
    });
  }
});

/**
 * Link a GA4 property to a Client
 * POST /api/integrations/google/link-ga4
 */
router.post("/link-ga4", async (req, res) => {
  try {
    const agencyId = req.user?.agency?.agency_id;
    const { client_id, connected_account_id, property_id, property_name } =
      req.body;

    if (!client_id || !connected_account_id || !property_id) {
      return res.status(400).json({
        message: "client_id, connected_account_id and property_id are required",
      });
    }

    // 1. Verify the connected account belongs to this agency
    const account = await prisma.connectedAccount.findFirst({
      where: {
        connected_account_id: Number(connected_account_id),
        agency_id: agencyId,
        platform: "google",
        status: "active",
      },
    });

    if (!account) {
      return res
        .status(404)
        .json({ message: "Connected Google account not found" });
    }

    // 2. Verify the client belongs to this agency
    const client = await prisma.client.findFirst({
      where: {
        client_id: Number(client_id),
        agency_id: agencyId,
      },
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // 3. Create or update the link
    const integration = await prisma.googleClientIntegration.upsert({
      where: {
        client_id_platform_integration_type: {
          client_id: Number(client_id),
          platform: "google",
          integration_type: "ga4",
        },
      },
      update: {
        connected_account_id: Number(connected_account_id),
        external_id: property_id,
        external_name: property_name || null,
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        agency_id: agencyId,
        client_id: Number(client_id),
        connected_account_id: Number(connected_account_id),
        platform: "google",
        integration_type: "ga4",
        external_id: property_id,
        external_name: property_name || null,
        is_active: true,
      },
    });

    res.json({
      success: true,
      message: "GA4 property linked successfully",
      data: integration,
    });
  } catch (error) {
    console.error("Link GA4 error:", error);
    res
      .status(500)
      .json({ message: "Failed to link GA4 property", error: error.message });
  }
});

/**
 * Get linked GA4 property for a Client
 * GET /api/integrations/google/client/:clientId/ga4
 */
router.get("/client/:clientId/ga4", async (req, res) => {
  try {
    const agencyId = req.user?.agency?.agency_id;
    const clientId = Number(req.params.clientId);

    // Verify client belongs to this agency
    const client = await prisma.client.findFirst({
      where: {
        client_id: clientId,
        agency_id: agencyId,
      },
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Get the linked GA4 integration
    const integration = await prisma.googleClientIntegration.findFirst({
      where: {
        client_id: clientId,
        agency_id: agencyId,
        platform: "google",
        integration_type: "ga4",
        is_active: true,
      },
      include: {
        connectedAccount: {
          select: {
            connected_account_id: true,
            account_email: true,
            account_name: true,
            status: true,
          },
        },
      },
    });

    if (!integration) {
      return res.json({
        success: true,
        linked: false,
        message: "No GA4 property linked to this client",
        data: null,
      });
    }

    res.json({
      success: true,
      linked: true,
      data: {
        client_integration_id: integration.client_integration_id,
        property_id: integration.external_id,
        property_name: integration.external_name,
        connected_account: integration.connectedAccount,
        linked_at: integration.created_at,
      },
    });
  } catch (error) {
    console.error("Get client GA4 error:", error);
    res.status(500).json({ message: "Failed to get linked GA4 property" });
  }
});

/**
 * Get basic GA4 metrics for a Client
 * GET /api/integrations/google/client/:clientId/ga4-metrics
 * Query params (optional):
 *   startDate=2026-09-01
 *   endDate=2026-10-12
 */
router.get('/client/:clientId/ga4-metrics', async (req, res) => {
  try {
    const agencyId = req.user?.agency?.agency_id;
    const clientId = Number(req.params.clientId);

    // Default: last 30 days
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const startDate =
      req.query.startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Get the linked GA4 integration
    const integration = await prisma.googleClientIntegration.findFirst({
      where: {
        client_id: clientId,
        agency_id: agencyId,
        platform: 'google',
        integration_type: 'ga4',
        is_active: true,
      },
    });

    if (!integration) {
      return res.status(404).json({
        message: 'No GA4 property linked to this client',
      });
    }

    // 2. Get authenticated client (auto refreshes token)
    const authClient = await getAuthenticatedClient(integration.connected_account_id);

    // 3. Call Google Analytics Data API
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth: authClient,
    });

    const propertyId = integration.external_id; // e.g. "properties/123456789"

    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'newUsers' },
        ],
      },
    });

    // 4. Format the response
    const metricHeaders = response.data.metricHeaders || [];
    const values = response.data.rows?.[0]?.metricValues || [];

    const metrics = {};
    metricHeaders.forEach((header, index) => {
      metrics[header.name] = values[index]?.value || '0';
    });

    res.json({
      success: true,
      client_id: clientId,
      property_id: propertyId,
      property_name: integration.external_name,
      date_range: { startDate, endDate },
      metrics: {
        activeUsers: Number(metrics.activeUsers || 0),
        newUsers: Number(metrics.newUsers || 0),
        sessions: Number(metrics.sessions || 0),
        pageViews: Number(metrics.screenPageViews || 0),
        bounceRate: Number(metrics.bounceRate || 0),
        avgSessionDuration: Number(metrics.averageSessionDuration || 0), // in seconds
      },
    });
  } catch (error) {
    console.error('GA4 Metrics error:', error);
    res.status(500).json({
      message: 'Failed to fetch GA4 metrics',
      error: error.message,
    });
  }
});

/**
 * Traffic Sources Report
 * GET /api/integrations/google/client/:clientId/ga4-traffic-sources
 */
router.get('/client/:clientId/ga4-traffic-sources', async (req, res) => {
  try {
    const agencyId = req.user?.agency?.agency_id;
    const clientId = Number(req.params.clientId);

    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const integration = await prisma.googleClientIntegration.findFirst({
      where: {
        client_id: clientId,
        agency_id: agencyId,
        platform: 'google',
        integration_type: 'ga4',
        is_active: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ message: 'No GA4 property linked to this client' });
    }

    const authClient = await getAuthenticatedClient(integration.connected_account_id);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: authClient });

    const response = await analyticsData.properties.runReport({
      property: integration.external_id,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'bounceRate' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      },
    });

    const rows = (response.data.rows || []).map((row) => ({
      source: row.dimensionValues[0].value,
      medium: row.dimensionValues[1].value,
      sessions: Number(row.metricValues[0].value),
      users: Number(row.metricValues[1].value),
      bounceRate: Number(row.metricValues[2].value),
    }));

    res.json({
      success: true,
      client_id: clientId,
      property_id: integration.external_id,
      date_range: { startDate, endDate },
      data: rows,
    });
  } catch (error) {
    console.error('Traffic sources error:', error);
    res.status(500).json({ message: 'Failed to fetch traffic sources', error: error.message });
  }
});


/**
 * Top Pages Report
 * GET /api/integrations/google/client/:clientId/ga4-top-pages
 */
router.get('/client/:clientId/ga4-top-pages', async (req, res) => {
  try {
    const agencyId = req.user?.agency?.agency_id;
    const clientId = Number(req.params.clientId);

    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const integration = await prisma.googleClientIntegration.findFirst({
      where: {
        client_id: clientId,
        agency_id: agencyId,
        platform: 'google',
        integration_type: 'ga4',
        is_active: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ message: 'No GA4 property linked to this client' });
    }

    const authClient = await getAuthenticatedClient(integration.connected_account_id);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: authClient });

    const response = await analyticsData.properties.runReport({
      property: integration.external_id,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'averageSessionDuration' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      },
    });

    const rows = (response.data.rows || []).map((row) => ({
      pagePath: row.dimensionValues[0].value,
      pageTitle: row.dimensionValues[1].value,
      pageViews: Number(row.metricValues[0].value),
      users: Number(row.metricValues[1].value),
      avgDuration: Number(row.metricValues[2].value),
    }));

    res.json({
      success: true,
      client_id: clientId,
      property_id: integration.external_id,
      date_range: { startDate, endDate },
      data: rows,
    });
  } catch (error) {
    console.error('Top pages error:', error);
    res.status(500).json({ message: 'Failed to fetch top pages', error: error.message });
  }
});


/**
 * Devices Report
 * GET /api/integrations/google/client/:clientId/ga4-devices
 */
router.get('/client/:clientId/ga4-devices', async (req, res) => {
  try {
    const agencyId = req.user?.agency?.agency_id;
    const clientId = Number(req.params.clientId);

    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const integration = await prisma.googleClientIntegration.findFirst({
      where: {
        client_id: clientId,
        agency_id: agencyId,
        platform: 'google',
        integration_type: 'ga4',
        is_active: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ message: 'No GA4 property linked to this client' });
    }

    const authClient = await getAuthenticatedClient(integration.connected_account_id);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: authClient });

    const response = await analyticsData.properties.runReport({
      property: integration.external_id,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'bounceRate' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      },
    });

    const rows = (response.data.rows || []).map((row) => ({
      device: row.dimensionValues[0].value, // desktop, mobile, tablet
      sessions: Number(row.metricValues[0].value),
      users: Number(row.metricValues[1].value),
      bounceRate: Number(row.metricValues[2].value),
    }));

    res.json({
      success: true,
      client_id: clientId,
      property_id: integration.external_id,
      date_range: { startDate, endDate },
      data: rows,
    });
  } catch (error) {
    console.error('Devices error:', error);
    res.status(500).json({ message: 'Failed to fetch devices report', error: error.message });
  }
});

module.exports = router;
