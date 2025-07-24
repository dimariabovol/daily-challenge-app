/**
 * Test file for the user stats API endpoint
 * This file tests the /api/user/stats endpoint functionality
 * 
 * Run with: npx tsx src/app/api/user/stats/route.test.ts
 */

import { NextRequest } from 'next/server';
import { GET } from './route';
import { generateToken, hashPassword } from '@/lib/auth';
import { createUser } from '@/lib/db/users';
import { createUserChallenge, completeUserChallenge } from '@/lib/db/challenges';
import { getChallengeTemplates } from '@/lib/db/challenges';
import { resetSchema } from '@/lib/db/schema';

async function testUserStatsAPI() {
  console.log('Testing user stats API endpoint...');
  
  // Initialize database
  console.log('Initializing database...');
  resetSchema(); // Reset database
  
  try {
    // Seed the database with categories and templates
    console.log('Seeding database...');
    const { execSync } = require('child_process');
    execSync('npm run db:seed', { cwd: process.cwd(), stdio: 'inherit' });
    
    // Create a test user
    console.log('Creating test user...');
    const hashedPassword = hashPassword('password123');
    const testUser = createUser('test@example.com', hashedPassword);
    console.log('Test user created:', testUser.id);
    
    // Generate a token for the user
    const token = generateToken(testUser.id, testUser.email);
    console.log('Token generated');
    
    // Get some challenge templates to create challenges
    const templates = getChallengeTemplates();
    if (templates.length === 0) {
      throw new Error('No challenge templates found. Make sure to seed the database first.');
    }
    
    // Create some test challenges for different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
    
    console.log('Creating test challenges...');
    
    // Create challenges
    const challenge1 = createUserChallenge(testUser.id, templates[0].id, todayStr);
    const challenge2 = createUserChallenge(testUser.id, templates[1 % templates.length].id, yesterdayStr);
    const challenge3 = createUserChallenge(testUser.id, templates[2 % templates.length].id, twoDaysAgoStr);
    
    console.log('Challenges created:', [challenge1.id, challenge2.id, challenge3.id]);
    
    // Complete some challenges to test statistics
    console.log('Completing some challenges...');
    completeUserChallenge(challenge1.id); // Today - completed
    completeUserChallenge(challenge2.id); // Yesterday - completed
    // challenge3 remains incomplete
    
    // Create the request with proper authorization header
    const request = new NextRequest('http://localhost:3000/api/user/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Call the API endpoint
    console.log('Calling API endpoint...');
    const response = await GET(request);
    
    // Check response status
    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }
    
    // Parse response
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (!data.stats) {
      throw new Error('Response missing stats object');
    }
    
    const stats = data.stats;
    const expectedFields = ['totalChallenges', 'completedChallenges', 'currentStreak', 'longestStreak', 'completionRate'];
    
    for (const field of expectedFields) {
      if (typeof stats[field] !== 'number') {
        throw new Error(`Stats missing or invalid field: ${field}`);
      }
    }
    
    // Validate expected values
    console.log('Validating statistics...');
    
    if (stats.totalChallenges !== 3) {
      throw new Error(`Expected totalChallenges to be 3, got ${stats.totalChallenges}`);
    }
    
    if (stats.completedChallenges !== 2) {
      throw new Error(`Expected completedChallenges to be 2, got ${stats.completedChallenges}`);
    }
    
    if (stats.currentStreak !== 2) {
      throw new Error(`Expected currentStreak to be 2, got ${stats.currentStreak}`);
    }
    
    if (stats.longestStreak !== 2) {
      throw new Error(`Expected longestStreak to be 2, got ${stats.longestStreak}`);
    }
    
    const expectedCompletionRate = Math.round((2 / 3) * 100); // 67%
    if (stats.completionRate !== expectedCompletionRate) {
      throw new Error(`Expected completionRate to be ${expectedCompletionRate}, got ${stats.completionRate}`);
    }
    
    console.log('✅ All statistics validation passed!');
    
    // Test unauthorized access
    console.log('Testing unauthorized access...');
    const unauthorizedRequest = new NextRequest('http://localhost:3000/api/user/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      }
    });
    
    const unauthorizedResponse = await GET(unauthorizedRequest);
    
    if (unauthorizedResponse.status !== 401) {
      throw new Error(`Expected 401 for unauthorized request, got ${unauthorizedResponse.status}`);
    }
    
    console.log('✅ Unauthorized access properly rejected!');
    
    // Test invalid token
    console.log('Testing invalid token...');
    const invalidTokenRequest = new NextRequest('http://localhost:3000/api/user/stats', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json'
      }
    });
    
    const invalidTokenResponse = await GET(invalidTokenRequest);
    
    if (invalidTokenResponse.status !== 401) {
      throw new Error(`Expected 401 for invalid token, got ${invalidTokenResponse.status}`);
    }
    
    console.log('✅ Invalid token properly rejected!');
    
    console.log('🎉 All user stats API tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testUserStatsAPI().catch(console.error);