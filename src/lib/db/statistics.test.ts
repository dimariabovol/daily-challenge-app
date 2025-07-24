/**
 * Unit tests for statistics calculations
 * Tests streak calculation edge cases and completion rate calculation
 * 
 * Run with: npx tsx src/lib/db/statistics.test.ts
 */

import { resetSchema } from './schema';
import { seedDatabase } from './seed-db';
import { createUser } from './users';
import { createUserChallenge, completeUserChallenge, getChallengeTemplates } from './challenges';
import { 
  calculateCurrentStreak, 
  calculateLongestStreak, 
  calculateCompletionRate, 
  getUserStats 
} from './statistics';
import { closeDb } from './index';

/**
 * Simple assertion function for testing
 */
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Setup function to initialize test environment
 */
function setupTest() {
  // Reset database and seed with test data
  resetSchema();
  seedDatabase();
  
  // Create a test user
  const testUser = createUser('test@example.com', 'hashedpassword');
  const templates = getChallengeTemplates();
  
  return { testUserId: testUser.id, templates };
}

/**
 * Test calculateCurrentStreak function
 */
async function testCalculateCurrentStreak() {
  console.log('\n=== Testing calculateCurrentStreak ===');
  
  // Test 1: User with no challenges should return 0
  console.log('Test 1: User with no challenges');
  const { testUserId: userId1, templates } = setupTest();
  const streak1 = calculateCurrentStreak(userId1);
  assert(streak1 === 0, `Expected 0, got ${streak1}`);
  console.log('✅ Passed: User with no challenges returns 0');
  
  // Test 2: Today's challenge not completed should return 0
  console.log('Test 2: Today\'s challenge not completed');
  const { testUserId: userId2, templates: templates2 } = setupTest();
  const today = new Date().toISOString().split('T')[0];
  createUserChallenge(userId2, templates2[0].id, today);
  const streak2 = calculateCurrentStreak(userId2);
  assert(streak2 === 0, `Expected 0, got ${streak2}`);
  console.log('✅ Passed: Today\'s challenge not completed returns 0');
  
  // Test 3: Only today's challenge completed should return 1
  console.log('Test 3: Only today\'s challenge completed');
  const { testUserId: userId3, templates: templates3 } = setupTest();
  const todayStr = new Date().toISOString().split('T')[0];
  const challenge3 = createUserChallenge(userId3, templates3[0].id, todayStr);
  completeUserChallenge(challenge3.id);
  const streak3 = calculateCurrentStreak(userId3);
  assert(streak3 === 1, `Expected 1, got ${streak3}`);
  console.log('✅ Passed: Only today\'s challenge completed returns 1');
  
  // Test 4: Consecutive completed challenges
  console.log('Test 4: Consecutive completed challenges');
  const { testUserId: userId4, templates: templates4 } = setupTest();
  const baseDate = new Date();
  for (let i = 0; i < 5; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const challenge = createUserChallenge(userId4, templates4[i % templates4.length].id, dateStr);
    completeUserChallenge(challenge.id);
  }
  const streak4 = calculateCurrentStreak(userId4);
  assert(streak4 === 5, `Expected 5, got ${streak4}`);
  console.log('✅ Passed: Consecutive completed challenges calculated correctly');
  
  // Test 5: Streak breaks when a day is missed
  console.log('Test 5: Streak breaks when a day is missed');
  const { testUserId: userId5, templates: templates5 } = setupTest();
  const todayDate = new Date();
  
  // Today - completed
  const todayStr5 = todayDate.toISOString().split('T')[0];
  const todayChallenge = createUserChallenge(userId5, templates5[0].id, todayStr5);
  completeUserChallenge(todayChallenge.id);
  
  // Yesterday - completed
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayChallenge = createUserChallenge(userId5, templates5[1].id, yesterdayStr);
  completeUserChallenge(yesterdayChallenge.id);
  
  // Two days ago - NOT completed (breaks streak)
  const twoDaysAgo = new Date(todayDate);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
  createUserChallenge(userId5, templates5[2].id, twoDaysAgoStr);
  
  const streak5 = calculateCurrentStreak(userId5);
  assert(streak5 === 2, `Expected 2, got ${streak5}`);
  console.log('✅ Passed: Streak breaks when a day is missed');
  
  console.log('✅ All calculateCurrentStreak tests passed!');
}

/**
 * Test calculateLongestStreak function
 */
