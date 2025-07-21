import { getCategories, getChallengeTemplates, createUserChallenge, getUserChallengeByDate } from './challenges';
import { transaction } from './index';

/**
 * Generate a daily challenge for a user
 * This function implements the core challenge generation algorithm
 * 
 * @param userId User ID to generate challenge for
 * @param date Date string in YYYY-MM-DD format
 * @returns ID of the generated challenge
 */
export function generateDailyChallenge(userId: string, date: string): string {
  // Check if a challenge already exists for this user and date
  const existingChallenge = getUserChallengeByDate(userId, date);
  if (existingChallenge) {
    return existingChallenge.id;
  }

  return transaction((db) => {
    // Get user's recent challenges to avoid category repetition
    const recentChallenges = db.prepare(`
      SELECT 
        uc.id,
        uc.date,
        ct.category_id
      FROM user_challenges uc
      JOIN challenge_templates ct ON uc.template_id = ct.id
      WHERE uc.user_id = ?
      ORDER BY uc.date DESC
      LIMIT 5
    `).all(userId) as { id: string, date: string, category_id: string }[];

    // Get all categories
    const categories = getCategories();
    if (categories.length === 0) {
      throw new Error('No categories found in the database');
    }

    // Get recently used category IDs to avoid repetition
    const recentCategoryIds = new Set(recentChallenges.map(c => c.category_id));
    
    // Select a category using a deterministic algorithm based on the date
    // This ensures the same category is chosen for the same date
    const categoryIndex = getDateBasedIndex(date, categories.length);
    
    // If the deterministic category was recently used, find an alternative
    let selectedCategoryIndex = categoryIndex;
    
    // Try to avoid categories used in the last 3 days
    if (recentCategoryIds.has(categories[selectedCategoryIndex].id) && recentChallenges.length >= 3) {
      // Find the first category that hasn't been used recently
      for (let i = 0; i < categories.length; i++) {
        const nextIndex = (categoryIndex + i + 1) % categories.length;
        if (!recentCategoryIds.has(categories[nextIndex].id)) {
          selectedCategoryIndex = nextIndex;
          break;
        }
      }
    }
    
    const selectedCategory = categories[selectedCategoryIndex];
    
    // Get challenge templates for the selected category
    const templates = getChallengeTemplates(selectedCategory.id);
    if (templates.length === 0) {
      throw new Error(`No challenge templates found for category: ${selectedCategory.name}`);
    }
    
    // Select a template using a deterministic algorithm based on the date
    // This ensures the same template is chosen for the same date
    const templateIndex = getDateBasedIndex(date + selectedCategory.id, templates.length);
    const selectedTemplate = templates[templateIndex];
    
    // Create the user challenge
    const userChallenge = createUserChallenge(userId, selectedTemplate.id, date);
    
    return userChallenge.id;
  });
}

/**
 * Get today's challenge for a user, generating one if it doesn't exist
 * 
 * @param userId User ID
 * @returns ID of today's challenge
 */
export function getTodaysChallengeId(userId: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return generateDailyChallenge(userId, today);
}

/**
 * Generate a deterministic index based on a date string
 * This ensures that the same date always produces the same index
 * 
 * @param dateStr Date string to hash
 * @param max Maximum index value (exclusive)
 * @returns A number between 0 and max-1
 */
function getDateBasedIndex(dateStr: string, max: number): number {
  // Simple string hash function
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Ensure positive number and get modulo
  return Math.abs(hash) % max;
}

/**
 * Get the next N days of challenges for a user
 * This is useful for showing upcoming challenges
 * 
 * @param userId User ID
 * @param days Number of days to generate
 * @returns Array of challenge IDs
 */
export function getUpcomingChallenges(userId: string, days: number = 7): string[] {
  const challengeIds: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const challengeId = generateDailyChallenge(userId, dateStr);
    challengeIds.push(challengeId);
  }
  
  return challengeIds;
}