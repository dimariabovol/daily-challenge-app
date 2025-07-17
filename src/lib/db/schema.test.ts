import { getDb, closeDb } from './index';
import { resetSchema, isSchemaInitialized } from './schema';

/**
 * This file is for testing the database schema initialization.
 * It can be run with: npx tsx src/lib/db/schema.test.ts
 */

function testSchemaInitialization() {
  try {
    console.log('Testing schema initialization...');

    // Reset schema to start with a clean state
    resetSchema();

    // Check if schema is initialized
    const initialized = isSchemaInitialized();
    console.log(`Schema initialized: ${initialized}`);

    if (!initialized) {
      throw new Error('Schema initialization failed');
    }

    // Verify tables exist and have correct structure
    const db = getDb();

    // Define type for table schema results
    interface TableSchema {
      sql: string;
    }

    // Check users table
    console.log('Checking users table...');
    const usersTable = db.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).get() as TableSchema;
    console.log('Users table SQL:', usersTable.sql);

    // Check categories table
    console.log('Checking categories table...');
    const categoriesTable = db.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='categories'
    `).get() as TableSchema;
    console.log('Categories table SQL:', categoriesTable.sql);

    // Check challenge_templates table
    console.log('Checking challenge_templates table...');
    const templatesTable = db.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='challenge_templates'
    `).get() as TableSchema;
    console.log('Challenge templates table SQL:', templatesTable.sql);

    // Check user_challenges table
    console.log('Checking user_challenges table...');
    const challengesTable = db.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='user_challenges'
    `).get() as TableSchema;
    console.log('User challenges table SQL:', challengesTable.sql);

    // Check indexes
    console.log('Checking indexes...');
    interface IndexSchema {
      name: string;
    }
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name LIKE 'idx_%'
    `).all() as IndexSchema[];
    console.log('Indexes:', indexes.map(idx => idx.name));

    // Test inserting data to verify foreign key constraints
    console.log('Testing foreign key constraints...');

    // Insert test category
    const categoryId = 'test-category-id';
    db.prepare(`
      INSERT INTO categories (id, name, color, icon)
      VALUES (?, ?, ?, ?)
    `).run(categoryId, 'Test Category', '#FF0000', 'test-icon');

    // Insert test challenge template
    const templateId = 'test-template-id';
    db.prepare(`
      INSERT INTO challenge_templates (id, title, description, category_id)
      VALUES (?, ?, ?, ?)
    `).run(templateId, 'Test Challenge', 'This is a test challenge', categoryId);

    // Insert test user
    const userId = 'test-user-id';
    db.prepare(`
      INSERT INTO users (id, email, password)
      VALUES (?, ?, ?)
    `).run(userId, 'test@example.com', 'password123');

    // Insert test user challenge
    const challengeId = 'test-challenge-id';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    db.prepare(`
      INSERT INTO user_challenges (id, user_id, template_id, date)
      VALUES (?, ?, ?, ?)
    `).run(challengeId, userId, templateId, today);

    // Verify data was inserted
    const challenge = db.prepare(`
      SELECT uc.*, ct.title, ct.description, c.name as category_name
      FROM user_challenges uc
      JOIN challenge_templates ct ON uc.template_id = ct.id
      JOIN categories c ON ct.category_id = c.id
      WHERE uc.id = ?
    `).get(challengeId);

    console.log('Retrieved challenge with joins:', challenge);

    // Clean up
    console.log('Cleaning up...');
    resetSchema();

    // Close connection
    closeDb();
    console.log('Database connection closed.');

    console.log('All schema tests passed successfully!');
  } catch (error) {
    console.error('Schema test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSchemaInitialization();