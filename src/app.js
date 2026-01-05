const express = require("express");
const cors = require('cors')
const app = express();

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

app.use(express.json());
app.use(cors());
app.use('/api/roles', rolesRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/departments', departmentsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/teams', teamsRoutes);
// app.use('/api/users', usersRoutes);
app.use('/api', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.use('/api/tasksComments', require('./routes/taskComment.route'));
app.use('/api/taskAttachments', require('./routes/taskAttachment.route'));
app.use('/api/tasks/timeLogs', require('./routes/timeLog.route'));
app.use('/api/notification', notificationRoutes);
app.use('/api/activityLogs', require('./routes/activityLog.route'));

app.get("/", (req, res) => {
  res.send("API running");
});

module.exports = app;
