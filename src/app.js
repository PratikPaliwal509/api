const express = require("express");
const cors = require('cors')
const app = express();
const socket = require("./socket");

const rolesRoutes = require('./routes/roles.route');
const agenciesRoutes = require('./routes/agencies.routes');
const authRoutes = require('./routes/auth.routes');

const departmentsRoutes = require('./routes/departments.routes');
const clientsRoutes = require('./routes/clients.routes');
const teamsRoutes = require('./routes/teams.routes');
// const usersRoutes = require('./routes/users.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const notificationRoutes = require('./routes/notification.route');
const userService = require('./routes/users.routes');
const hierarchyRoutes = require('./routes/hierarchy')
const emailRoutes = require('./routes/email.routes');

const chatRoutes = require('./routes/chat.routes')
const participantRoutes = require('./routes/chatParticipant.routes')
const messageRoutes = require('./routes/chatMessage.routes')
const reactionRoutes = require('./routes/chatReaction.routes')
const attachmentRoutes = require('./routes/chatAttachment.routes')

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use((req, res, next) => {
  try {
    req.io = socket.getIO();
  } catch (error) {
    req.io = null;
  }

  next();
});
app.use('/api/roles', rolesRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/departments', departmentsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/teams', teamsRoutes);
// app.use('/api/users', usersRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.use('/api/tasksComments', require('./routes/taskComment.route'));
app.use('/api/taskAttachments', require('./routes/taskAttachment.route'));
app.use('/api/tasks/timelogs', require('./routes/timeLog.route'));
app.use('/api/notification', notificationRoutes);
app.use('/api/activityLogs', require('./routes/activityLog.route'));
app.use('/api/hierarchy', hierarchyRoutes)
app.use('/api/users', userService);
app.use('/api/timesheet', require('./routes/timesheet.route'))
app.use('/api/email', emailRoutes);

app.use("/api/chats", chatRoutes);
app.use("/api/chat-participants", participantRoutes);
app.use("/api/chat-messages", messageRoutes);
app.use("/api/chat-reactions", reactionRoutes);
app.use("/api/chat-attachments", attachmentRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

module.exports = app;
