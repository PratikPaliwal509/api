const express = require("express");
const router = express.Router();

const reactionController = require("../controllers/chatReaction.controller");

router.post("/", reactionController.addReaction);

router.get("/message/:messageId", reactionController.getReactionsByMessage);

router.delete("/:id", reactionController.removeReaction);

module.exports = router;