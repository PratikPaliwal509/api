const { z } = require("zod");

exports.createClientSchema = z
  .object({
    // ❌ remove required → controller will inject
    agency_id: z.coerce.number().int().positive().optional(),

    company_name: z
      .string()
      .min(2, "Company name is required")
      .max(255),

    industry: z.string().max(100).optional(),
    company_size: z.string().max(50).optional(),
    website: z.string().url().optional(),

    primary_contact_name: z.string().max(255).optional(),
    primary_contact_email: z.string().email().optional(),
    primary_contact_phone: z.string().max(20).optional(),

    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),

    tax_id: z.string().max(50).optional(),
    billing_email: z.string().email().optional(),
    billing_address: z.string().optional(),

    payment_terms: z.coerce.number().int().positive().default(30),

    status: z.enum(["active", "inactive"]).default("active"),

    notes: z.string().optional(),

    created_by: z.coerce.number().int().optional(),

    // 🔥 AI fallback fields
    email: z.string().email().optional(),
    name: z.string().optional(),
  })

  // ✅ CLEAN EMPTY STRINGS
  .transform((data) => {
    const clean = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? undefined : v])
    );

    return {
      ...clean,

      // ✅ AI → DB mapping
      primary_contact_email:
        clean.primary_contact_email || clean.email,

      primary_contact_name:
        clean.primary_contact_name || clean.name,
    };
  });