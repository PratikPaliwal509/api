// services/ai.service.js

const { callLLM } = require("../utils/openai");
const taskService = require("./task.service");
const projectService = require("./project.service");
const clientService = require("./clients.service");

// ✅ ADD THIS FUNCTION
const mapCreateTask = (data, user) => {
    return {
        project_id: Number(data.project_id) || 1, // fallback (improve later)

        task_title: data.title?.trim(),

        description: data.description || "",

        priority: normalizePriority(data.priority),

        status: "to_do",

        due_date: parseDueDate(data.due_date),

        assignees: [user.user_id],
    };
};

// ✅ helper: normalize priority
const normalizePriority = (priority) => {
    if (!priority) return "medium";

    const p = priority.toLowerCase();

    if (["high", "urgent"].includes(p)) return "high";
    if (["low"].includes(p)) return "low";

    return "medium";
};

// ✅ helper: parse natural date
const parseDueDate = (input) => {
    if (!input) return null;

    try {
        const now = new Date();

        if (input.toLowerCase().includes("tomorrow")) {
            const date = new Date();
            date.setDate(date.getDate() + 1);

            // extract time if present (e.g. 5:00 PM)
            const timeMatch = input.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const ampm = timeMatch[3].toUpperCase();

                if (ampm === "PM" && hours !== 12) hours += 12;
                if (ampm === "AM" && hours === 12) hours = 0;

                date.setHours(hours, minutes, 0, 0);
            }

            return date;
        }

        return new Date(input);
    } catch {
        return null;
    }
};
const mapCreateClient = (data, user) => {
    console.log("Mapping client with data:", data, "and user:", user);
    return {
        // ✅ DO NOT hardcode, use logged-in user
        agency_id: user.agency.agency_id,

        // ✅ Required field
        company_name: data.company_name || data.name,

        // ✅ AI fallback mapping
        primary_contact_name:
            data.primary_contact_name || data.name || null,

        primary_contact_email:
            data.primary_contact_email || data.email || null,

        primary_contact_phone:
            data.primary_contact_phone || null,

        // ✅ Optional fields (only pass if exist)
        industry: data.industry || null,
        company_size: data.company_size || null,
        website: data.website || null,

        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postal_code: data.postal_code || null,

        billing_email: data.billing_email || null,
        billing_address: data.billing_address || null,

        notes: data.notes || null,

        // ✅ Always from auth
        created_by: user.user_id,
    };
};
const mapUpdateClient = (data) => {
    return {
        company_name: data.company_name || undefined,

        primary_contact_name:
            data.primary_contact_name || data.name || undefined,

        primary_contact_email:
            data.primary_contact_email || data.email || undefined,

        primary_contact_phone:
            data.phone || data.primary_contact_phone || undefined,
    };
};
// services/ai.service.js

const mapCreateProject = (data, user) => {
    return {
        agency_id: 3,
        // agency_id: user.agency_id,

        project_name: data.project_name || data.name || "Untitled Project",

        project_type: (data.project_type || "Hardware"),
        // project_type: (data.project_type || "Hardware").toLowerCase(),

        client_id: Number(data.client_id) || 1, // fallback since you use 1

        project_code:
            data.project_code ||
            generateProjectCode(data.project_name || "PRJ"),

        start_date:
            data.start_date === "today"
                ? new Date()
                : new Date(data.start_date || Date.now()),

        project_manager_id: user.user_id,

        created_by: user.user_id,
    };
};
const generateProjectCode = (name = "") => {
    return name
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "") + "-" + Date.now().toString().slice(-4);
};
exports.processMessage = async (message, user) => {
    try {
        const aiRaw = await callLLM(message);
        console.log("AI Raw Response:", aiRaw);

        let parsed;

        try {
            parsed = JSON.parse(aiRaw);
        } catch {
            // ✅ If not JSON → treat as normal chat response
            return { message: aiRaw };
        }

        const { action, data } = parsed;

        switch (action) {
            case "create_task": {
                const mappedData = mapCreateTask(data, user);
                return await taskService.createTask(mappedData, user.user_id);
            }

            case "get_tasks":
                return await taskService.getTasks(user);

            case "create_project": {
                const mapped = mapCreateProject(data, user);
                return await projectService.createProject(mapped);
            }

            case "create_client": {
                try {
                    const mapped = mapCreateClient(data, user);
                    console.log("Mapped Client Data:", mapped);
                    const client = await clientService.createClient(mapped);

                    // return await clientService.createClient(mapped);
                    return {
                        message: `Client "${client.company_name}" created successfully`,
                        data: client, // optional (if frontend needs)
                    };
                } catch (err) {
                    return { message: err.message };
                }
            }
            case "get_clients": {
                console.log("Fetching clients for user:", user.user_id);
                const clients = await clientService.getClientsByScope(user);
                console.log("Fetched clients:", clients);

                const formatted = clients
                    .map((c, i) => {
                        return `${i + 1}. ${c.company_name} (${c.primary_contact_name || "No contact"})`;
                    })
                    .join("\n");

                return {
                    message: `Clients List:\n\n${formatted}`,
                    data: clients, // optional (keep if frontend needs)
                };
            }

            case "get_client_by_id": {
                try {
                    const clientId = Number(data.client_id);

                    if (!clientId) {
                        return { message: "Invalid client ID" };
                    }
                    const client = await clientService.getClientById(clientId);

                    const formatted = `
                                        Client Details:

                                        🏢 Company: ${client.company_name}
                                        👤 Contact: ${client.primary_contact_name || "N/A"}
                                        📧 Email: ${client.primary_contact_email || "N/A"}
                                        📞 Phone: ${client.primary_contact_phone || "N/A"}

                                        📍 Address: ${client.city || "-"}, ${client.state || "-"}, ${client.country || "-"}

                                        📅 Client Since: ${client.client_since || "N/A"}
                                        `;

                    return {
                        message: formatted,
                        data: client, // optional
                    };
                } catch (err) {
                    return { message: err.message };
                }
            }

            case "update_client": {
                try {
                    const clientId = Number(data.client_id);

                    if (!clientId) {
                        return { message: "Invalid client ID ❌" };
                    }

                    const mapped = mapUpdateClient(data);

                    const updatedClient = await clientService.updateClient(
                        clientId,
                        mapped
                    );

                    return {
                        message: `Client updated successfully ✅`,
                        data: updatedClient,
                    };
                } catch (err) {
                    return { message: err.message };
                }
            }

            case "update_client_status": {
                try {
                    const clientId = Number(data.client_id);

                    if (!clientId) {
                        return { message: "Invalid client ID ❌" };
                    }

                    const updatedClient = await clientService.updateClientStatus(
                        clientId,
                        data.status
                    );

                    return {
                        message: `Client status updated to ${data.status} ✅`,
                        data: updatedClient,
                    };
                } catch (err) {
                    return { message: err.message };
                }
            }

            default:
                return { message: "Unsupported action" };
        }
    } catch (error) {
        console.error("AI Service Error:", error);
        return { message: "AI processing failed" };
    }
};