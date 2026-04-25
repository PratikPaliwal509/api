// src/validations/client.validation.js

const { z } = require("zod");

exports.createClientSchema = z.object({
  // 🔥 REQUIRED (from Prisma relation)
  agency_id: z.coerce.number().int().positive(),

  // 🔥 REQUIRED
  company_name: z
    .string()
    .min(2, "Company name is required")
    .max(255),

  // optional business info
  industry: z.string().max(100).optional(),
  company_size: z.string().max(50).optional(),
  website: z.string().url().optional(),

  // contact person
  primary_contact_name: z.string().max(255).optional(),
  primary_contact_email: z.string().email().optional(),
  primary_contact_phone: z.string().max(20).optional(),

  // address fields
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),

  // billing
  tax_id: z.string().max(50).optional(),
  billing_email: z.string().email().optional(),
  billing_address: z.string().optional(),

  payment_terms: z.coerce.number().int().positive().default(30),

  // system fields
  status: z.enum(["active", "inactive"]).default("active"),

  notes: z.string().optional(),

  created_by: z.coerce.number().int().optional(),

  // optional AI fallback fields (VERY IMPORTANT)
  email: z.string().email().optional(), // AI sometimes sends this
  name: z.string().optional(), // AI fallback
});