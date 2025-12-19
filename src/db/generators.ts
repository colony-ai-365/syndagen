import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "src/app/api/generators.db");
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS generators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    config_id INTEGER NOT NULL,
    gap INTEGER DEFAULT 0,
    total_combinations INTEGER DEFAULT 0,
    completed_combinations INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('draft', 'started', 'terminated')) NOT NULL DEFAULT 'draft'
);
 
CREATE TABLE IF NOT EXISTS generated_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  generator_id INTEGER NOT NULL,
  inputs TEXT NOT NULL,
  output TEXT NOT NULL,
  FOREIGN KEY (generator_id) REFERENCES generators(id) ON DELETE CASCADE
);
`);
// CRUD for generated_entries
export function createGeneratedEntry({
  generator_id,
  inputs,
  output,
}: {
  generator_id: number;
  inputs: Record<string, string>;
  output: string;
}) {
  const stmt = db.prepare(
    `INSERT INTO generated_entries (generator_id, inputs, output) VALUES (?, ?, ?)`
  );
  const info = stmt.run(generator_id, JSON.stringify(inputs), output);
  return info.lastInsertRowid as number;
}

export function getGeneratedEntries(generator_id: number) {
  const stmt = db.prepare(
    `SELECT * FROM generated_entries WHERE generator_id = ? ORDER BY id ASC`
  );
  return stmt.all(generator_id).map((row: any) => ({
    ...row,
    inputs: JSON.parse(row.inputs),
  }));
}

export function countGeneratedEntries(generator_id: number): number {
  const stmt = db.prepare(
    `SELECT COUNT(*) as cnt FROM generated_entries WHERE generator_id = ?`
  );
  const row = stmt.get(generator_id) as { cnt: number } | undefined;
  return row?.cnt ?? 0;
}

export function getLatestGeneratedEntry(generator_id: number) {
  const stmt = db.prepare(
    `SELECT * FROM generated_entries WHERE generator_id = ? ORDER BY id DESC LIMIT 1`
  );
  const row = stmt.get(generator_id) as any;
  if (!row) return null;
  return { ...row, inputs: JSON.parse(row.inputs) };
}

export function getGeneratedEntryByIndex(generator_id: number, index: number) {
  const stmt = db.prepare(
    `SELECT * FROM generated_entries WHERE generator_id = ? ORDER BY id ASC LIMIT 1 OFFSET ?`
  );
  const row = stmt.get(generator_id, index) as any;
  if (!row) return null;
  return { ...row, inputs: JSON.parse(row.inputs) };
}

export function deleteGeneratedEntries(generator_id: number) {
  const stmt = db.prepare(
    `DELETE FROM generated_entries WHERE generator_id = ?`
  );
  stmt.run(generator_id);
}

export function createGenerator({
  name,
  config_id,
  gap = 0,
  total_combinations = 0,
  completed_combinations = 0,
  status = "draft",
}: {
  name: string;
  config_id?: number;
  gap?: number;
  total_combinations?: number;
  completed_combinations?: number;
  status?: "draft" | "started" | "terminated";
}) {
  const stmt = db.prepare(
    `INSERT INTO generators (name, config_id, gap, total_combinations, completed_combinations, status) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    name,
    config_id,
    gap,
    total_combinations,
    completed_combinations,
    status
  );
  return info.lastInsertRowid as number;
}

export function getAllGenerators() {
  const stmt = db.prepare("SELECT * FROM generators ORDER BY id DESC");
  return stmt.all();
}

export type Generator = {
  id: number;
  name: string;
  config_id: number;
  gap: number;
  total_combinations: number;
  completed_combinations: number;
  status: "draft" | "started" | "terminated";
};

export function getGeneratorById(id: number): Generator | undefined {
  const stmt = db.prepare("SELECT * FROM generators WHERE id = ?");
  const row = stmt.get(id);
  if (!row) return undefined;
  return row as Generator;
}

export function updateGenerator(
  id: number,
  updates: Partial<{
    name: string;
    config_id: number;
    gap: number;
    total_combinations: number;
    completed_combinations: number;
    status: "draft" | "started" | "terminated";
  }>
) {
  const fields = [];
  const values = [];
  for (const key in updates) {
    fields.push(`${key} = ?`);
    values.push((updates as any)[key]);
  }
  values.push(id);
  const stmt = db.prepare(
    `UPDATE generators SET ${fields.join(", ")} WHERE id = ?`
  );
  stmt.run(...values);
}

export function deleteGenerator(id: number) {
  const stmt = db.prepare("DELETE FROM generators WHERE id = ?");
  stmt.run(id);
}
