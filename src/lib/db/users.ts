import { getOne, getMany, transaction } from './index';
import { generateId } from './schema';

/**
 * User interface representing a user in the database
 */
export interface User {
    id: string;
    email: string;
    password: string; // This should be hashed before storage
    created_at?: string;
    updated_at?: string;
}

/**
 * Create a new user
 * @param email User's email address
 * @param password User's password (should be hashed before calling this function)
 * @returns The created user object
 */
export function createUser(email: string, password: string): User {
    const id = generateId();

    const user = transaction((db) => {
        const stmt = db.prepare(`
      INSERT INTO users (id, email, password)
      VALUES (?, ?, ?)
    `);

        stmt.run(id, email, password);

        return getUserById(id);
    });

    return user as User;
}

/**
 * Get a user by ID
 * @param id User ID
 * @returns User object or undefined if not found
 */
export function getUserById(id: string): User | undefined {
    return getOne<User>(`
    SELECT id, email, password, created_at, updated_at
    FROM users
    WHERE id = ?
  `, id);
}

/**
 * Get a user by email
 * @param email User email
 * @returns User object or undefined if not found
 */
export function getUserByEmail(email: string): User | undefined {
    return getOne<User>(`
    SELECT id, email, password, created_at, updated_at
    FROM users
    WHERE email = ?
  `, email);
}

/**
 * Get all users
 * @param limit Maximum number of users to return
 * @param offset Number of users to skip
 * @returns Array of user objects
 */
export function getUsers(limit: number = 100, offset: number = 0): User[] {
    return getMany<User>(`
    SELECT id, email, password, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);
}

/**
 * Update a user
 * @param id User ID
 * @param data User data to update
 * @returns Updated user object or undefined if not found
 */
export function updateUser(id: string, data: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): User | undefined {
    return transaction((db) => {
        // Build the SET clause dynamically based on provided data
        const updates: string[] = [];
        const values: any[] = [];

        if (data.email !== undefined) {
            updates.push('email = ?');
            values.push(data.email);
        }

        if (data.password !== undefined) {
            updates.push('password = ?');
            values.push(data.password);
        }

        // Add updated_at timestamp
        updates.push('updated_at = CURRENT_TIMESTAMP');

        // If no updates, return the existing user
        if (updates.length === 0) {
            return getUserById(id);
        }

        // Add the user ID to the values array
        values.push(id);

        const stmt = db.prepare(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

        const result = stmt.run(...values);

        if (result.changes === 0) {
            return undefined;
        }

        return getUserById(id);
    });
}

/**
 * Delete a user
 * @param id User ID
 * @returns True if the user was deleted, false if not found
 */
export function deleteUser(id: string): boolean {
    return transaction((db) => {
        // First delete all user challenges
        const deleteUserChallengesStmt = db.prepare(`
      DELETE FROM user_challenges
      WHERE user_id = ?
    `);

        deleteUserChallengesStmt.run(id);

        // Then delete the user
        const deleteUserStmt = db.prepare(`
      DELETE FROM users
      WHERE id = ?
    `);

        const result = deleteUserStmt.run(id);

        return result.changes > 0;
    });
}