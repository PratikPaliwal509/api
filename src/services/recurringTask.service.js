const prisma = require('../config/db');

const runRecurringTasks = async () => {
  try {
    const now = new Date();

    const tasks = await prisma.task.findMany({
      where: {
        is_recurring: true
      }
    });

    for (const task of tasks) {
      const pattern = task.recurrence_pattern;

      if (!pattern?.next_run_at) continue;

      const nextRun = new Date(pattern.next_run_at);

      // ❌ STOP IF END DATE IS PASSED
      if (pattern.end_date && new Date(pattern.end_date) < nextRun) {
        // optional: mark task as no longer recurring
        await prisma.task.update({
          where: { task_id: task.task_id },
          data: {
            is_recurring: false
          }
        });

        continue;
      }

      if (nextRun <= now) {

        // ✅ Create child task
        await prisma.task.create({
          data: {
            project_id: task.project_id,
            parent_task_id: task.task_id,
            task_title: task.task_title,
            description: task.description,
            due_date: nextRun,
            priority: task.priority,
            status: 'to_do',
            assigned_to: task.assigned_to,
          }
        });

        // ✅ Calculate next run
        let updatedNextRun = new Date(nextRun);

        if (pattern.type === 'daily') {
          updatedNextRun.setDate(updatedNextRun.getDate() + (pattern.interval || 1));
        }

        if (pattern.type === 'weekly') {
          updatedNextRun.setDate(updatedNextRun.getDate() + (7 * (pattern.interval || 1)));
        }

        if (pattern.type === 'monthly') {
          updatedNextRun.setMonth(updatedNextRun.getMonth() + (pattern.interval || 1));
        }

        // ✅ Update parent task
        await prisma.task.update({
          where: { task_id: task.task_id },
          data: {
            recurrence_pattern: {
              ...pattern,
              next_run_at: updatedNextRun.toISOString()
            }
          }
        });

        console.log(`Recurring task created: ${task.task_title}`);
      }
    }

  } catch (err) {
    console.error('Recurring task error:', err);
  }
};

module.exports = { runRecurringTasks };