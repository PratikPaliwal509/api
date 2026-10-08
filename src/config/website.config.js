const websiteConfig = {
    "https://techleela.com/": {
        ga4PropertyId: process.env.GA4_PROPERTY_TECHLEELA,
        gscSiteUrl: "https://techleela.com/",
    },

    // "https://abhijitrealtors.com/": {
    //     ga4PropertyId: process.env.GA4_PROPERTY_ABHIJITREALTORS,
    //     gscSiteUrl: "https://abhijitrealtors.com/",
    // },

    // "https://aureushospital.com/": {
    //     ga4PropertyId: process.env.GA4_PROPERTY_AUREUSHOSPITAL,
    //     gscSiteUrl: "https://aureushospital.com/",
    // },

    // "https://baybreeze.in/": {
    //     ga4PropertyId: process.env.GA4_PROPERTY_BAYBREEZE,
    //     gscSiteUrl: "https://baybreeze.in/",
    // },

    // "https://candidoffers.in/": {
    //     ga4PropertyId: process.env.GA4_PROPERTY_CANDIOFFERS,
    //     gscSiteUrl: "https://candidoffers.in/",
    // },

    // "https://cimcon.org/": {
    //     ga4PropertyId: process.env.GA4_PROPERTY_CIMCON,
    //     gscSiteUrl: "https://cimcon.org/",
    // },

    // "https://cpschool.edu.in/": {
    //     ga4PropertyId: process.env.GA4_PROPERTY_CPSCHOOL,
    //     gscSiteUrl: "https://cpschool.edu.in/",
    // },

    // "https://dpsmihan.edu.in/": {
    //     ga4PropertyId: process.env.GA4_PROPERTY_DPSMIHAN,
    //     gscSiteUrl: "https://dpsmihan.edu.in/",
    // },

    // "https://dpsnagpur.edu.in/": {
    //     ga4PropertyId: process.env.GA4_PROPERTY_DPSNAGPUR,
    //     gscSiteUrl: "https://dpsnagpur.edu.in/",
    // },

    "https://govigyanshop.com/": {
        ga4PropertyId: process.env.GA4_PROPERTY_GOVIGYANSHOP,
        gscSiteUrl: "https://govigyanshop.com/",
    },

    // "https://galleryuniqueart.com/": {
    //     ga4PropertyId: process.env.GA4_PROPERTY_GALLERYUNIQUEART,
    //     gscSiteUrl: "https://galleryuniqueart.com/",
    // },

    "https://nb-cellulose.com/": {
        ga4PropertyId: process.env.GA4_PROPERTY_NBCELLULOSE,
        gscSiteUrl: "https://nb-cellulose.com/",
    },
};


const normalizeUrl = (url) => {

    if (!url) return "";

    return url
        .trim()
        .replace(/\/+$/, "")
        .toLowerCase();
};


const getWebsiteConfig = (siteUrl) => {

    const normalizedUrl =
        normalizeUrl(siteUrl);

    const configEntry =
        Object.entries(websiteConfig).find(
            ([url]) =>
                normalizeUrl(url) === normalizedUrl
        );

    return configEntry
        ? configEntry[1]
        : null;
};


module.exports = {
    getWebsiteConfig,
    normalizeUrl,
};