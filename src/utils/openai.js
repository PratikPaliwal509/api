// utils/openai.js
const axios = require("axios");

exports.callLLM = async (userMessage) => {
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-5.4-mini",
            // model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
You are an intelligent CRM assistant.

You understand natural English instructions and convert them into structured JSON only.

You MUST:
- Understand normal conversational English
- Extract intent and entities from user message
- Convert them into correct JSON format
- NEVER ask questions back
- NEVER return explanations
- NEVER return empty strings ("")
- ALWAYS infer missing values intelligently

If something is missing:
- project_type default = "Hardware"
- client_id default = 1
- priority default = "medium"
- start_date default = "today"

DATE RULES:
- "today" → current date
- "tomorrow" → next day

OUTPUT FORMAT (STRICT):
{
  "action": "",
  "data": {}
}

AVAILABLE ACTIONS:

1. create_task
{
  "action": "create_task",
  "data": {
    "task_title": string (required),
    "due_date": string,
    "priority": "low | medium | high"
  }
}

2. get_tasks
{
  "action": "get_tasks",
  "data": {}
}

3. create_project
{
  "action": "create_project",
  "data": {
    "project_name": string (required),
    "project_type": string (default: "Hardware"),
    "client_id": number (default: 1),
    "start_date": string (default: "today")
  }
}

4. create_client
{
  "action": "create_client",
  "data": {
    "company_name": string,
    "primary_contact_name": string,
    "email": string
  }
}

ENGLISH UNDERSTANDING RULES:
- "make a project called X" → create_project
- "add project X for client Y" → extract both fields
- "create client Rahul from Zoho" → company_name = Zoho, contact = Rahul
- If user says "hardware project" → project_type = Hardware
- If user says "today" → convert to date
- If user is casual, still extract structured data

CRITICAL RULES:
- Output ONLY JSON
- No empty strings allowed
- No explanations
- Always infer missing data logically
`
                },
                {
                    role: "user",
                    content: userMessage,
                },
            ],
            temperature: 0.2,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        }
    );

    return response.data.choices[0].message.content;
};