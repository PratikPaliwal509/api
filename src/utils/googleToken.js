const { google } = require('googleapis');
const prisma = require('../config/db'); // ← adjust path if needed
const { encrypt, decrypt } = require('./encryption');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Get a valid access token for a connected account.
 * Automatically refreshes it if expired.
 */
async function getValidAccessToken(connectedAccountId) {
  const account = await prisma.connectedAccount.findUnique({
    where: { connected_account_id: connectedAccountId },
  });

  if (!account || account.status !== 'active') {
    throw new Error('Connected account not found or inactive');
  }

  const now = new Date();
  const expiry = account.token_expiry ? new Date(account.token_expiry) : null;

  // If token is still valid (with 2 minute buffer)
  if (expiry && expiry.getTime() > now.getTime() + 2 * 60 * 1000) {
    return decrypt(account.access_token);
  }

  // Token expired or about to expire → refresh it
  if (!account.refresh_token) {
    throw new Error('No refresh token available. Please reconnect the account.');
  }

  try {
    oauth2Client.setCredentials({
      refresh_token: decrypt(account.refresh_token),
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update the database with new tokens
    await prisma.connectedAccount.update({
      where: { connected_account_id: connectedAccountId },
      data: {
        access_token: encrypt(credentials.access_token),
        token_expiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
        // Sometimes Google also returns a new refresh_token
        ...(credentials.refresh_token && {
          refresh_token: encrypt(credentials.refresh_token),
        }),
        updated_at: new Date(),
      },
    });

    return credentials.access_token;
  } catch (error) {
    console.error('Failed to refresh Google token:', error.message);

    // Mark account as expired so UI can show "Reconnect"
    await prisma.connectedAccount.update({
      where: { connected_account_id: connectedAccountId },
      data: { status: 'expired' },
    });

    throw new Error('Google token expired. Please reconnect the account.');
  }
}

/**
 * Returns an authenticated OAuth2 client for a connected account
 */
async function getAuthenticatedClient(connectedAccountId) {
  const accessToken = await getValidAccessToken(connectedAccountId);

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  client.setCredentials({ access_token: accessToken });
  return client;
}

module.exports = {
  getValidAccessToken,
  getAuthenticatedClient,
};