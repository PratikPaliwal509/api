const prisma = require('../config/db');
const { createNotification } = require('./notification.service');

const REMINDER_DAYS = [1, 3, 7];

const checkTaskReminders = async () => {
  console.log("🔔 Checking task reminders...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = await prisma.task.findMany({
    where: {
      due_date: { not: null },
      // is_active: true
    }
  });

  for (const task of tasks) {

  const dueDate = new Date(task.due_date);
  dueDate.setHours(0, 0, 0, 0);

  console.log("------------------------------------------------");
  console.log("Task:", task.task_title);
  console.log("Today:", today.toDateString());
  console.log("Due Date:", dueDate.toDateString());

  // =========================
  // 🔔 REMINDER LOGIC
  // =========================

  for (const days of REMINDER_DAYS) {
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - days);

    console.log(`${days} day reminder should trigger on:`, reminderDate.toDateString());

    if (reminderDate.getTime() === today.getTime()) {
      console.log("✅ Reminder MATCHED for:", task.task_title);

      const assignments = await prisma.taskAssignment.findMany({
        where: {
          task_id: task.task_id,
          is_active: true
        }
      });

      for (const assign of assignments) {

        const alreadySent = await prisma.notification.findFirst({
          where: {
            user_id: assign.user_id,
            entity_type: 'TASK',
            entity_id: task.task_id,
            notification_type: 'TASK_DUE_REMINDER',
            created_at: { gte: today }
          }
        });

        if (!alreadySent) {
          await createNotification({
            user_id: assign.user_id,
            notification_type: 'TASK_DUE_REMINDER',
            title: 'Task Due Reminder',
            message: `Task "${task.task_title}" is due on ${dueDate.toDateString()} (${days} day reminder).`,
            entity_type: 'TASK',
            entity_id: task.task_id,
            action_url: `/applications/tasks`,
            sent_via_email: true
          });
        }
      }
    }
  }

  // =========================
  // 🚨 OVERDUE LOGIC
  // =========================

  if (dueDate.getTime() < today.getTime()) {

    if (task.status === 'COMPLETED') {
      continue;
    }

    console.log("🚨 Overdue Task Found:", task.task_title);

    const assignments = await prisma.taskAssignment.findMany({
      where: {
        task_id: task.task_id,
        is_active: true
      }
    });

    for (const assign of assignments) {

      const alreadySent = await prisma.notification.findFirst({
        where: {
          user_id: assign.user_id,
          entity_type: 'TASK',
          entity_id: task.task_id,
          notification_type: 'TASK_OVERDUE',
          created_at: { gte: today }
        }
      });

      if (!alreadySent) {
        await createNotification({
          user_id: assign.user_id,
          notification_type: 'TASK_OVERDUE',
          title: 'Task Overdue',
          message: `Task "${task.task_title}" is overdue! It was due on ${dueDate.toDateString()}.`,
          entity_type: 'TASK',
          entity_id: task.task_id,
          action_url: `/applications/tasks`,
          sent_via_email: true
        });

        console.log("🚨 Overdue notification sent to user:", assign.user_id);
      }
    }
  }

} // ← loop ends here


};

module.exports = { checkTaskReminders };
