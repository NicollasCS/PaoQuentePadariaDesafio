const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(__dirname, 'pao-quente.sqlite');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initializeDatabase() {
  const sqlPath = path.join(__dirname, '..', 'sql');
  db.exec(fs.readFileSync(path.join(sqlPath, 'database.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(sqlPath, 'seed.sql'), 'utf8'));
}

module.exports = { db, initializeDatabase, databasePath };
