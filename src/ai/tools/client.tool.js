// src/ai/tools/client.tool.js
const prisma = require('../../config/db'); // adjust path if needed


const llmService = require("../llm/openai.service");

exports.execute = async (intent, userId) => {
  const { type, filters = {}, data = {}, raw } = intent;

  try {
    // 🔹 READ
    if (type === "READ") {
      const where = {
        AND: [],
      };

      // Company name OR contact name
      if (filters.name) {
        where.AND.push({
          OR: [
            { company_name: { contains: filters.name, mode: "insensitive" } },
            { primary_contact_name: { contains: filters.name, mode: "insensitive" } },
          ],
        });
      }

      // Email
      if (filters.email) {
        where.AND.push({
          OR: [
            { primary_contact_email: { contains: filters.email, mode: "insensitive" } },
            { billing_email: { contains: filters.email, mode: "insensitive" } },
          ],
        });
      }

      // Status
      if (filters.status) {
        where.AND.push({ status: filters.status });
      }

      // Active filter
      if (filters.active !== undefined) {
        where.AND.push({ is_active: filters.active === "true" || filters.active === true });
      }

      // Date filter (created today)
      if (filters.date === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        where.AND.push({ created_at: { gte: start, lte: end } });
      }

      // Filter by client_id
      if (filters.client_id) {
        where.AND.push({ client_id: filters.client_id });
      }

      // Agency isolation (IMPORTANT)
      if (userId) {
        where.AND.push({ created_by: userId });
      }

      // Fetch all matching clients (full data)
      const clients = await prisma.client.findMany({
        where: where.AND.length ? where : {},
        orderBy: { created_at: "desc" },
        take: 50,
      });

      // If user is asking for a specific field or info, use LLM to answer based on full data
      // Example: "What is the email of client with id 4?" or "Show me the address of client John"
      let aiResponse = null;
      if (raw && clients.length > 0) {
        // Prepare context for LLM
        const context = JSON.stringify(clients, null, 2);
        aiResponse = await llmService.chat({
          context,
          message: raw,
        });
      }

      return {
        message: aiResponse ? aiResponse : `Found ${clients.length} clients`,
        data: clients,
      };
    }

    // 🔹 CREATE
    if (type === "CREATE") {
      const client = await prisma.client.create({
        data: {
          company_name: data.company_name || data.name,
          primary_contact_name: data.contact_name,
          primary_contact_email: data.email,
          primary_contact_phone: data.phone,
          agency_id: data.agency_id || 1, // adjust
          created_by: userId,
        },
      });

      return {
        message: "Client created successfully",
        data: client,
      };
    }

    // 🔹 UPDATE
    if (type === "UPDATE") {
      if (!filters.client_id) {
        return { message: "Client ID required for update" };
      }

      const updated = await prisma.client.update({
        where: { client_id: filters.client_id },
        data,
      });

      return {
        message: "Client updated successfully",
        data: updated,
      };
    }

    // 🔹 DELETE
    if (type === "DELETE") {
      if (!filters.client_id) {
        return { message: "Client ID required for delete" };
      }

      await prisma.client.delete({
        where: { client_id: filters.client_id },
      });

      return {
        message: "Client deleted successfully",
      };
    }

    return { message: "Invalid client operation" };

  } catch (error) {
    console.error("Client Tool Error:", error);

    return {
      message: "Client operation failed",
      error: error.message,
    };
  }
};