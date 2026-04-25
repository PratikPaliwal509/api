// validations/task.validation.js

const { z } = require("zod");

const PRIORITY = ["low", "medium", "high"];
const STATUS = ["to_do", "in_progress", "completed", "blocked"];

exports.createTaskSchema = z.object({
  project_id: z.number().int().positive(),

  parent_task_id: z.number().int().positive().nullable().optional(),

  task_title: z
    .string()
    .min(3, "Task title must be at least 3 chars")
    .max(500),

  description: z.string().optional(),

  task_type: z.string().max(100).optional(),

  priority: z.enum(PRIORITY).default("medium"),

  status: z.enum(STATUS).default("to_do"),

  start_date: z.date().nullable().optional(),
  due_date: z.date().nullable().optional(),

  estimated_hours: z.number().positive().nullable().optional(),

  is_billable: z.boolean().optional(),
  is_milestone: z.boolean().optional(),
  is_recurring: z.boolean().optional(),

  depends_on: z.array(z.number().int()).optional(),
  blocks: z.array(z.number().int()).optional(),

  assignees: z.array(z.number().int()).optional(),

  visible_to_client: z.boolean().optional(),
  client_approval_required: z.boolean().optional(),

  labels: z.array(z.string()).optional(),
});