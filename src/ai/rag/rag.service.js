// src/ai/rag/rag.service.js

const embedService = require("./embed.service");
const vectorStore = require("./vector.store");
const contextBuilder = require("./context.builder");

const llmService = require("../llm/openai.service");

exports.addToKnowledgeBase = async ({ id, text, metadata }) => {
  const embedding = await embedService.getEmbedding(text);

  vectorStore.add({
    id,
    text,
    embedding,
    metadata,
  });
};

exports.retrieveContext = async (query) => {
  const queryEmbedding = await embedService.getEmbedding(query);

  const results = vectorStore.search(queryEmbedding, 5);

  return contextBuilder.buildContext(results);
};

exports.ask = async (query) => {
  try {
    // 1. Retrieve context
    const context = await exports.retrieveContext(query);

    // 2. Combine with query
    const finalPrompt = `
You are a CRM assistant.

Use the following context to answer:

${context}

User Question:
${query}
    `;

    // 3. Send to LLM
    const response = await llmService.chat(finalPrompt);

    return {
      context,
      message: response,
    };

  } catch (error) {
    console.error("RAG Error:", error);

    return {
      message: "RAG processing failed",
    };
  }
};