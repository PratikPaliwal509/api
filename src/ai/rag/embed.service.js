// src/ai/rag/embed.service.js

const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

exports.getEmbedding = async (text) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        model: "text-embedding-3-small",
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error("Embedding Error:", error.response?.data || error.message);
    throw new Error("Failed to generate embedding");
  }
};