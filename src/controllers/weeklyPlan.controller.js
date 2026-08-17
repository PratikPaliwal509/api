const weeklyPlanService = require(
  "../services/weeklyPlan.service"
);

exports.createWeeklyPlan = async (
  req,
  res
) => {
  try {
    const plan =
      await weeklyPlanService.createWeeklyPlan(
        req.body,
        req.user.user_id
      );
    
    return res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to create weekly plan",
    });
  }
};

exports.getAllWeeklyPlans =
  async (req, res) => {
    console.log(req.user)
    try {
      const plans =
        await weeklyPlanService.getAllWeeklyPlans(req.user.user_id, req.user.role.role_name);

      return res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch weekly plans",
      });
    }
  };

exports.getWeeklyPlanById =
  async (req, res) => {
    try {
      const plan =
        await weeklyPlanService.getWeeklyPlanById(
          req.params.id
        );

      if (!plan) {
        return res.status(404).json({
          success: false,
          message:
            "Weekly plan not found",
        });
      }

      return res.json({
        success: true,
        data: plan,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch weekly plan",
      });
    }
  };

exports.updateWeeklyPlan =
  async (req, res) => {
    try {
      const plan =
        await weeklyPlanService.updateWeeklyPlan(
          req.params.id,
          req.body
        );

      return res.json({
        success: true,
        data: plan,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to update weekly plan",
      });
    }
  };

exports.deleteWeeklyPlan =
  async (req, res) => {
    try {
      await weeklyPlanService.deleteWeeklyPlan(
        req.params.id
      );

      return res.json({
        success: true,
        message:
          "Weekly plan deleted successfully",
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete weekly plan",
      });
    }
  };