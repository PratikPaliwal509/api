// src/ai/tools/task.tool.js

const taskService = require("../../services/task.service");

exports.execute = async (intent, userId) => {
  const { type, filters, data } = intent;

  try {
    // READ
    if (type === "READ") {
      const tasks = await taskService.getAllTasks({
        ...filters,
        userId,
      });

      return {
        message: "Tasks fetched successfully",
        data: tasks,
      };
    }

    // CREATE
    if (type === "CREATE") {
      const task = await taskService.createTask({
        ...data,
        userId,
      });

      return {
        message: "Task created successfully",
        data: task,
      };
    }

    // UPDATE
    if (type === "UPDATE") {
      return {
        message: "Update task not implemented yet",
      };
    }

    // DELETE
    if (type === "DELETE") {
      return {
        message: "Delete task not implemented yet",
      };
    }

    return { message: "Invalid task operation" };

  } catch (error) {
    console.error("Task Tool Error:", error);
    return { message: "Task operation failed" };
  }
};