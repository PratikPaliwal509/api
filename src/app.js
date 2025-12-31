const express = require("express");
const app = express();

const rolesRoutes = require('./routes/roles.route');
const agenciesRoutes = require('./routes/agencies.routes');
const authRoutes = require('./routes/auth.routes');

app.use(express.json());

app.use('/api/roles', rolesRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

module.exports = app;
