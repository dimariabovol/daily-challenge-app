import { getDb, closeDb } from './index';
import { resetSchema } from './schema';

/**
 * This file is for testing the database seeding functionality.
 * It can be run with: npx tsx src/lib/db/seed-db.test.ts
 */

// Import the seed functions directly to test them
import { seedDatabase } from './seed-db';

function testDatabaseSeeding() {
  try {
    console.log('Testing database seeding...');

    // Reset schema to start with a clean state
    resetSchema();

    // Run the seeding process
    seedDatabase();

    // Verify data was inserted correctly
    const db = getDb();

    // Check categories
    console.log('Checking seeded categories...');
    const categories = db.prepare('SELECT * FROM categories').all();
    console.log(`Found ${categories.length} categories`);
    
    if (categories.length === 0) {
      throw new Error('No categories were seeded');
    }
    
    // Check challenge templates
    console.log('Checking seeded challenge templates...');
    const templates = db.prepare('SELECT * FROM challenge_templates').all();
    console.log(`Found ${templates.length} challenge templates`);
    
    if (templates.length === 0) {
      throw new Error('No challenge templates were seeded');
    }
    
    // Check distribution of templates across categories
    console.log('Checking template distribution across categories...');
    const templatesByCategory = db.prepare(`
      SELECT c.name, COUNT(ct.id) as template_count
      FROM categories c
      LEFT JOIN challenge_templates ct ON c.id = ct.category_id
      GROUP BY c.name
    `).all();
    
    console.log('Templates by category:');
    templatesByCategory.forEach((row: any) => {
      console.log(`- ${row.name}: ${row.template_count} templates`);
    });
    
    // Check if any category has no templates
    const categoriesWithoutTemplates = templatesByCategory.filter((row: any) => row.template_count === 0);
    if (categoriesWithoutTemplates.length > 0) {
      console.warn('Warning: Some categories have no templates:', 
        categoriesWithoutTemplates.map((row: any) => row.name).join(', '));
    }
    
    // Check if templates have proper titles and descriptions
    console.log('Checking template content...');
    const sampleTemplates = db.prepare(`
      SELECT ct.title, ct.description, c.name as category
      FROM challenge_templates ct
      JOIN categories c ON ct.category_id = c.id
      LIMIT 5
    `).all();
    
    console.log('Sample templates:');
    sampleTemplates.forEach((template: any, index: number) => {
      console.log(`${index + 1}. [${template.category}] ${template.title}`);
      console.log(`   ${template.description}`);
    });

    // Clean up
    console.log('Cleaning up...');
    resetSchema();

    // Close connection
    closeDb();
    console.log('Database connection closed.');

    console.log('All seeding tests passed successfully!');
  } catch (error) {
    console.error('Seeding test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseSeeding();