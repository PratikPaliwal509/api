// src/ai/memory/chat.memory.js

const memoryStore = new Map();

/*
Structure:
sessionId → [
  { role: "user", content: "..." },
  { role: "assistant", content: "..." }
]
*/

// Add message to memory
exports.addMessage = (sessionId, message) => {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, []);
  }

  memoryStore.get(sessionId).push(message);
};

// Get full chat history
exports.getMessages = (sessionId) => {
  return memoryStore.get(sessionId) || [];
};

// Clear memory
exports.clearMemory = (sessionId) => {
  memoryStore.delete(sessionId);
};

// Limit memory (keep last N messages)
exports.getRecentMessages = (sessionId, limit = 10) => {
  const messages = memoryStore.get(sessionId) || [];
  return messages.slice(-limit);
};