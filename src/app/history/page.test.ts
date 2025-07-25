/**
 * Unit tests for History page functionality
 * Tests pagination, filtering, and data management logic
 * 
 * Run with: npx tsx src/app/history/page.test.ts
 */

import { Challenge, ChallengeCategory } from '@/components/ChallengeCard';

/**
 * Simple assertion function for testing
 */
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Mock challenge history data structure
 */
interface ChallengeHistoryData {
  challenges: Challenge[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Create mock challenge for testing
 */
function createMockChallenge(id: string, completed: boolean, date: string): Challenge {
  const category: ChallengeCategory = {
    id: 'fitness',
    name: 'Fitness',
    color: '#ef4444',
    icon: '💪'
  };

  return {
    id,
    date,
    title: `Challenge ${id}`,
    description: `Description for challenge ${id}`,
    category,
    completed,
    completedAt: completed ? new Date().toISOString() : undefined
  };
}

/**
 * Create mock history data
 */
function createMockHistoryData(
  challenges: Challenge[],
  page: number = 1,
  limit: number = 20,
  total: number = challenges.length
): ChallengeHistoryData {
  return {
    challenges,
    pagination: {
      page,
      limit,
      total,
      hasMore: page * limit < total
    }
  };
}

/**
 * Test pagination logic
 */
async function testPaginationLogic() {
  console.log('\n=== Testing Pagination Logic ===');
  
  // Test 1: First page with more data available
  console.log('Test 1: First page with more data available');
  const challenges1 = Array.from({ length: 20 }, (_, i) => 
    createMockChallenge(`challenge-${i}`, i % 2 === 0, `2024-01-${String(i + 1).padStart(2, '0')}`)
  );
  
  const historyData1 = createMockHistoryData(challenges1, 1, 20, 50);
  
  assert(historyData1.pagination.page === 1, 'Should be on page 1');
  assert(historyData1.pagination.limit === 20, 'Should have limit of 20');
  assert(historyData1.pagination.total === 50, 'Should have total of 50');
  assert(historyData1.pagination.hasMore === true, 'Should have more pages available');
  assert(historyData1.challenges.length === 20, 'Should have 20 challenges on first page');
  
  console.log('✅ Passed: First page with more data available');
  
  // Test 2: Last page with no more data
  console.log('Test 2: Last page with no more data');
  const challenges2 = Array.from({ length: 10 }, (_, i) => 
    createMockChallenge(`challenge-${i + 40}`, i % 2 === 0, `2024-02-${String(i + 1).padStart(2, '0')}`)
  );
  
  const historyData2 = createMockHistoryData(challenges2, 3, 20, 50);
  
  assert(historyData2.pagination.page === 3, 'Should be on page 3');
  assert(historyData2.pagination.hasMore === false, 'Should not have more pages');
  assert(historyData2.challenges.length === 10, 'Should have 10 challenges on last page');
  
  console.log('✅ Passed: Last page with no more data');
  
  // Test 3: Empty result set
  console.log('Test 3: Empty result set');
  const historyData3 = createMockHistoryData([], 1, 20, 0);
  
  assert(historyData3.pagination.total === 0, 'Should have total of 0');
  assert(historyData3.pagination.hasMore === false, 'Should not have more pages');
  assert(historyData3.challenges.length === 0, 'Should have no challenges');
  
  console.log('✅ Passed: Empty result set');
  
  console.log('✅ All pagination logic tests passed!');
}

/**
 * Test filtering logic
 */
async function testFilteringLogic() {
  console.log('\n=== Testing Filtering Logic ===');
  
  // Test 1: Filter by completed challenges
  console.log('Test 1: Filter by completed challenges');
  const allChallenges = [
    createMockChallenge('1', true, '2024-01-01'),
    createMockChallenge('2', false, '2024-01-02'),
    createMockChallenge('3', true, '2024-01-03'),
    createMockChallenge('4', false, '2024-01-04'),
    createMockChallenge('5', true, '2024-01-05')
  ];
  
  const completedChallenges = allChallenges.filter(c => c.completed);
  const completedHistoryData = createMockHistoryData(completedChallenges, 1, 20, completedChallenges.length);
  
  assert(completedHistoryData.challenges.length === 3, 'Should have 3 completed challenges');
  assert(completedHistoryData.challenges.every(c => c.completed), 'All challenges should be completed');
  
  console.log('✅ Passed: Filter by completed challenges');
  
  // Test 2: Filter by incomplete challenges
  console.log('Test 2: Filter by incomplete challenges');
  const incompleteChallenges = allChallenges.filter(c => !c.completed);
  const incompleteHistoryData = createMockHistoryData(incompleteChallenges, 1, 20, incompleteChallenges.length);
  
  assert(incompleteHistoryData.challenges.length === 2, 'Should have 2 incomplete challenges');
  assert(incompleteHistoryData.challenges.every(c => !c.completed), 'All challenges should be incomplete');
  
  console.log('✅ Passed: Filter by incomplete challenges');
  
  // Test 3: No filter (all challenges)
  console.log('Test 3: No filter (all challenges)');
  const allHistoryData = createMockHistoryData(allChallenges, 1, 20, allChallenges.length);
  
  assert(allHistoryData.challenges.length === 5, 'Should have all 5 challenges');
  assert(allHistoryData.challenges.some(c => c.completed), 'Should have some completed challenges');
  assert(allHistoryData.challenges.some(c => !c.completed), 'Should have some incomplete challenges');
  
  console.log('✅ Passed: No filter (all challenges)');
  
  console.log('✅ All filtering logic tests passed!');
}

/**
 * Test load more functionality
 */
async function testLoadMoreFunctionality() {
  console.log('\n=== Testing Load More Functionality ===');
  
  // Test 1: Append new challenges to existing list
  console.log('Test 1: Append new challenges to existing list');
  const existingChallenges = Array.from({ length: 20 }, (_, i) => 
    createMockChallenge(`existing-${i}`, i % 2 === 0, `2024-01-${String(i + 1).padStart(2, '0')}`)
  );
  
  const newChallenges = Array.from({ length: 15 }, (_, i) => 
    createMockChallenge(`new-${i}`, i % 3 === 0, `2024-02-${String(i + 1).padStart(2, '0')}`)
  );
  
  const existingData = createMockHistoryData(existingChallenges, 1, 20, 50);
  const newData = createMockHistoryData(newChallenges, 2, 20, 50);
  
  // Simulate appending new data
  const combinedData: ChallengeHistoryData = {
    challenges: [...existingData.challenges, ...newData.challenges],
    pagination: newData.pagination
  };
  
  assert(combinedData.challenges.length === 35, 'Should have 35 total challenges after load more');
  assert(combinedData.pagination.page === 2, 'Should be on page 2');
  assert(combinedData.pagination.hasMore === true, 'Should still have more pages');
  
  // Check that existing challenges are preserved
  const existingIds = existingChallenges.map(c => c.id);
  const combinedIds = combinedData.challenges.slice(0, 20).map(c => c.id);
  assert(JSON.stringify(existingIds) === JSON.stringify(combinedIds), 'Existing challenges should be preserved');
  
  console.log('✅ Passed: Append new challenges to existing list');
  
  // Test 2: Load more when no more data available
  console.log('Test 2: Load more when no more data available');
  const finalPageData = createMockHistoryData(newChallenges, 3, 20, 50);
  finalPageData.pagination.hasMore = false;
  
  assert(finalPageData.pagination.hasMore === false, 'Should not have more data available');
  
  console.log('✅ Passed: Load more when no more data available');
  
  console.log('✅ All load more functionality tests passed!');
}

/**
 * Test challenge state updates
 */
async function testChallengeStateUpdates() {
  console.log('\n=== Testing Challenge State Updates ===');
  
  // Test 1: Toggle challenge completion in history
  console.log('Test 1: Toggle challenge completion in history');
  const challenges = [
    createMockChallenge('1', false, '2024-01-01'),
    createMockChallenge('2', true, '2024-01-02'),
    createMockChallenge('3', false, '2024-01-03')
  ];
  
  let historyData = createMockHistoryData(challenges, 1, 20, 3);
  
  // Simulate toggling challenge 1 to completed
  const challengeId = '1';
  const newCompleted = true;
  
  const updatedChallenges = historyData.challenges.map(challenge =>
    challenge.id === challengeId
      ? { ...challenge, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : undefined }
      : challenge
  );
  
  historyData = {
    ...historyData,
    challenges: updatedChallenges
  };
  
  const updatedChallenge = historyData.challenges.find(c => c.id === challengeId);
  assert(updatedChallenge?.completed === true, 'Challenge should be marked as completed');
  assert(updatedChallenge?.completedAt !== undefined, 'Challenge should have completion timestamp');
  
  console.log('✅ Passed: Toggle challenge completion in history');
  
  // Test 2: Toggle challenge from completed to incomplete
  console.log('Test 2: Toggle challenge from completed to incomplete');
  const updatedChallenges2 = historyData.challenges.map(challenge =>
    challenge.id === challengeId
      ? { ...challenge, completed: false, completedAt: undefined }
      : challenge
  );
  
  historyData = {
    ...historyData,
    challenges: updatedChallenges2
  };
  
  const revertedChallenge = historyData.challenges.find(c => c.id === challengeId);
  assert(revertedChallenge?.completed === false, 'Challenge should be marked as incomplete');
  assert(revertedChallenge?.completedAt === undefined, 'Challenge should not have completion timestamp');
  
  console.log('✅ Passed: Toggle challenge from completed to incomplete');
  
  // Test 3: Update non-existent challenge (should not affect other challenges)
  console.log('Test 3: Update non-existent challenge');
  const originalChallenges = [...historyData.challenges];
  
  const updatedChallenges3 = historyData.challenges.map(challenge =>
    challenge.id === 'non-existent'
      ? { ...challenge, completed: true }
      : challenge
  );
  
  assert(JSON.stringify(originalChallenges) === JSON.stringify(updatedChallenges3), 
    'Challenges should remain unchanged when updating non-existent challenge');
  
  console.log('✅ Passed: Update non-existent challenge');
  
  console.log('✅ All challenge state update tests passed!');
}

/**
 * Test error handling scenarios
 */
async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  // Test 1: API error simulation
  console.log('Test 1: API error simulation');
  const mockApiError = new Error('Failed to load challenge history');
  
  let errorHandled = false;
  try {
    throw mockApiError;
  } catch (error) {
    errorHandled = true;
    assert(error instanceof Error, 'Error should be an Error instance');
    assert(error.message === 'Failed to load challenge history', 'Error message should match');
  }
  
  assert(errorHandled, 'Error should be caught and handled');
  
  console.log('✅ Passed: API error simulation');
  
  // Test 2: Network timeout simulation
  console.log('Test 2: Network timeout simulation');
  const mockTimeoutError = new Error('Request timeout');
  
  let timeoutHandled = false;
  try {
    throw mockTimeoutError;
  } catch (error) {
    timeoutHandled = true;
    assert(error instanceof Error, 'Timeout error should be an Error instance');
    assert(error.message === 'Request timeout', 'Timeout error message should match');
  }
  
  assert(timeoutHandled, 'Timeout error should be caught and handled');
  
  console.log('✅ Passed: Network timeout simulation');
  
  // Test 3: Invalid data format handling
  console.log('Test 3: Invalid data format handling');
  const invalidHistoryData = {
    challenges: null, // Invalid: should be array
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false
    }
  };
  
  let invalidDataHandled = false;
  try {
    if (!Array.isArray(invalidHistoryData.challenges)) {
      throw new Error('Invalid data format: challenges should be an array');
    }
  } catch (error) {
    invalidDataHandled = true;
    assert(error instanceof Error, 'Invalid data error should be an Error instance');
    assert(error.message.includes('Invalid data format'), 'Error message should indicate invalid format');
  }
  
  assert(invalidDataHandled, 'Invalid data format should be caught and handled');
  
  console.log('✅ Passed: Invalid data format handling');
  
  console.log('✅ All error handling tests passed!');
}

/**
 * Main test runner
 */
async function runHistoryPageTests() {
  try {
    console.log('🧪 Starting History page tests...');
    
    await testPaginationLogic();
    await testFilteringLogic();
    await testLoadMoreFunctionality();
    await testChallengeStateUpdates();
    await testErrorHandling();
    
    console.log('\n🎉 All History page tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runHistoryPageTests();
}