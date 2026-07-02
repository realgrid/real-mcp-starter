const path = require("path");

module.exports = {
  port: process.env.PORT || 3456,
  dbPath: path.join(__dirname, "..", "data", "netflixdb.sqlite"),
  weeklyEndDate: "2025-06-29",
  weeklyStartDate: "2025-06-23",
};
