// src/ai/tools/note.tool.js

const noteService = require("../../services/n");

exports.execute = async (intent, userId) => {
  const { type, filters, data } = intent;

  try {
    // READ
    if (type === "READ") {
      const notes = await noteService.getAllNotes({
        ...filters,
        userId,
      });

      return {
        message: "Notes fetched successfully",
        data: notes,
      };
    }

    // CREATE
    if (type === "CREATE") {
      const note = await noteService.createNote({
        ...data,
        userId,
      });

      return {
        message: "Note created successfully",
        data: note,
      };
    }

    // UPDATE
    if (type === "UPDATE") {
      return {
        message: "Update note not implemented yet",
      };
    }

    // DELETE
    if (type === "DELETE") {
      return {
        message: "Delete note not implemented yet",
      };
    }

    return { message: "Invalid note operation" };

  } catch (error) {
    console.error("Note Tool Error:", error);
    return { message: "Note operation failed" };
  }
};