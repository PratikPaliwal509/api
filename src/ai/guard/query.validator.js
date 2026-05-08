// src/ai/guard/query.validator.js

exports.validateIntent = (intent) => {
  const { type, entity, data, filters } = intent;

  // 1. Basic validation
  if (!type) {
    throw new Error("Invalid intent: missing type");
  }

  if (!entity && type !== "GENERAL") {
    throw new Error("Invalid intent: missing entity");
  }

  // 2. Entity validation
  const allowedEntities = ["client", "task", "note"];
  if (entity && !allowedEntities.includes(entity)) {
    throw new Error(`Invalid entity: ${entity}`);
  }

  // 3. Type validation
  const allowedTypes = ["CREATE", "READ", "UPDATE", "DELETE", "GENERAL"];
  if (!allowedTypes.includes(type)) {
    throw new Error(`Invalid action type: ${type}`);
  }

  // 4. CREATE validations
  if (type === "CREATE") {
    if (entity === "client" && !data?.name) {
      throw new Error("Client name is required");
    }

    if (entity === "task" && !data?.title) {
      throw new Error("Task title is required");
    }

    if (entity === "note" && !data?.content) {
      throw new Error("Note content is required");
    }
  }

  // 5. UPDATE / DELETE safety
  if ((type === "UPDATE" || type === "DELETE") && !filters) {
    throw new Error(`${type} requires filters`);
  }

  // 6. Prevent dangerous mass delete/update
  if (
    (type === "DELETE" || type === "UPDATE") &&
    Object.keys(filters || {}).length === 0
  ) {
    throw new Error(`Unsafe ${type}: no filters provided`);
  }

  return true;
};