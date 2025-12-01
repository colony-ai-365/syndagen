import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "src/app/api/storage.db");
const db = new Database(dbPath);

// Create tables

db.exec(`
CREATE TABLE IF NOT EXISTS datalists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS datalist_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datalist_id INTEGER NOT NULL,
    value TEXT,
    FOREIGN KEY (datalist_id) REFERENCES datalists(id) ON DELETE CASCADE
);
`);

export function createDatalist(name: string): number {
  const stmt = db.prepare(`INSERT INTO datalists (name) VALUES (?)`);
  const info = stmt.run(name);
  return info.lastInsertRowid as number;
}

export function addEntriesToDatalist(datalistId: number, values: string[]) {
  const stmt = db.prepare(
    `INSERT INTO datalist_entries (datalist_id, value) VALUES (?, ?)`
  );
  const insertMany = db.transaction((vals: string[]) => {
    for (const val of vals) {
      stmt.run(datalistId, val);
    }
  });
  insertMany(values);
}

export function getAllDatalists() {
  const stmt = db.prepare(`SELECT * FROM datalists ORDER BY created_at DESC`);
  return stmt.all();
}

export function getDatalistEntries(datalistId: number) {
  const stmt = db.prepare(
    `SELECT value FROM datalist_entries WHERE datalist_id = ?`
  );
  const rows = stmt.all(datalistId) as Array<{ value: string }>;
  return rows.map((row) => row.value);
}

export function deleteDatalist(datalistId: number) {
  const stmt = db.prepare(`DELETE FROM datalists WHERE id = ?`);
  stmt.run(datalistId);
}
