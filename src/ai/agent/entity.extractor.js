// src/ai/agent/entity.extractor.js

module.exports = (text) => {
  const entities = {};

  // Extract date keywords
  if (text.includes("today")) {
    entities.date = "today";
  } else if (text.includes("tomorrow")) {
    entities.date = "tomorrow";
  } else if (text.includes("yesterday")) {
    entities.date = "yesterday";
  }

  // Extract status
  if (text.includes("pending")) {
    entities.status = "pending";
  } else if (text.includes("completed")) {
    entities.status = "completed";
  }

  // Extract client id (e.g., 'client id 4' or 'client with id 4')
  const clientIdMatch = text.match(/client(?:\s+with)?\s+id\s+(\d+)/i);
  if (clientIdMatch) {
    entities.client_id = parseInt(clientIdMatch[1], 10);
  }

  // Extract name (very basic)
  const words = text.split(" ");
  const nameIndex = words.findIndex((w) => w === "for" || w === "of");

  if (nameIndex !== -1 && words[nameIndex + 1]) {
    entities.name = words[nameIndex + 1];
  }

  return entities;
};