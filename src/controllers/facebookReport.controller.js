const facebookReportService = require(
    "../services/facebookReport.service"
);

// ======================================================
// GENERATE FACEBOOK PAGE REPORT
// ======================================================

const generatePostReport = async (
    req,
    res
) => {
    try {
        const {
            fromDate,
            toDate,
            compareType,
            compareFromDate,
            compareToDate,
        } = req.query;
        console.log(compareType)
        // ==============================================
        // VALIDATION
        // ==============================================

        if (!fromDate) {
            return res.status(400).json({
                success: false,
                message:
                    "fromDate is required",
            });
        }

        if (!toDate) {
            return res.status(400).json({
                success: false,
                message:
                    "toDate is required",
            });
        }

        const validCompareTypes = [
            "previous_period",
            "previous_month",
            "custom",
        ];

        if (
            !validCompareTypes.includes(
                compareType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid compareType",
            });
        }

        if (
            compareType === "custom"
        ) {
            if (
                !compareFromDate ||
                !compareToDate
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "compareFromDate and compareToDate are required for custom comparison",
                });
            }
        }

        // ==============================================
        // GENERATE REPORT
        // ==============================================

        const report =
            await facebookReportService.generatePostReport(
                {
                    fromDate,
                    toDate,
                    compareType,
                    compareFromDate,
                    compareToDate,
                }
            );

        // ==============================================
        // RESPONSE
        // ==============================================
console.log(report)
        return res.status(200).json({
            success: true,

            message:
                "Facebook Page performance report generated successfully",

            data: report,
        });
    } catch (error) {
        console.error(
            "Generate Facebook Report Error:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to generate Facebook Page performance report",

            error:
                error.response?.data ||
                error.message,
        });
    }
};

module.exports = {
    generatePostReport,
};