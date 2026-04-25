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
    return {
        // agency_id: user.agency_id,
        agency_id: 3,

        company_name: data.company_name || data.name,

        primary_contact_name: data.primary_contact_name || data.name,

        primary_contact_email: data.primary_contact_email || data.email,

        primary_contact_phone: data.primary_contact_phone || null,

        created_by: user.user_id,
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
            return { message: "Sorry, I didn’t understand that." };
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

                    return await clientService.createClient(mapped);
                } catch (err) {
                    return {
                        message: err.message,
                    };
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