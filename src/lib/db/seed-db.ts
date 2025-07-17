#!/usr/bin/env node

import { closeDb, transaction } from './index';
import { initializeSchema, generateId } from './schema';

/**
 * Command-line script to seed the database with initial data
 * Usage:
 *   npx tsx src/lib/db/seed-db.ts [--force]
 * 
 * The --force flag will seed the database even if data already exists
 */

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  categoryId: string;
}

/**
 * Seed the database with categories
 * @returns Array of created category IDs
 */
function seedCategories(): Category[] {
  console.log('Seeding categories...');
  
  const categories: Category[] = [
    {
      id: generateId(),
      name: 'Fitness',
      color: '#4CAF50', // Green
      icon: 'fitness'
    },
    {
      id: generateId(),
      name: 'Creativity',
      color: '#FF9800', // Orange
      icon: 'creativity'
    },
    {
      id: generateId(),
      name: 'Learning',
      color: '#2196F3', // Blue
      icon: 'learning'
    },
    {
      id: generateId(),
      name: 'Productivity',
      color: '#9C27B0', // Purple
      icon: 'productivity'
    },
    {
      id: generateId(),
      name: 'Mindfulness',
      color: '#00BCD4', // Cyan
      icon: 'mindfulness'
    },
    {
      id: generateId(),
      name: 'Social',
      color: '#F44336', // Red
      icon: 'social'
    }
  ];
  
  transaction((db) => {
    const insertStmt = db.prepare(`
      INSERT INTO categories (id, name, color, icon)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const category of categories) {
      try {
        insertStmt.run(category.id, category.name, category.color, category.icon);
      } catch (error) {
        console.warn(`Category '${category.name}' already exists, skipping.`);
      }
    }
  });
  
  console.log(`Seeded ${categories.length} categories`);
  return categories;
}

/**
 * Seed the database with challenge templates
 * @param categories Array of categories to create templates for
 */
function seedChallengeTemplates(categories: Category[]): void {
  console.log('Seeding challenge templates...');
  
  // Create a map of category names to IDs for easier lookup
  const categoryMap = new Map<string, string>();
  categories.forEach(category => {
    categoryMap.set(category.name, category.id);
  });
  
  // Define challenge templates for each category
  const challengeTemplatesByCategory: Record<string, string[]> = {
    'Fitness': [
      'Do 20 push-ups|Challenge yourself with a set of push-ups to build upper body strength.',
      'Take a 30-minute walk|Go for a refreshing walk to get your body moving and enjoy some fresh air.',
      'Try a 10-minute yoga session|Take a short break for some gentle yoga stretches to improve flexibility.',
      'Do 50 jumping jacks|Get your heart rate up with some quick cardio exercise.',
      'Hold a plank for 1 minute|Test your core strength with this simple but effective exercise.',
      'Take the stairs instead of elevator all day|Build leg strength and get some extra cardio throughout your day.',
      'Do 3 sets of 10 squats|Work your lower body with this fundamental strength exercise.',
      'Stretch for 15 minutes|Improve your flexibility and reduce muscle tension with a dedicated stretching session.',
      'Go for a 15-minute jog|Get some cardio in with a quick run around your neighborhood.',
      'Do 25 sit-ups|Strengthen your core with this classic abdominal exercise.'
    ],
    'Creativity': [
      'Draw a self-portrait|Express yourself through art by creating a drawing of yourself.',
      'Write a short poem|Tap into your creative writing skills with a brief poetic expression.',
      'Take 10 interesting photographs|Look for unique perspectives and capture them with your camera.',
      'Create a playlist of new music|Curate a collection of songs you haven\'t heard before.',
      'Cook a new recipe|Experiment in the kitchen with a dish you\'ve never made before.',
      'Write a page of fiction|Let your imagination flow by writing a short story or scene.',
      'Redesign your workspace|Get creative with your environment by rearranging or decorating your work area.',
      'Sketch an object from three different angles|Practice your observational drawing skills with this exercise.',
      'Create a vision board|Visualize your goals and aspirations through a collage of images and words.',
      'Write a letter to your future self|Reflect on your current thoughts and aspirations in a letter to read later.'
    ],
    'Learning': [
      'Learn 5 new words in another language|Expand your vocabulary in a foreign language of your choice.',
      'Read an article about a new topic|Broaden your knowledge by exploring an unfamiliar subject.',
      'Watch a documentary|Gain insights through an educational film on a topic that interests you.',
      'Listen to an educational podcast|Learn something new during your commute or while doing chores.',
      'Take a free online lesson|Find a short course or tutorial on a skill you\'d like to develop.',
      'Research the history of something you use daily|Discover the origins and evolution of an everyday item.',
      'Learn a new keyboard shortcut|Boost your productivity by mastering a helpful computer trick.',
      'Read a chapter of a non-fiction book|Expand your knowledge through focused reading on a factual topic.',
      'Watch a TED talk|Get inspired and informed by an expert presentation on an interesting subject.',
      'Practice a musical instrument for 20 minutes|Develop your musical abilities through dedicated practice time.'
    ],
    'Productivity': [
      'Clear your email inbox|Organize your digital communications by sorting and responding to messages.',
      'Create a to-do list for the week|Plan ahead by outlining your upcoming tasks and priorities.',
      'Declutter one area of your home|Simplify your environment by organizing a specific space.',
      'Set three achievable goals for today|Focus your energy on accomplishing specific objectives.',
      'Update your resume or portfolio|Keep your professional materials current with your latest accomplishments.',
      'Plan your meals for the week|Save time and make healthier choices through advance meal planning.',
      'Schedule all your appointments for the month|Get organized by setting up your calendar with upcoming commitments.',
      'Implement a new organization system|Improve your efficiency with a better way to manage your tasks or belongings.',
      'Complete that task you\'ve been avoiding|Tackle the item on your to-do list that you\'ve been putting off.',
      'Review and update your budget|Take control of your finances by examining your spending and saving habits.'
    ],
    'Mindfulness': [
      'Meditate for 10 minutes|Take time to quiet your mind and focus on your breathing.',
      'Practice gratitude by listing 5 things you appreciate|Cultivate a positive mindset by acknowledging good things in your life.',
      'Take a tech-free lunch break|Disconnect from devices to be fully present during your meal.',
      'Do a body scan meditation|Bring awareness to each part of your body from head to toe.',
      'Practice mindful eating for one meal|Pay full attention to the experience of eating without distractions.',
      'Take 5 deep breaths when you feel stressed|Use breathing techniques to center yourself during challenging moments.',
      'Spend 15 minutes in nature|Connect with the natural world by observing plants, animals, or landscapes.',
      'Write down your thoughts for 10 minutes|Clear your mind through expressive writing without judgment.',
      'Practice active listening in a conversation|Give your full attention to someone without planning your response.',
      'Do a mindful walking exercise|Focus on the sensations of walking, noticing each step and your surroundings.'
    ],
    'Social': [
      'Call a friend or family member you haven\'t spoken to recently|Reconnect with someone important in your life.',
      'Give a genuine compliment to three people|Spread positivity by acknowledging others in a meaningful way.',
      'Volunteer or help someone in need|Contribute to your community through an act of service.',
      'Invite someone new for coffee or lunch|Expand your social circle by reaching out to a potential friend.',
      'Send a thank you note to someone who has helped you|Express gratitude to acknowledge someone\'s positive impact.',
      'Attend a community event|Engage with your local community by participating in a shared activity.',
      'Have a meaningful conversation about something important|Deepen a relationship through substantive discussion.',
      'Reconnect with an old friend|Revive a valuable relationship that may have faded over time.',
      'Join an online or in-person group related to your interests|Connect with like-minded people who share your passions.',
      'Practice active listening with someone important to you|Show care by giving your full attention without interrupting.'
    ]
  };
  
  const challengeTemplates: ChallengeTemplate[] = [];
  
  // Create challenge templates for each category
  Object.entries(challengeTemplatesByCategory).forEach(([categoryName, templates]) => {
    const categoryId = categoryMap.get(categoryName);
    
    if (!categoryId) {
      console.warn(`Category '${categoryName}' not found, skipping templates.`);
      return;
    }
    
    templates.forEach(template => {
      const [title, description] = template.split('|');
      challengeTemplates.push({
        id: generateId(),
        title,
        description,
        categoryId
      });
    });
  });
  
  transaction((db) => {
    const insertStmt = db.prepare(`
      INSERT INTO challenge_templates (id, title, description, category_id)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const template of challengeTemplates) {
      try {
        insertStmt.run(template.id, template.title, template.description, template.categoryId);
      } catch (error) {
        console.warn(`Challenge template '${template.title}' insertion failed, skipping.`);
      }
    }
  });
  
  console.log(`Seeded ${challengeTemplates.length} challenge templates`);
}

/**
 * Check if the database already has data
 * @returns True if the database has data
 */
function hasExistingData(): boolean {
  const db = transaction((db) => {
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    const templateCount = db.prepare('SELECT COUNT(*) as count FROM challenge_templates').get() as { count: number };
    
    return categoryCount.count > 0 || templateCount.count > 0;
  });
  
  return db;
}

/**
 * Main function to seed the database
 */
export function seedDatabase(): void {
  try {
    console.log('Starting database seeding...');
    
    // Check if schema is initialized
    initializeSchema();
    
    // Check if data already exists
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    
    if (hasExistingData() && !force) {
      console.log('Database already has data. Use --force to override.');
      return;
    }
    
    // Seed categories
    const categories = seedCategories();
    
    // Seed challenge templates
    seedChallengeTemplates(categories);
    
    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    closeDb();
  }
}

// Run the seeding process if this file is executed directly
if (require.main === module) {
  seedDatabase();
}