async function testCalculateLongestStreak() {
  console.log('\n=== Testing calculateLongestStreak ===');
  
  // Test 1: User with no challenges should return 0
  console.log('Test 1: User with no challenges');
  const { testUserId: userId1, templates } = setupTest();
  const longestStreak1 = calculateLongestStreak(userId1);
  assert(longestStreak1 === 0, `Expected 0, got ${longestStreak1}`);
  console.log('✅ Passed: User with no challenges returns 0');
  
  // Test 2: No challenges completed should return 0
  console.log('Test 2: No challenges completed');
  const { testUserId: userId2, templates: templates2 } = setupTest();
  const today = new Date();
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    createUserChallenge(userId2, templates2[i].id, dateStr);
  }
  const longestStreak2 = calculateLongestStreak(userId2);
  assert(longestStreak2 === 0, `Expected 0, got ${longestStreak2}`);
  console.log('✅ Passed: No challenges completed returns 0');
  
  // Test 3: Single completed challenge should return 1
  console.log('Test 3: Single completed challenge');
  const { testUserId: userId3, templates: templates3 } = setupTest();
  const todayStr = new Date().toISOString().split('T')[0];
  const challenge3 = createUserChallenge(userId3, templates3[0].id, todayStr);
  completeUserChallenge(challenge3.id);
  const longestStreak3 = calculateLongestStreak(userId3);
  assert(longestStreak3 === 1, `Expected 1, got ${longestStreak3}`);
  console.log('✅ Passed: Single completed challenge returns 1');
  
  // Test 4: Multiple streaks - should return the longest
  console.log('Test 4: Multiple streaks');
  const { testUserId: userId4, templates: templates4 } = setupTest();
  const baseDate = new Date('2024-01-01');
  
  // First streak: 3 days (Jan 1-3)
  for (let i = 0; i < 3; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const challenge = createUserChallenge(userId4, templates4[i % templates4.length].id, dateStr);
    completeUserChallenge(challenge.id);
  }
  
  // Gap: Jan 4 - incomplete
  const gapDate = new Date(baseDate);
  gapDate.setDate(gapDate.getDate() + 3);
  const gapDateStr = gapDate.toISOString().split('T')[0];
  createUserChallenge(userId4, templates4[3 % templates4.length].id, gapDateStr);
  
  // Second streak: 5 days (Jan 5-9) - this should be the longest
  for (let i = 4; i < 9; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const challenge = createUserChallenge(userId4, templates4[i % templates4.length].id, dateStr);
    completeUserChallenge(challenge.id);
  }
  
  const longestStreak4 = calculateLongestStreak(userId4);
  assert(longestStreak4 === 5, `Expected 5, got ${longestStreak4}`);
  console.log('✅ Passed: Multiple streaks - returns the longest');
  
  console.log('✅ All calculateLongestStreak tests passed!');
}

/**
 * Test calculateCompletionRate function
 */
async function testCalculateCompletionRate() {
  console.log('\n=== Testing calculateCompletionRate ===');
  
  // Test 1: User with no challenges should return 0
  console.log('Test 1: User with no challenges');
  const { testUserId: userId1, templates } = setupTest();
  const completionRate1 = calculateCompletionRate(userId1);
  assert(completionRate1 === 0, `Expected 0, got ${completionRate1}`);
  console.log('✅ Passed: User with no challenges returns 0');
  
  // Test 2: No challenges completed should return 0
  console.log('Test 2: No challenges completed');
  const { testUserId: userId2, templates: templates2 } = setupTest();
  const today = new Date();
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    createUserChallenge(userId2, templates2[i].id, dateStr);
  }
  const completionRate2 = calculateCompletionRate(userId2);
  assert(completionRate2 === 0, `Expected 0, got ${completionRate2}`);
  console.log('✅ Passed: No challenges completed returns 0');
  
  // Test 3: All challenges completed should return 100
  console.log('Test 3: All challenges completed');
  const { testUserId: userId3, templates: templates3 } = setupTest();
  const today3 = new Date();
  for (let i = 0; i < 3; i++) {
    const date = new Date(today3);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const challenge = createUserChallenge(userId3, templates3[i].id, dateStr);
    completeUserChallenge(challenge.id);
  }
  const completionRate3 = calculateCompletionRate(userId3);
  assert(completionRate3 === 100, `Expected 100, got ${completionRate3}`);
  console.log('✅ Passed: All challenges completed returns 100');
  
  // Test 4: Partial completion rate
  console.log('Test 4: Partial completion rate');
  const { testUserId: userId4, templates: templates4 } = setupTest();
  const today4 = new Date();
  // Create 10 challenges, complete 7 of them
  for (let i = 0; i < 10; i++) {
    const date = new Date(today4);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const challenge = createUserChallenge(userId4, templates4[i % templates4.length].id, dateStr);
    
    // Complete first 7 challenges
    if (i < 7) {
      completeUserChallenge(challenge.id);
    }
  }
  const completionRate4 = calculateCompletionRate(userId4);
  assert(completionRate4 === 70, `Expected 70, got ${completionRate4}`);
  console.log('✅ Passed: Partial completion rate calculated correctly');
  
  // Test 5: Rounding test (2/3 = 66.67% -> rounds to 67%)
  console.log('Test 5: Completion rate rounding');
  const { testUserId: userId5, templates: templates5 } = setupTest();
  const today5 = new Date();
  for (let i = 0; i < 3; i++) {
    const date = new Date(today5);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const challenge = createUserChallenge(userId5, templates5[i].id, dateStr);
    
    // Complete first 2 challenges
    if (i < 2) {
      completeUserChallenge(challenge.id);
    }
  }
  const completionRate5 = calculateCompletionRate(userId5);
  assert(completionRate5 === 67, `Expected 67, got ${completionRate5}`);
  console.log('✅ Passed: Completion rate rounding works correctly');
  
  console.log('✅ All calculateCompletionRate tests passed!');
}

