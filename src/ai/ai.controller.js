const aiService = require("./ai.service");

exports.chat = async (req, res) => {
    try {
        console.log("Received AI chat request:", req.body);

        const { message, userId, sessionId } = req.body;
        const parsedUserId = userId ? Number(userId) : null;
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        const response = await aiService.processMessage({
            message,
            parsedUserId,
            sessionId,
        });

        return res.status(200).json({
            success: true,
            data: response,
        });

    } catch (error) {
        console.error("AI Controller Error:", error);

        return res.status(500).json({
            success: false,
            message: "AI processing failed",
        });
    }
};