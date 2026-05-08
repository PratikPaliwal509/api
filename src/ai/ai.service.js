const detectIntent = require("./agent/intent.detector");
const actionRouter = require("./tools/action.router");

const { validateIntent } = require("./guard/query.validator");
const { checkPermission } = require("./guard/permission.checker");

const chatMemory = require("./memory/chat.memory");
const sessionManager = require("./memory/session.manager");

const ragService = require("./rag/rag.service");

// OPTIONAL: switch later
// const { detectIntentAI } = require("./llm/openai.service");

exports.processMessage = async ({ message, userId, sessionId }) => {
  try {
    // 0. Session handling
    if (!sessionId) {
      sessionId = sessionManager.createSession(userId);
    } else {
      sessionManager.touchSession(sessionId);
    }

    // 1. Save user message in memory
    chatMemory.addMessage(sessionId, {
      role: "user",
      content: message,
    });

    // 2. Detect intent (replace with AI later)
    const intentData = await detectIntent(message);

    // 3. Validate intent
    if (intentData.type !== "GENERAL") {
      validateIntent(intentData);

      // 4. Permission check (replace role dynamically)
      checkPermission({
        userRole: "admin", // TODO: fetch from DB
        intent: intentData,
      });

      // 5. Execute action
      const result = await actionRouter.handle(intentData, userId);

      // 6. Save response in memory
      chatMemory.addMessage(sessionId, {
        role: "assistant",
        content: JSON.stringify(result),
      });

      return {
        type: "ACTION",
        sessionId,
        intent: intentData,
        result,
      };
    }

    // 7. GENERAL → use RAG
    const ragResponse = await ragService.ask(message);

    // 8. Save response in memory
    chatMemory.addMessage(sessionId, {
      role: "assistant",
      content: ragResponse.message || "No response",
    });

    return {
      type: "GENERAL",
      sessionId,
      response: ragResponse,
    };

  } catch (error) {
    console.error("AI Service Error:", error);

    return {
      type: "ERROR",
      message: error.message || "Something went wrong",
    };
  }
};