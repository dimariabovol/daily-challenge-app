import { getOne, getMany, transaction } from './index';
import { generateId } from './schema';

/**
 * Category interface representing a challenge category
 */
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

/**
 * Challenge template interface representing a challenge template
 */
export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  category_id: string;
  created_at?: string;
}

/**
 * User challenge interface representing a challenge assigned to a user
 */
export interface UserChallenge {
  id: string;
  user_id: string;
  template_id: string;
  date: string; // YYYY-MM-DD format
  completed: number; // SQLite boolean (0 = false, 1 = true)
  completed_at?: string;
  created_at?: string;
}

/**
 * Complete challenge interface with all related data
 */
export interface CompleteChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

/**
 * Get all categories
 * @returns Array of category objects
 */
export function getCategories(): Category[] {
  return getMany<Category>(`
    SELECT id, name, color, icon
    FROM categories
    ORDER BY name ASC
  `);
}

/**
 * Get a category by ID
 * @param id Category ID
 * @returns Category object or undefined if not found
 */
export function getCategoryById(id: string): Category | undefined {
  return getOne<Category>(`
    SELECT id, name, color, icon
    FROM categories
    WHERE id = ?
  `, id);
}

/**
 * Get all challenge templates
 * @param categoryId Optional category ID to filter by
 * @returns Array of challenge template objects
 */
export function getChallengeTemplates(categoryId?: string): ChallengeTemplate[] {
  if (categoryId) {
    return getMany<ChallengeTemplate>(`
      SELECT id, title, description, category_id, created_at
      FROM challenge_templates
      WHERE category_id = ?
      ORDER BY created_at DESC
    `, categoryId);
  }
  
  return getMany<ChallengeTemplate>(`
    SELECT id, title, description, category_id, created_at
    FROM challenge_templates
    ORDER BY created_at DESC
  `);
}

/**
 * Get a challenge template by ID
 * @param id Challenge template ID
 * @returns Challenge template object or undefined if not found
 */
export function getChallengeTemplateById(id: string): ChallengeTemplate | undefined {
  return getOne<ChallengeTemplate>(`
    SELECT id, title, description, category_id, created_at
    FROM challenge_templates
    WHERE id = ?
  `, id);
}

/**
 * Create a user challenge
 * @param userId User ID
 * @param templateId Challenge template ID
 * @param date Challenge date (YYYY-MM-DD format)
 * @returns The created user challenge object
 */
export function createUserChallenge(userId: string, templateId: string, date: string): UserChallenge {
  const id = generateId();
  
  return transaction((db) => {
    const stmt = db.prepare(`
      INSERT INTO user_challenges (id, user_id, template_id, date)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(id, userId, templateId, date);
    
    return getUserChallengeById(id) as UserChallenge;
  });
}

/**
 * Get a user challenge by ID
 * @param id User challenge ID
 * @returns User challenge object or undefined if not found
 */
export function getUserChallengeById(id: string): UserChallenge | undefined {
  return getOne<UserChallenge>(`
    SELECT id, user_id, template_id, date, completed, completed_at, created_at
    FROM user_challenges
    WHERE id = ?
  `, id);
}

/**
 * Get a user's challenge for a specific date
 * @param userId User ID
 * @param date Challenge date (YYYY-MM-DD format)
 * @returns User challenge object or undefined if not found
 */
export function getUserChallengeByDate(userId: string, date: string): CompleteChallenge | undefined {
  return getOne<CompleteChallenge>(`
    SELECT 
      uc.id, 
      uc.date, 
      uc.completed, 
      uc.completed_at, 
      uc.created_at,
      ct.title, 
      ct.description,
      c.id as category_id, 
      c.name as category_name, 
      c.color as category_color, 
      c.icon as category_icon
    FROM user_challenges uc
    JOIN challenge_templates ct ON uc.template_id = ct.id
    JOIN categories c ON ct.category_id = c.id
    WHERE uc.user_id = ? AND uc.date = ?
  `, [userId, date]);
}

/**
 * Get today's challenge for a user
 * @param userId User ID
 * @returns Today's challenge or undefined if not found
 */
export function getTodaysChallenge(userId: string): CompleteChallenge | undefined {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return getUserChallengeByDate(userId, today);
}

/**
 * Get a user's challenge history
 * @param userId User ID
 * @param limit Maximum number of challenges to return
 * @param offset Number of challenges to skip
 * @param completed Optional filter by completion status
 * @returns Array of complete challenge objects
 */
export function getUserChallengeHistory(
  userId: string, 
  limit: number = 30, 
  offset: number = 0,
  completed?: boolean
): CompleteChallenge[] {
  let query = `
    SELECT 
      uc.id, 
      uc.date, 
      uc.completed, 
      uc.completed_at, 
      uc.created_at,
      ct.title, 
      ct.description,
      c.id as category_id, 
      c.name as category_name, 
      c.color as category_color, 
      c.icon as category_icon
    FROM user_challenges uc
    JOIN challenge_templates ct ON uc.template_id = ct.id
    JOIN categories c ON ct.category_id = c.id
    WHERE uc.user_id = ?
  `;
  
  const params: any[] = [userId];
  
  if (completed !== undefined) {
    query += ` AND uc.completed = ?`;
    params.push(completed ? 1 : 0);
  }
  
  query += `
    ORDER BY uc.date DESC
    LIMIT ? OFFSET ?
  `;
  
  params.push(limit, offset);
  
  return getMany<CompleteChallenge>(query, params);
}

/**
 * Count a user's challenge history
 * @param userId User ID
 * @param completed Optional filter by completion status
 * @returns Total count of challenges
 */
export function countUserChallenges(userId: string, completed?: boolean): number {
  let query = `
    SELECT COUNT(*) as count
    FROM user_challenges
    WHERE user_id = ?
  `;
  
  const params: any[] = [userId];
  
  if (completed !== undefined) {
    query += ` AND completed = ?`;
    params.push(completed ? 1 : 0);
  }
  
  const result = getOne<{ count: number }>(query, params);
  return result?.count || 0;
}

/**
 * Mark a user challenge as completed
 * @param id User challenge ID
 * @returns Updated user challenge or undefined if not found
 */
export function completeUserChallenge(id: string): UserChallenge | undefined {
  return transaction((db) => {
    const stmt = db.prepare(`
      UPDATE user_challenges
      SET completed = 1, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return undefined;
    }
    
    return getUserChallengeById(id);
  });
}

/**
 * Unmark a user challenge as completed
 * @param id User challenge ID
 * @returns Updated user challenge or undefined if not found
 */
export function uncompleteUserChallenge(id: string): UserChallenge | undefined {
  return transaction((db) => {
    const stmt = db.prepare(`
      UPDATE user_challenges
      SET completed = 0, completed_at = NULL
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return undefined;
    }
    
    return getUserChallengeById(id);
  });
}

/**
 * Delete a user challenge
 * @param id User challenge ID
 * @returns True if the challenge was deleted, false if not found
 */
export function deleteUserChallenge(id: string): boolean {
  return transaction((db) => {
    const stmt = db.prepare(`
      DELETE FROM user_challenges
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    
    return result.changes > 0;
  });
}