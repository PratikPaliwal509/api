// src/ai/tools/action.router.js

const clientTool = require("./client.tool");
const taskTool = require("./task.tool");
// const noteTool = require("./note.tool");

exports.handle = async (intent, userId) => {
  const { entity } = intent;

  switch (entity) {
    case "client":
      return await clientTool.execute(intent, userId);

    case "task":
      return await taskTool.execute(intent, userId);

    // case "note":
    //   return await noteTool.execute(intent, userId);

    default:
      return {
        message: "Unsupported entity",
      };
  }
};