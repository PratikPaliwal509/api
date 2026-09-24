const express = require("express");
const router = express.Router();

const metaLeadController = require("../controllers/metaLead.controller");

router.get(
    "/forms",
    metaLeadController.getLeadForms
);

router.get("/forms/:formId/leads", metaLeadController.fetchFormLeads);
router.post("/forms", metaLeadController.createLeadForm);
// router.patch("/forms/:formId/archive", metaLeadController.archiveForm);
// router.delete("/forms/:formId", metaLeadController.deleteLeadForm);

module.exports = router;