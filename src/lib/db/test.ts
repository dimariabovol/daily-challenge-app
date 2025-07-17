import { getDb, closeDb, execute, getOne, getMany, transaction } from './index';

/**
 * This file is for testing the database connection and utility functions.
 * It can be run with: npx tsx src/lib/db/test.ts
 */

function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Get database connection
    const db = getDb();
    console.log('Database connection established.');
    
    // Create a test table
    console.log('Creating test table...');
    execute(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert test data
    console.log('Inserting test data...');
    const insertResult = execute<{ lastInsertRowid: number }>(
      'INSERT INTO test_table (name) VALUES (?)',
      'Test Entry'
    );
    console.log(`Inserted row with ID: ${insertResult.lastInsertRowid}`);
    
    // Query the data
    console.log('Querying test data...');
    const row = getOne('SELECT * FROM test_table WHERE id = ?', insertResult.lastInsertRowid);
    console.log('Query result:', row);
    
    // Get all rows
    console.log('Getting all rows...');
    const allRows = getMany('SELECT * FROM test_table');
    console.log(`Found ${allRows.length} rows:`, allRows);
    
    // Test transaction
    console.log('Testing transaction...');
    transaction((db) => {
      const stmt = db.prepare('INSERT INTO test_table (name) VALUES (?)');
      stmt.run('Transaction Test 1');
      stmt.run('Transaction Test 2');
    });
    
    console.log('Transaction completed. Getting updated rows...');
    const updatedRows = getMany('SELECT * FROM test_table');
    console.log(`Now have ${updatedRows.length} rows:`, updatedRows);
    
    // Clean up
    console.log('Cleaning up...');
    execute('DROP TABLE test_table');
    
    // Close connection
    closeDb();
    console.log('Database connection closed.');
    
    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection();