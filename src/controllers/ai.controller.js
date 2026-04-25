// controllers/ai.controller.js

const aiService = require("../services/ai.service");

exports.handleAIRequest = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // ✅ FULL USER FROM MIDDLEWARE
    const user = req.user;

    console.log("AI Request from user:", user.user_id);

    const result = await aiService.processMessage(message, user);

    return res.json(result);
  } catch (error) {
    console.error("AI Controller Error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};