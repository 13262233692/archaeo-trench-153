import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'trench.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trenches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      length REAL NOT NULL,
      width REAL NOT NULL,
      depth REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strata (
      id TEXT PRIMARY KEY,
      trench_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT,
      top_depth REAL NOT NULL,
      bottom_depth REAL NOT NULL,
      order_index INTEGER NOT NULL,
      dip REAL DEFAULT 0,
      strike REAL DEFAULT 0,
      FOREIGN KEY (trench_id) REFERENCES trenches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      trench_id TEXT NOT NULL,
      stratum_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      pos_x REAL NOT NULL,
      pos_y REAL NOT NULL,
      pos_z REAL NOT NULL,
      description TEXT,
      FOREIGN KEY (trench_id) REFERENCES trenches(id) ON DELETE CASCADE,
      FOREIGN KEY (stratum_id) REFERENCES strata(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      trench_id TEXT NOT NULL,
      stratum_id TEXT,
      artifact_id TEXT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      description TEXT,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY (trench_id) REFERENCES trenches(id) ON DELETE CASCADE,
      FOREIGN KEY (stratum_id) REFERENCES strata(id) ON DELETE SET NULL,
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
    );
  `);

  const tableInfo = db.pragma('table_info(strata)') as any[];
  const hasDip = tableInfo.some((col: any) => col.name === 'dip');
  const hasStrike = tableInfo.some((col: any) => col.name === 'strike');
  
  if (!hasDip) {
    db.exec('ALTER TABLE strata ADD COLUMN dip REAL DEFAULT 0');
  }
  if (!hasStrike) {
    db.exec('ALTER TABLE strata ADD COLUMN strike REAL DEFAULT 0');
  }
}

export default db;