/**
 * Test getUserStats integration
 */
async function testGetUserStats() {
  console.log('\n=== Testing getUserStats integration ===');
  
  // Test 1: New user should return zero stats
  console.log('Test 1: New user zero stats');
  const { testUserId: userId1, templates } = setupTest();
  const stats1 = getUserStats(userId1);
  assert(stats1.totalChallenges === 0, `Expected totalChallenges 0, got ${stats1.totalChallenges}`);
  assert(stats1.completedChallenges === 0, `Expected completedChallenges 0, got ${stats1.completedChallenges}`);
  assert(stats1.currentStreak === 0, `Expected currentStreak 0, got ${stats1.currentStreak}`);
  assert(stats1.longestStreak === 0, `Expected longestStreak 0, got ${stats1.longestStreak}`);
  assert(stats1.completionRate === 0, `Expected completionRate 0, got ${stats1.completionRate}`);
  console.log('✅ Passed: New user returns zero stats');
  
  // Test 2: Complex scenario with mixed challenge history
  console.log('Test 2: Mixed challenge history');
  const { testUserId: userId2, templates: templates2 } = setupTest();
  const today = new Date();
  
  // Create a complex scenario
  const scenarios = [
    { offset: 0, complete: true },   // Today - completed
    { offset: 1, complete: true },   // Yesterday - completed  
    { offset: 2, complete: false },  // 2 days ago - not completed
    { offset: 3, complete: true },   // 3 days ago - completed
    { offset: 4, complete: true },   // 4 days ago - completed
    { offset: 5, complete: true },   // 5 days ago - completed
  ];
  
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const date = new Date(today);
    date.setDate(date.getDate() - scenario.offset);
    const dateStr = date.toISOString().split('T')[0];
    const challenge = createUserChallenge(userId2, templates2[i % templates2.length].id, dateStr);
    
    if (scenario.complete) {
      completeUserChallenge(challenge.id);
    }
  }
  
  const stats2 = getUserStats(userId2);
  assert(stats2.totalChallenges === 6, `Expected totalChallenges 6, got ${stats2.totalChallenges}`);
  assert(stats2.completedChallenges === 5, `Expected completedChallenges 5, got ${stats2.completedChallenges}`);
  assert(stats2.currentStreak === 2, `Expected currentStreak 2, got ${stats2.currentStreak}`);
  assert(stats2.longestStreak === 3, `Expected longestStreak 3, got ${stats2.longestStreak}`);
  assert(stats2.completionRate === 83, `Expected completionRate 83, got ${stats2.completionRate}`);
  console.log('✅ Passed: Mixed challenge history calculated correctly');
  
  console.log('✅ All getUserStats tests passed!');
}

/**
 * Main test runner
 */
async function runStatisticsTests() {
  try {
    console.log('🧪 Starting statistics calculations tests...');
    
    await testCalculateCurrentStreak();
    await testCalculateLongestStreak();
    await testCalculateCompletionRate();
    await testGetUserStats();
    
    console.log('\n🎉 All statistics tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    closeDb();
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runStatisticsTests();
}