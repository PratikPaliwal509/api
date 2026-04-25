const { z } = require("zod");

exports.createProjectSchema = z.object({
  agency_id: z.coerce.number().int().positive(),

  client_id: z.coerce.number().int().positive().nullable().optional(),

  project_name: z
    .string()
    .min(2, "Project name is required")
    .max(255),

  project_code: z
    .string()
    .min(2, "Project code is required")
    .max(50)
    .optional(), // auto-generated in service

  description: z.string().nullable().optional(),

  project_type: z.string().max(100).nullable().optional(),

  start_date: z.preprocess(
    (v) => (v ? new Date(v) : new Date()),
    z.date()
  ),

  end_date: z.preprocess(
    (v) => (v ? new Date(v) : null),
    z.date().nullable().optional()
  ),

  estimated_hours: z.coerce.number().positive().nullable().optional(),

  actual_hours: z.coerce.number().nonnegative().nullable().optional(),

  budget_amount: z.coerce.number().positive().nullable().optional(),

  budget_currency: z.string().max(10).optional(),

  billing_type: z.string().max(50).nullable().optional(),

  project_manager_id: z.coerce.number().int().positive(),

  priority: z.enum(["low", "medium", "high"]).default("medium"),

  status: z
    .enum(["planning", "active", "completed", "on_hold"])
    .default("planning"),

  progress_percentage: z.coerce.number().min(0).max(100).optional(),

  is_billable: z.boolean().optional(),
  is_public: z.boolean().optional(),

  auto_task_numbering: z.boolean().optional(),

  task_prefix: z.string().max(10).nullable().optional(),

  tags: z.array(z.string()).default([]),

  custom_fields: z.any().nullable().optional(),

  notes: z.string().nullable().optional(),

  created_by: z.coerce.number().int().optional(),
});