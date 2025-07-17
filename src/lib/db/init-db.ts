#!/usr/bin/env node

import { closeDb } from './index';
import { initializeSchema, resetSchema } from './schema';

/**
 * Command-line script to initialize or reset the database schema
 * Usage:
 *   npx tsx src/lib/db/init-db.ts [--reset]
 */

const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');

try {
  if (shouldReset) {
    console.log('Resetting database schema...');
    resetSchema();
    console.log('Database schema has been reset successfully.');
  } else {
    console.log('Initializing database schema...');
    initializeSchema();
    console.log('Database schema has been initialized successfully.');
  }
  
  // Close the database connection
  closeDb();
  
  process.exit(0);
} catch (error) {
  console.error('Error initializing database schema:', error);
  process.exit(1);
}