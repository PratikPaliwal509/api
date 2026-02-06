
const prisma = require('../config/db');

// Helper: convert minutes to HH:MM
const toHHMM = (minutes = 0) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

exports.getTimesheetByUser = async (userId) => {
  // 1️⃣ Get all projects where user is project member or manager
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { project_manager_id: userId },
        { projectMembers: { some: { user_id: userId, is_active: true } } },
      ],
    },
    include: {
      tasks: {
        include: {
          timeLogs: true,
        },
      },
    },
  })

  // Initialize totals
  let totalActualMinutes = 0
  let totalBillableMinutes = 0
  let totalBilledMinutes = 0
  let totalUnbilledMinutes = 0
  let totalBillableAmount = 0
  let totalBilledAmount = 0
  let totalUnbilledAmount = 0
  const logs = []

  // 2️⃣ Iterate projects → tasks → timelogs
  projects.forEach((project) => {
    project.tasks.forEach((task) => {
      task.timeLogs.forEach((log) => {
        const minutes = log.duration_minutes || 0
        const hours = minutes / 60
        const rate = Number(log.hourly_rate || 0)

        totalActualMinutes += minutes

        if (log.is_billable) {
          totalBillableMinutes += minutes
          totalBillableAmount += hours * rate

          if (log.is_invoiced) {
            totalBilledMinutes += minutes
            totalBilledAmount += hours * rate
          } else {
            totalUnbilledMinutes += minutes
            totalUnbilledAmount += hours * rate
          }
        }

        // Push detailed log
        logs.push({
          log_id: log.log_id,
          project_name: project.project_name,
          task_title: task.task_title,
          start_time: log.start_time,
          end_time: log.end_time,
          hours: (minutes / 60).toFixed(2),
          is_billable: log.is_billable,
          amount: (hours * rate).toFixed(2),
          currency: project.budget_currency || 'USD',
        })
      })
    })
  })

  // 3️⃣ Build summary
  const summary = {
    actual_hours: toHHMM(totalActualMinutes),
    billable_hours: toHHMM(totalBillableMinutes),
    billed_hours: toHHMM(totalBilledMinutes),
    unbilled_hours: toHHMM(totalUnbilledMinutes),
    billable_amount: totalBillableAmount.toFixed(2),
    billed_amount: totalBilledAmount.toFixed(2),
    unbilled_amount: totalUnbilledAmount.toFixed(2),
    currency: projects[0]?.budget_currency || 'USD',
  }

  return {
    summary,
    logs,
  }
}

exports.getTeamTimesheet = async (userId, agencyId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      team_id: true,
      role: { select: { role_name: true } },
    },
  });

  if (!user) {
    const err = new Error('USER_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  const role = user.role.role_name.toLowerCase();
  let logs = [];
  let accessType = '';

  /**
   * =========================
   * ADMIN → ALL USERS
   * =========================
   */
  console.log(role === 'super admin')
  if (role === 'super admin') {
    accessType = 'SUPER ADMIN';

    logs = await prisma.timeLog.findMany({
      where: {
        user: {
          agency_id: agencyId,
          is_active: true,
        },
      },
      include: commonIncludes,
      orderBy: { start_time: 'desc' },
    });
  }
  else if (role === 'admin') {
    accessType = 'ADMIN';

    logs = await prisma.timeLog.findMany({
      where: {
        user: {
          agency_id: agencyId,
          is_active: true,
        },
      },
      include: commonIncludes,
      orderBy: { start_time: 'desc' },
    });
  }

  /**
   * =========================
   * TEAM LEAD → OWN TEAM
   * =========================
   */
  else {
    const team = await prisma.team.findFirst({
      where: {
        team_lead_id: userId,
        agency_id: agencyId,
      },
      select: { team_id: true },
    });

    if (team) {
      accessType = 'TEAM_LEAD';

      logs = await prisma.timeLog.findMany({
        where: {
          user: {
            team_id: team.team_id,
            is_active: true,
          },
        },
        include: commonIncludes,
        orderBy: { start_time: 'desc' },
      });
    }
  }

  /**
   * =========================
   * PROJECT MANAGER → PROJECTS
   * =========================
   */
  if (role === 'project manager') {
    accessType = 'PROJECT_MANAGER';

    const projects = await prisma.project.findMany({
      where: {
        project_manager_id: userId,
        agency_id: agencyId,
      },
      select: { project_id: true },
    });

    const projectIds = projects.map(p => p.project_id);

    if (!projectIds.length) {
      return emptyTimesheet(accessType);
    }

    logs = await prisma.timeLog.findMany({
      where: {
        project_id: { in: projectIds },
      },
      include: commonIncludes,
      orderBy: { start_time: 'desc' },
    });
  }

  if (!logs.length) {
    return emptyTimesheet(accessType);
  }

  return buildTimesheetResponse(logs, accessType);
};

/**
 * =========================
 * COMMON INCLUDES
 * =========================
 */
const commonIncludes = {
  project: { select: { project_name: true } },
  task: { select: { task_title: true } },
  user: { select: { full_name: true } },
};

/**
 * =========================
 * EMPTY RESPONSE
 * =========================
 */
const emptyTimesheet = (accessType) => ({
  accessType,
  total_users: 0,
  users: [],
});


/**
 * =========================
 * HELPER → FORMAT RESPONSE
 * =========================
 */
function buildTimesheetResponse(logs = [], accessType) {
  const toHHMM = (minutes = 0) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const userMap = {};

  logs.forEach(log => {
    const minutes = log.duration_minutes || 0;
    const hours = minutes / 60;
    const rate = Number(log.hourly_rate || 0);
    const amount = hours * rate;

    if (!userMap[log.user_id]) {
      userMap[log.user_id] = {
        user_id: log.user_id,
        user_name: log.user.full_name,
        total_minutes: 0,
        billable_minutes: 0,
        billed_minutes: 0,
        unbilled_minutes: 0,
        billable_amount: 0,
        billed_amount: 0,
        unbilled_amount: 0,
        logs: [],
      };
    }

    const u = userMap[log.user_id];
    u.total_minutes += minutes;

    if (log.is_billable) {
      u.billable_minutes += minutes;
      u.billable_amount += amount;

      if (log.is_invoiced) {
        u.billed_minutes += minutes;
        u.billed_amount += amount;
      } else {
        u.unbilled_minutes += minutes;
        u.unbilled_amount += amount;
      }
    }

    u.logs.push({
      log_id: log.log_id,
      project_name: log.project?.project_name,
      task_title: log.task?.task_title,
      date: log.start_time,
      hours: toHHMM(minutes),
      is_billable: log.is_billable,
      amount: amount.toFixed(2),
    });
  });

  return {
    accessType,
    total_users: Object.keys(userMap).length,
    users: Object.values(userMap).map(u => ({
      user_id: u.user_id,
      user_name: u.user_name,
      summary: {
        actual_hours: toHHMM(u.total_minutes),
        billable_hours: toHHMM(u.billable_minutes),
        billed_hours: toHHMM(u.billed_minutes),
        unbilled_hours: toHHMM(u.unbilled_minutes),
        billable_amount: u.billable_amount.toFixed(2),
        billed_amount: u.billed_amount.toFixed(2),
        unbilled_amount: u.unbilled_amount.toFixed(2),
      },
      logs: u.logs,
    })),
  };
}

