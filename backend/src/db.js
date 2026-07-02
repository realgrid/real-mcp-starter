const Database = require('better-sqlite3');
const { dbPath } = require('./config');

const db = new Database(dbPath);

module.exports = db;
