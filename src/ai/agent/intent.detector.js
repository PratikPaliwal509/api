// src/ai/agent/intent.detector.js

const extractEntities = require("./entity.extractor");
const parseQuery = require("./query.parser");

const ACTION_KEYWORDS = {
  CREATE: ["create", "add", "insert", "new"],
  READ: ["show", "get", "list", "find", "fetch"],
  UPDATE: ["update", "edit", "change", "modify"],
  DELETE: ["delete", "remove"],
};

const ENTITY_KEYWORDS = {
  client: ["client", "customer", "lead"],
  task: ["task", "todo"],
  note: ["note", "remark"],
};

module.exports = async (message) => {
  const text = message.toLowerCase();

  let detectedType = "GENERAL";
  let detectedEntity = null;

  // 1. Detect action
  for (const [type, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some((word) => text.includes(word))) {
      detectedType = type;
      break;
    }
  }

  // 2. Detect entity
  for (const [entity, keywords] of Object.entries(ENTITY_KEYWORDS)) {
    if (keywords.some((word) => text.includes(word))) {
      detectedEntity = entity;
      break;
    }
  }

  // 3. Extract filters & data
  const entities = extractEntities(text);

  // 4. Parse structured query
  const parsed = parseQuery({
    type: detectedType,
    entity: detectedEntity,
    entities,
    text,
  });

  return {
    type: detectedType,
    entity: detectedEntity,
    filters: parsed.filters || {},
    data: parsed.data || {},
    raw: text,
  };
};