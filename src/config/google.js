const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },

    scopes: [
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/webmasters.readonly",
    ],
});

const analyticsData = google.analyticsdata({
    version: "v1beta",
    auth,
});

const searchConsole = google.searchconsole({
    version: "v1",
    auth,
});

module.exports = {
    analyticsData,
    searchConsole,
};