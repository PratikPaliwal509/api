require('dotenv').config();
const app = require("./app");
const PORT =  process.env.PORT;

//To solve the problem of classical prisma bigint isshue
BigInt.prototype.toJSON = function () {
  return Number(this)
}

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
