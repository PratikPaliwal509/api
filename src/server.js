
require('dotenv').config();
const app = require("./app");
const http = require('http');
const { initSocket } = require('./socket');
const PORT = process.env.PORT;

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
