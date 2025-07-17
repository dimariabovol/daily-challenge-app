import { getDb, execute, transaction } from './index';
import { randomUUID } from 'crypto';

/**
 * Initialize the database schema
 * Creates all necessary tables if they don't exist
 */
export function initializeSchema(): void {
  console.log('Initializing database schema...');
  
  transaction((db) => {
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create categories table
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL
      )
    `);
    
    // Create challenge_templates table
    db.exec(`
      CREATE TABLE IF NOT EXISTS challenge_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);
    
    // Create user_challenges table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_challenges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        template_id TEXT NOT NULL,
        date TEXT NOT NULL, -- YYYY-MM-DD format
        completed INTEGER DEFAULT 0, -- SQLite boolean (0 = false, 1 = true)
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (template_id) REFERENCES challenge_templates (id),
        UNIQUE (user_id, date)
      )
    `);
    
    // Create indexes for performance
    db.exec(`CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges (user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_user_challenges_date ON user_challenges (date)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_challenge_templates_category_id ON challenge_templates (category_id)`);
  });
  
  console.log('Database schema initialized successfully');
}

/**
 * Reset the database schema
 * Drops all tables and recreates them
 * WARNING: This will delete all data
 */
export function resetSchema(): void {
  console.log('Resetting database schema...');
  
  transaction((db) => {
    // Drop tables in reverse order of dependencies
    db.exec(`DROP TABLE IF EXISTS user_challenges`);
    db.exec(`DROP TABLE IF EXISTS challenge_templates`);
    db.exec(`DROP TABLE IF EXISTS categories`);
    db.exec(`DROP TABLE IF EXISTS users`);
  });
  
  // Recreate the schema
  initializeSchema();
  
  console.log('Database schema reset successfully');
}

/**
 * Check if the schema is initialized
 * @returns True if all required tables exist
 */
export function isSchemaInitialized(): boolean {
  const db = getDb();
  
  // Check if all required tables exist
  const tables = ['users', 'categories', 'challenge_templates', 'user_challenges'];
  
  for (const table of tables) {
    const result = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(table);
    
    if (!result) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate a new UUID for database records
 * @returns A UUID string
 */
export function generateId(): string {
  return randomUUID();
}