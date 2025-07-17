#!/usr/bin/env node

import { closeDb } from './index';
import { initializeSchema, resetSchema } from './schema';
import { createUser, getUserById, getUserByEmail, updateUser, deleteUser } from './users';
import { 
  getCategories, 
  getChallengeTemplates, 
  createUserChallenge, 
  getUserChallengeByDate, 
  completeUserChallenge,
  getUserChallengeHistory
} from './challenges';
import { getUserStats } from './statistics';

/**
 * Test the database utility functions
 */
async function testDatabaseUtils() {
  try {
    console.log('Testing database utility functions...');
    
    // Reset the schema for testing
    resetSchema();
    
    // Seed the database with test data
    const { seedDatabase } = require('./seed-db');
    seedDatabase();
    
    // Test user functions
    console.log('\nTesting user functions:');
    const testUser = createUser('test@example.com', 'password123');
    console.log('Created user:', testUser);
    
    const retrievedUser = getUserById(testUser.id);
    console.log('Retrieved user by ID:', retrievedUser);
    
    const userByEmail = getUserByEmail('test@example.com');
    console.log('Retrieved user by email:', userByEmail);
    
    const updatedUser = updateUser(testUser.id, { email: 'updated@example.com' });
    console.log('Updated user:', updatedUser);
    
    // Test challenge functions
    console.log('\nTesting challenge functions:');
    const categories = getCategories();
    console.log(`Retrieved ${categories.length} categories`);
    
    const templates = getChallengeTemplates();
    console.log(`Retrieved ${templates.length} challenge templates`);
    
    // Create a challenge for today
    const today = new Date().toISOString().split('T')[0];
    const userChallenge = createUserChallenge(testUser.id, templates[0].id, today);
    console.log('Created user challenge:', userChallenge);
    
    const todaysChallenge = getUserChallengeByDate(testUser.id, today);
    console.log('Retrieved today\'s challenge:', todaysChallenge);
    
    // Complete the challenge
    const completedChallenge = completeUserChallenge(userChallenge.id);
    console.log('Completed challenge:', completedChallenge);
    
    // Create challenges for the past few days to test streak calculation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
    
    // Create and complete challenges for the past days
    const yesterdayChallenge = createUserChallenge(testUser.id, templates[1].id, yesterdayStr);
    completeUserChallenge(yesterdayChallenge.id);
    
    const twoDaysAgoChallenge = createUserChallenge(testUser.id, templates[2].id, twoDaysAgoStr);
    completeUserChallenge(twoDaysAgoChallenge.id);
    
    const threeDaysAgoChallenge = createUserChallenge(testUser.id, templates[3].id, threeDaysAgoStr);
    // Don't complete this one to test streak calculation
    
    // Test challenge history
    const history = getUserChallengeHistory(testUser.id);
    console.log(`Retrieved ${history.length} challenge history items`);
    
    // Test statistics
    console.log('\nTesting statistics functions:');
    const stats = getUserStats(testUser.id);
    console.log('User stats:', stats);
    
    // Test user deletion
    console.log('\nTesting user deletion:');
    const deleted = deleteUser(testUser.id);
    console.log('User deleted:', deleted);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error testing database utility functions:', error);
  } finally {
    // Close the database connection
    closeDb();
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  testDatabaseUtils();
}