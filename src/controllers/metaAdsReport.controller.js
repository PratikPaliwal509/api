const {
    generateAdsReport
} = require("../services/metaAdsReport.service");

const getAdsReport = async (req, res) => {

    try {

        const {
            fromDate,
            toDate,
            compareType = "previous_month",
            compareFromDate,
            compareToDate,
            reportLevel = "overall"
        } = req.query;

        // Current report dates are always required
        if (!fromDate || !toDate) {
            return res.status(400).json({
                success: false,
                message: "Report dates are required"
            });
        }

        // Comparison dates are required ONLY for custom comparison
        if (
            compareType === "custom" &&
            (!compareFromDate || !compareToDate)
        ) {
            return res.status(400).json({
                success: false,
                message: "Comparison dates are required for custom comparison"
            });
        }

        const report = await generateAdsReport({
            fromDate,
            toDate,
            compareType,
            compareFromDate,
            compareToDate,
            reportLevel
        });

        return res.status(200).json({
            success: true,
            message: "Ads report generated successfully",
            data: report
        });

    } catch (error) {

        console.error(
            "Get Ads Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate ads report"
        });
    }
};

module.exports = {
    getAdsReport
};