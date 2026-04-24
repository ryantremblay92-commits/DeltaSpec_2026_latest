import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), '..', 'delta_data.db'),
      driver: sqlite3.Database
    });
  }
  return db;
}

/**
 * Executes a read-only query for the AI
 * We enforce 'SELECT' only to prevent destructive operations
 */
export async function executeAiQuery(sql: string): Promise<any[]> {
  const normalizedSql = sql.trim().toLowerCase();
  
  if (!normalizedSql.startsWith('select')) {
    throw new Error('Permission Denied: AI is only allowed to perform SELECT operations.');
  }

  const database = await getDb();
  console.log(`[DB AGENT] Executing AI Query: ${sql}`);
  return await database.all(sql);
}

export async function getTableSchema(): Promise<string> {
  const database = await getDb();
  const tables = await database.all("SELECT name FROM sqlite_master WHERE type='table'");
  
  let schemaDescription = "DATABASE SCHEMA:\n";
  for (const table of tables) {
    const columns = await database.all(`PRAGMA table_info(${table.name})`);
    schemaDescription += `- Table: ${table.name}\n  Columns: ${columns.map(c => `${c.name} (${c.type})`).join(', ')}\n`;
  }
  
  return schemaDescription;
}
