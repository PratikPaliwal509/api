// src/ai/agent/query.parser.js

module.exports = ({ type, entity, entities, text }) => {
  let filters = {};
  let data = {};

  // READ → build filters
  if (type === "READ") {
    if (entities.status) {
      filters.status = entities.status;
    }

    if (entities.name) {
      filters.name = entities.name;
    }

    if (entities.date) {
      filters.date = entities.date;
    }

    if (entities.client_id) {
      filters.client_id = entities.client_id;
    }
  }

  // CREATE → build data
  if (type === "CREATE") {
    if (entity === "task") {
      data.title = text;

      if (entities.date) {
        data.dueDate = entities.date;
      }
    }

    if (entity === "client") {
      if (entities.name) {
        data.name = entities.name;
      }
    }

    if (entity === "note") {
      data.content = text;
    }
  }

  // UPDATE (basic)
  if (type === "UPDATE") {
    data.updateText = text;
  }

  return { filters, data };
};