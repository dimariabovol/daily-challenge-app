#!/usr/bin/env node

import { getDb, closeDb } from './index';

/**
 * Command-line script to view database contents
 * Usage:
 *   npx tsx src/lib/db/view-db.ts [table_name]
 * 
 * If table_name is provided, it will show the contents of that table
 * Otherwise, it will list all tables in the database
 */

const args = process.argv.slice(2);
const tableName = args[0];

try {
  const db = getDb();
  
  if (tableName) {
    // Check if the table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName);
    
    if (!tableExists) {
      console.error(`Table '${tableName}' does not exist.`);
      console.log('Available tables:');
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
      
      tables.forEach((table: any) => {
        console.log(`- ${table.name}`);
      });
      
      process.exit(1);
    }
    
    // Get table schema
    console.log(`\nSchema for table '${tableName}':`);
    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
    console.table(schema.map((col: any) => ({
      cid: col.cid,
      name: col.name,
      type: col.type,
      notnull: col.notnull ? 'NOT NULL' : 'NULL',
      default: col.dflt_value,
      pk: col.pk ? 'PRIMARY KEY' : ''
    })));
    
    // Get table contents
    console.log(`\nContents of table '${tableName}':`);
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    
    if (rows.length === 0) {
      console.log('No data found in this table.');
    } else {
      console.table(rows);
    }
  } else {
    // List all tables
    console.log('Available tables:');
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();
    
    tables.forEach((table: any) => {
      console.log(`- ${table.name}`);
      
      // Count rows in each table
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      console.log(`  ${(count as { count: number }).count} rows`);
    });
  }
  
  // Close the database connection
  closeDb();
  
  process.exit(0);
} catch (error) {
  console.error('Error viewing database:', error);
  process.exit(1);
}