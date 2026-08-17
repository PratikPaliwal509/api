const express = require("express");

const router = express.Router();

const weeklyPlanController = require(
  "../controllers/weeklyPlan.controller"
);

const authMiddleware = require(
  "../middlewares/auth.middleware"
);


router.post(
  "/",
  authMiddleware,
  weeklyPlanController.createWeeklyPlan
);
    
router.get(
  "/",
  authMiddleware,
  weeklyPlanController.getAllWeeklyPlans
);

router.get(
  "/:id",
  authMiddleware,
  weeklyPlanController.getWeeklyPlanById
);

router.put(
  "/:id",
  authMiddleware,
  weeklyPlanController.updateWeeklyPlan
);

router.delete(
  "/:id",
  authMiddleware,
  weeklyPlanController.deleteWeeklyPlan
);

module.exports = router;