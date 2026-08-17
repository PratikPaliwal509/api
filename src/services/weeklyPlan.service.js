const prisma = require('../config/db');

exports.createWeeklyPlan = async (data, userId) => {
  const weeklyPlan = await prisma.weeklyPlan.create({
    data: {
      title: data.plan_name,
      description: data.description,
      start_date: new Date(data.week_start),
      end_date: new Date(data.week_end),

      project_id: data.project_id
        ? Number(data.project_id)
        : null,

      created_by: userId,
    },
  });

  // Create tasks if provided
  if (data.tasks?.length) {
    for (const task of data.tasks) {
      console.log("Creating task:", task);
      const createdTask = await prisma.task.create({
        data: {
          project_id: Number(data.project_id),

          weekly_plan_id:
            weeklyPlan.weekly_plan_id,

          task_title: task.task_title,

          description:
            task.description || null,

          priority:
            task.priority || "medium",

          status: "to_do",
          due_date: task.due_date
            ? new Date(task.due_date)
            : null,
          created_by: userId,
          assigned_to: [userId],
          assigned_date: new Date(),
        },
      });
      await prisma.taskAssignment.create({
        data: {
          task_id: createdTask.task_id,
          user_id: userId,
          assigned_by: userId,
          is_active: true,
        },
      });

    }
  }

  return weeklyPlan;
};

exports.getAllWeeklyPlans = async (userId, role_name) => {
   const whereCondition =
    role_name === "Admin" || role_name === "Super Admin"
      ? {}
      : {
          created_by: userId,
        };
  const weeklyPlans = await prisma.weeklyPlan.findMany({
        where: whereCondition,
    include: {
      project: true,
      creator: true,
      tasks: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return weeklyPlans.map((plan) => {
    const totalTasks = plan.tasks.length;

    const completedTasks = plan.tasks.filter(
      (task) => task.status === "completed"
    ).length;

    const progressPercentage =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    return {
      ...plan,
      totalTasks,
      completedTasks,
      progressPercentage,
    };
  });
};

exports.getWeeklyPlanById = async (
  weeklyPlanId
) => {
  return prisma.weeklyPlan.findUnique({
    where: {
      weekly_plan_id: Number(
        weeklyPlanId
      ),
    },
    include: {
      project: true,

      creator: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
        },
      },

      tasks: {
        include: {
          assignments: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });
};

exports.updateWeeklyPlan = async (
  weeklyPlanId,
  data
) => {
  return prisma.weeklyPlan.update({
    where: {
      weekly_plan_id: Number(
        weeklyPlanId
      ),
    },
    data: {
      plan_name: data.plan_name,
      description: data.description,
      week_start: data.week_start,
      week_end: data.week_end,
    },
  });
};

exports.deleteWeeklyPlan = async (
  weeklyPlanId
) => {
  return prisma.weeklyPlan.delete({
    where: {
      weekly_plan_id: Number(
        weeklyPlanId
      ),
    },
  });
};
