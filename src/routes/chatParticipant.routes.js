const express = require("express");
const router = express.Router();

const participantController = require("../controllers/chatParticipant.controller");

router.post("/", participantController.addParticipant);

router.get("/chat/:chatId", participantController.getParticipantsByChat);
router.get("/:id", participantController.getParticipantById);

router.put("/:id", participantController.updateParticipant);

router.delete("/:id", participantController.removeParticipant);

module.exports = router;