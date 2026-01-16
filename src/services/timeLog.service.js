const prisma = require('../config/db');

// Added new code here
const getActiveTimeLog = async ({ taskId, userId }) => {
  return prisma.timeLog.findFirst({
    where: {
      task_id: Number(taskId),
      user_id: Number(userId),
      end_time: null
    }
  })
}

// 2️⃣ Start timer
const startTimeLog = async ({
  taskId,
  userId,
  project_id
}) => {
  // Prevent multiple active timers for same task + user
  const existing = await getActiveTimeLog({
    taskId,
    userId
  })

  if (existing) return existing

  return prisma.timeLog.create({
    data: {
      task_id: Number(taskId),
      user_id: Number(userId),
      project_id: Number(project_id),
      start_time: new Date(),
      log_type: "automatic",
      is_billable: true
    }
  })
}

// 3️⃣ Stop timer
const stopTimeLog = async ({ logId, userId }) => {
  const log = await prisma.timeLog.findFirst({
    where: {
      log_id: Number(logId),
      user_id: Number(userId),
      end_time: null
    }
  })

  if (!log) return null

  const endTime = new Date()
  const durationMinutes = Math.ceil(
    (endTime - log.start_time) / 60000
  )

  return prisma.timeLog.update({
    where: {
      log_id: log.log_id
    },
    data: {
      end_time: endTime,
      duration_minutes: durationMinutes
    }
  })
}
// up to

/**
 * Create / Start Time Log
 */

const createOrUpdateTimeLog = async (
  taskId,
  userId,
  payload
) => {
  const {
    log_id,
    project_id,
    start_time,
    end_time,
    description,
    is_billable = true,
    hourly_rate,
    log_type = 'manual',
  } = payload

  if (!start_time) {
    throw new Error('start_time is required')
  }

  // ✅ Convert to Prisma-safe DateTime
  const startDate = new Date(start_time)
  const endDate = end_time ? new Date(end_time) : null

  if (isNaN(startDate)) {
    throw new Error('Invalid start_time format')
  }

  if (endDate && isNaN(endDate)) {
    throw new Error('Invalid end_time format')
  }

  // ✅ Duration calculation
  let duration_minutes = null
  if (endDate) {
    duration_minutes = Math.floor(
      (endDate.getTime() - startDate.getTime()) / 60000
    )
    if (duration_minutes < 0) {
      throw new Error('end_time must be after start_time')
    }
  }

  // 🔁 UPDATE
  if (log_id) {
    return prisma.timeLog.update({
      where: { log_id: Number(log_id) },
      data: {
        start_time: startDate,
        end_time: endDate,
        duration_minutes,
        description,
        is_billable,
        hourly_rate,
        log_type,
      },
    })
  }

  // ➕ CREATE
  return prisma.timeLog.create({
    data: {
      task_id: taskId,
      user_id: userId,
      project_id,
      start_time: startDate,
      end_time: endDate,
      duration_minutes,
      description,
      is_billable,
      hourly_rate,
      log_type,
    },
  })
}

const createTimeLog = async (taskId, data, userId) => {
  return prisma.timeLog.create({
    data: {
      task_id: taskId,
      project_id: data.project_id,
      user_id: userId,
      start_time: data.start_time || new Date(),
      description: data.description,
      is_billable: data.is_billable,
      hourly_rate: data.hourly_rate,
      log_type: data.log_type || 'manual'
    }
  });
};

/**
 * Get Time Logs by Task
 */
const getTimeLogsByTask = async (taskId) => {
  return prisma.timeLog.findMany({
    where: { task_id: taskId },
    include: {
      user: true
    },
    orderBy: { start_time: 'desc' }
  });
};

/**
 * Update / Stop Time Log
 */
const updateTimeLog = async (logId, data) => {
  let durationMinutes = data.duration_minutes;

  if (data.start_time && data.end_time) {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    durationMinutes = Math.floor((end - start) / 60000);
  }

  return prisma.timeLog.update({
    where: { log_id: logId },
    data: {
      end_time: data.end_time,
      duration_minutes: durationMinutes,
      description: data.description,
      is_billable: data.is_billable,
      hourly_rate: data.hourly_rate
    }
  });
};

/**
 * Delete Time Log
 */
const deleteTimeLog = async (logId) => {
  return prisma.timeLog.delete({
    where: { log_id: logId }
  });
};

/**
 * Approve Time Log
 */
const approveTimeLog = async (logId, approvedBy) => {
  return prisma.timeLog.update({
    where: { log_id: logId },
    data: {
      is_approved: true,
      approved_by: approvedBy,
      approved_at: new Date()
    }
  });
};

module.exports = {
  getActiveTimeLog,
  startTimeLog,
  stopTimeLog,createOrUpdateTimeLog,
  createTimeLog,
  getTimeLogsByTask,
  updateTimeLog,
  deleteTimeLog,
  approveTimeLog
};
