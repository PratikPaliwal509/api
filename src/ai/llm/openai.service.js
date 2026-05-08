// src/ai/llm/openai.service.js

const axios = require("axios");
const {
  SYSTEM_PROMPT,
  INTENT_PROMPT,
  CHAT_PROMPT,
} = require("./prompt.templates");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";


// 🔹 Base LLM call
const callLLM = async (messages, temperature = 0.2) => {
  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: "gpt-5.4-mini", // you can change
        messages,
        temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error("OpenAI Error:", error.response?.data || error.message);
    throw new Error("LLM request failed");
  }
};


// 🔹 General Chat (for RAG)
exports.chat = async (prompt) => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];
  return callLLM(messages);
};

// 🔹 Intent Detection using AI
exports.detectIntentAI = async (message) => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: INTENT_PROMPT(message) },
  ];

  const raw = await callLLM(messages);

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("JSON Parse Error:", raw);

    return {
      type: "GENERAL",
      entity: null,
      filters: {},
      data: {},
    };
  }
};


// 🔹 Chat (used for RAG / general queries)
exports.chat = async ({ context, message }) => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: CHAT_PROMPT({ context, message }),
    },
  ];

  const response = await callLLM(messages, 0.5);

  return response;
};