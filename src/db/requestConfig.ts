import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "src/app/api/storage.db");
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS request_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    route TEXT,
    method TEXT DEFAULT 'GET',
    additional_fields TEXT,
    field TEXT,
    headers TEXT,
    prompt TEXT,
    variables TEXT,
    schema TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
`);

export function createDraftRequestConfig(name: string): number {
  const stmt = db.prepare(`INSERT INTO request_configs (name) VALUES (?)`);
  const info = stmt.run(name);
  return info.lastInsertRowid as number;
}

export function getAllRequestConfigs() {
  const stmt = db.prepare(
    "SELECT * FROM request_configs ORDER BY updated_at DESC"
  );
  return stmt.all();
}

export function getRequestConfigById(id: number) {
  const stmt = db.prepare("SELECT * FROM request_configs WHERE id = ?");
  return stmt.get(id);
}

export function updateRequestConfig(
  id: number,
  config: Partial<{
    route?: string;
    method?: string;
    field?: string;
    headers?: Record<string, string>;
    prompt?: string;
    variables?: Record<string, string[]>;
    schema?: string[];
  }>
) {
  const fields = [];
  const values = [];
  for (const key in config) {
    fields.push(`${key} = ?`);
    const value = (config as any)[key];
    if (
      key === "headers" ||
      key === "variables" ||
      key === "schema" ||
      key === "additional_fields" ||
      key === "prompt"
    ) {
      values.push(value ? JSON.stringify(value) : null);
    } else {
      values.push(value);
    }
  }
  values.push(id);
  const stmt = db.prepare(
    `UPDATE request_configs SET ${fields.join(
      ", "
    )}, updated_at = datetime('now') WHERE id = ?`
  );
  stmt.run(...values);
}

export function deleteRequestConfig(id: number) {
  const stmt = db.prepare("DELETE FROM request_configs WHERE id = ?");
  stmt.run(id);
}
