
require('dotenv').config();
const app = require("./app");
const http = require('http');
const { initSocket } = require('./socket');
const PORT = process.env.PORT;
const cron = require('node-cron');
const { checkTaskReminders } = require('./services/taskReminder.service');

// Uncomment this for reminders
// Run every day at 9 AM
// cron.schedule('0 9 * * *', async () => {
//   await checkTaskReminders();
// });

//To solve the problem of classical prisma bigint issue
BigInt.prototype.toJSON = function () {
  return Number(this)
}

// Create HTTP server and attach socket.io
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
