const express = require("express");
const app = express();

const rolesRoutes = require('./routes/roles.route');
const agenciesRoutes = require('./routes/agencies.routes');
const authRoutes = require('./routes/auth.routes');

const departmentsRoutes = require('./routes/departments.routes');
const clientsRoutes = require('./routes/clients.routes');
const teamsRoutes = require('./routes/teams.routes');
// const usersRoutes = require('./routes/users.routes');

app.use(express.json());

app.use('/api/roles', rolesRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/departments', departmentsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/teams', teamsRoutes);
// app.use('/api/users', usersRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

module.exports = app;
