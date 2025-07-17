import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Define the database file path
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'challenges.db');

// Ensure the data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Initialize the database connection
let db: Database.Database | null = null;

/**
 * Get a database connection instance
 * @returns A SQLite database connection
 */
export function getDb(): Database.Database {
  if (!db) {
    ensureDataDir();
    db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Set busy timeout to avoid SQLITE_BUSY errors
    db.pragma('busy_timeout = 5000');
  }
  
  return db;
}

/**
 * Close the database connection
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Execute a query with parameters
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export function execute<T = any>(sql: string, params: any = {}): T {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.run(params) as unknown as T;
}

/**
 * Get a single row from a query
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Single row or undefined if not found
 */
export function getOne<T = any>(sql: string, params: any = {}): T | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(params) as T | undefined;
}

/**
 * Get multiple rows from a query
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Array of rows
 */
export function getMany<T = any>(sql: string, params: any = {}): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(params) as T[];
}

/**
 * Execute multiple statements in a transaction
 * @param callback Function containing database operations
 * @returns Result of the transaction
 */
export function transaction<T>(callback: (db: Database.Database) => T): T {
  const db = getDb();
  const result = db.transaction(callback)(db);
  return result;
}

// Export the Database type for use in other modules
export type { Database };