const {
    generateAdsReport,
    getCampaignList,
    ALLOWED_SECTIONS,
} = require("../services/metaAdsReport.service");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const COMPARE_TYPES = [
    "previous_period",
    "previous_month",
    "previous_year",
    "custom",
    "none",
];

const parseList = (value) =>
    typeof value === "string" && value.trim()
        ? value.split(",").map((v) => v.trim()).filter(Boolean)
        : [];

const bad = (res, message) =>
    res.status(400).json({ success: false, message });

/**
 * GET /reports/ads
 *
 * Query:
 *  fromDate, toDate            YYYY-MM-DD (required)
 *  compareType                 previous_period | previous_month | previous_year | custom | none
 *  compareFromDate/ToDate      required when compareType = custom
 *  campaignIds                 comma separated. Empty / missing = ALL campaigns
 *  sections                    comma separated. Empty / missing = ALL sections
 */
const getAdsReport = async (req, res) => {
    try {
        const {
            fromDate,
            toDate,
            compareType = "previous_period",
            compareFromDate,
            compareToDate,
        } = req.query;

        if (!fromDate || !toDate) {
            return bad(res, "Report dates are required");
        }

        if (!DATE_REGEX.test(fromDate) || !DATE_REGEX.test(toDate)) {
            return bad(res, "Dates must be in YYYY-MM-DD format");
        }

        if (fromDate > toDate) {
            return bad(res, "From date cannot be after To date");
        }

        if (!COMPARE_TYPES.includes(compareType)) {
            return bad(res, "Invalid comparison type");
        }

        if (compareType === "custom") {
            if (!compareFromDate || !compareToDate) {
                return bad(
                    res,
                    "Comparison dates are required for custom comparison"
                );
            }
            if (
                !DATE_REGEX.test(compareFromDate) ||
                !DATE_REGEX.test(compareToDate) ||
                compareFromDate > compareToDate
            ) {
                return bad(res, "Invalid comparison dates");
            }
        }

        const campaignIds = parseList(req.query.campaignIds);

        let sections = parseList(req.query.sections).filter((s) =>
            ALLOWED_SECTIONS.includes(s)
        );
        if (sections.length === 0) sections = [...ALLOWED_SECTIONS];

        const report = await generateAdsReport({
            fromDate,
            toDate,
            compareType,
            compareFromDate,
            compareToDate,
            campaignIds,
            sections,
        });

        return res.status(200).json({
            success: true,
            message: "Ads report generated successfully",
            data: report,
        });
    } catch (error) {
        console.error("Get Ads Report Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate ads report",
        });
    }
};

/**
 * GET /reports/campaign-options
 */
const getCampaignOptions = async (req, res) => {
    try {
        const campaigns = await getCampaignList();

        return res.status(200).json({
            success: true,
            data: campaigns,
        });
    } catch (error) {
        console.error("Get Campaign Options Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch campaigns",
        });
    }
};

module.exports = {
    getAdsReport,
    getCampaignOptions,
};
