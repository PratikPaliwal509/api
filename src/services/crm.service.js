// services/crm.service.js

exports.createTask = async ({ title, due_date, priority, userId }) => {
  // DB insert here
  return {
    message: "Task created successfully",
    task: { title, due_date, priority, userId },
  };
};

exports.getTasks = async ({ userId, priority }) => {
  // DB query here
  return [
    { title: "Call client", priority: "high" },
    { title: "Design UI", priority: "medium" },
  ];
};

exports.createProject = async ({ name }) => {
  return { message: `Project '${name}' created` };
};

exports.createClient = async ({ name, email }) => {
  return { message: `Client '${name}' added` };
};