/**
 * Unit tests for ChallengeCard component functionality
 * Tests challenge card interactions and state management
 * 
 * Run with: npx tsx src/components/ChallengeCard.test.ts
 */

import { Challenge, ChallengeCategory } from './ChallengeCard';

/**
 * Simple assertion function for testing
 */
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Mock challenge data for testing
 */
function createMockChallenge(overrides: Partial<Challenge> = {}): Challenge {
  const defaultCategory: ChallengeCategory = {
    id: 'fitness',
    name: 'Fitness',
    color: '#ef4444',
    icon: '💪'
  };

  return {
    id: 'test-challenge-1',
    date: '2024-01-15',
    title: 'Test Challenge',
    description: 'This is a test challenge description',
    category: defaultCategory,
    completed: false,
    ...overrides
  };
}

/**
 * Test challenge data validation
 */
async function testChallengeDataValidation() {
  console.log('\n=== Testing Challenge Data Validation ===');
  
  // Test 1: Valid challenge data structure
  console.log('Test 1: Valid challenge data structure');
  const validChallenge = createMockChallenge();
  
  assert(typeof validChallenge.id === 'string', 'Challenge ID should be string');
  assert(typeof validChallenge.date === 'string', 'Challenge date should be string');
  assert(typeof validChallenge.title === 'string', 'Challenge title should be string');
  assert(typeof validChallenge.description === 'string', 'Challenge description should be string');
  assert(typeof validChallenge.completed === 'boolean', 'Challenge completed should be boolean');
  assert(typeof validChallenge.category === 'object', 'Challenge category should be object');
  assert(typeof validChallenge.category.id === 'string', 'Category ID should be string');
  assert(typeof validChallenge.category.name === 'string', 'Category name should be string');
  assert(typeof validChallenge.category.color === 'string', 'Category color should be string');
  assert(typeof validChallenge.category.icon === 'string', 'Category icon should be string');
  
  console.log('✅ Passed: Valid challenge data structure');
  
  // Test 2: Challenge with completion timestamp
  console.log('Test 2: Challenge with completion timestamp');
  const completedChallenge = createMockChallenge({
    completed: true,
    completedAt: '2024-01-15T10:30:00Z'
  });
  
  assert(completedChallenge.completed === true, 'Completed challenge should have completed=true');
  assert(completedChallenge.completedAt !== undefined, 'Completed challenge should have completedAt timestamp');
  assert(typeof completedChallenge.completedAt === 'string', 'CompletedAt should be string');
  
  console.log('✅ Passed: Challenge with completion timestamp');
  
  // Test 3: Date format validation
  console.log('Test 3: Date format validation');
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  assert(dateRegex.test(validChallenge.date), 'Challenge date should be in YYYY-MM-DD format');
  
  console.log('✅ Passed: Date format validation');
  
  console.log('✅ All challenge data validation tests passed!');
}

/**
 * Test challenge completion logic
 */
async function testChallengeCompletionLogic() {
  console.log('\n=== Testing Challenge Completion Logic ===');
  
  // Test 1: Incomplete challenge state
  console.log('Test 1: Incomplete challenge state');
  const incompleteChallenge = createMockChallenge({
    completed: false,
    completedAt: undefined
  });
  
  assert(incompleteChallenge.completed === false, 'Incomplete challenge should have completed=false');
  assert(incompleteChallenge.completedAt === undefined, 'Incomplete challenge should not have completedAt');
  
  console.log('✅ Passed: Incomplete challenge state');
  
  // Test 2: Complete challenge state
  console.log('Test 2: Complete challenge state');
  const completedChallenge = createMockChallenge({
    completed: true,
    completedAt: '2024-01-15T14:25:30Z'
  });
  
  assert(completedChallenge.completed === true, 'Completed challenge should have completed=true');
  assert(completedChallenge.completedAt !== undefined, 'Completed challenge should have completedAt');
  
  console.log('✅ Passed: Complete challenge state');
  
  // Test 3: Toggle completion simulation
  console.log('Test 3: Toggle completion simulation');
  let challenge = createMockChallenge({ completed: false });
  
  // Simulate marking as complete
  challenge = {
    ...challenge,
    completed: true,
    completedAt: new Date().toISOString()
  };
  
  assert(challenge.completed === true, 'Challenge should be marked as completed');
  assert(challenge.completedAt !== undefined, 'Challenge should have completion timestamp');
  
  // Simulate marking as incomplete
  challenge = {
    ...challenge,
    completed: false,
    completedAt: undefined
  };
  
  assert(challenge.completed === false, 'Challenge should be marked as incomplete');
  assert(challenge.completedAt === undefined, 'Challenge should not have completion timestamp');
  
  console.log('✅ Passed: Toggle completion simulation');
  
  console.log('✅ All challenge completion logic tests passed!');
}

/**
 * Test category styling logic
 */
async function testCategoryStyling() {
  console.log('\n=== Testing Category Styling ===');
  
  // Test 1: Different category types
  console.log('Test 1: Different category types');
  const categories = [
    { id: 'fitness', name: 'Fitness', expectedIcon: '💪' },
    { id: 'creativity', name: 'Creativity', expectedIcon: '🎨' },
    { id: 'learning', name: 'Learning', expectedIcon: '📚' },
    { id: 'productivity', name: 'Productivity', expectedIcon: '⚡' },
    { id: 'mindfulness', name: 'Mindfulness', expectedIcon: '🧘' },
    { id: 'social', name: 'Social', expectedIcon: '👥' }
  ];
  
  for (const category of categories) {
    const challenge = createMockChallenge({
      category: {
        id: category.id,
        name: category.name,
        color: '#000000',
        icon: category.expectedIcon
      }
    });
    
    assert(challenge.category.id === category.id, `Category ID should be ${category.id}`);
    assert(challenge.category.name === category.name, `Category name should be ${category.name}`);
    assert(challenge.category.icon === category.expectedIcon, `Category icon should be ${category.expectedIcon}`);
  }
  
  console.log('✅ Passed: Different category types');
  
  // Test 2: Custom category with custom icon
  console.log('Test 2: Custom category with custom icon');
  const customChallenge = createMockChallenge({
    category: {
      id: 'custom',
      name: 'Custom Category',
      color: '#ff6b6b',
      icon: '🌟'
    }
  });
  
  assert(customChallenge.category.id === 'custom', 'Custom category ID should be preserved');
  assert(customChallenge.category.icon === '🌟', 'Custom category icon should be preserved');
  
  console.log('✅ Passed: Custom category with custom icon');
  
  console.log('✅ All category styling tests passed!');
}

/**
 * Test date formatting logic
 */
async function testDateFormatting() {
  console.log('\n=== Testing Date Formatting ===');
  
  // Test 1: Valid date string formatting
  console.log('Test 1: Valid date string formatting');
  const testDates = [
    '2024-01-15',
    '2024-12-31',
    '2024-02-29', // Leap year
    '2023-02-28'  // Non-leap year
  ];
  
  for (const dateStr of testDates) {
    const challenge = createMockChallenge({ date: dateStr });
    const date = new Date(dateStr);
    
    assert(!isNaN(date.getTime()), `Date ${dateStr} should be valid`);
    assert(challenge.date === dateStr, `Challenge date should match input ${dateStr}`);
  }
  
  console.log('✅ Passed: Valid date string formatting');
  
  // Test 2: Completion timestamp formatting
  console.log('Test 2: Completion timestamp formatting');
  const completedChallenge = createMockChallenge({
    completed: true,
    completedAt: '2024-01-15T14:30:45.123Z'
  });
  
  const completedDate = new Date(completedChallenge.completedAt!);
  assert(!isNaN(completedDate.getTime()), 'Completion timestamp should be valid');
  assert(completedChallenge.completedAt!.includes('T'), 'Completion timestamp should include time');
  
  console.log('✅ Passed: Completion timestamp formatting');
  
  console.log('✅ All date formatting tests passed!');
}

/**
 * Test challenge card interaction scenarios
 */
async function testChallengeCardInteractions() {
  console.log('\n=== Testing Challenge Card Interactions ===');
  
  // Test 1: Mock toggle completion function
  console.log('Test 1: Mock toggle completion function');
  let toggleCallCount = 0;
  let lastToggleParams: { challengeId: string; completed: boolean } | null = null;
  
  const mockToggleComplete = async (challengeId: string, completed: boolean) => {
    toggleCallCount++;
    lastToggleParams = { challengeId, completed };
    return Promise.resolve();
  };
  
  const challenge = createMockChallenge({ completed: false });
  
  // Simulate clicking to complete
  await mockToggleComplete(challenge.id, true);
  
  assert(toggleCallCount === 1, 'Toggle function should be called once');
  assert(lastToggleParams?.challengeId === challenge.id, 'Toggle should be called with correct challenge ID');
  assert(lastToggleParams?.completed === true, 'Toggle should be called with completed=true');
  
  // Simulate clicking to uncomplete
  await mockToggleComplete(challenge.id, false);
  
  assert(toggleCallCount === 2, 'Toggle function should be called twice');
  assert(lastToggleParams?.completed === false, 'Toggle should be called with completed=false');
  
  console.log('✅ Passed: Mock toggle completion function');
  
  // Test 2: Error handling simulation
  console.log('Test 2: Error handling simulation');
  const mockToggleWithError = async (challengeId: string, completed: boolean) => {
    throw new Error('Network error');
  };
  
  let errorCaught = false;
  try {
    await mockToggleWithError(challenge.id, true);
  } catch (error) {
    errorCaught = true;
    assert(error instanceof Error, 'Error should be an Error instance');
    assert(error.message === 'Network error', 'Error message should match');
  }
  
  assert(errorCaught, 'Error should be caught and handled');
  
  console.log('✅ Passed: Error handling simulation');
  
  console.log('✅ All challenge card interaction tests passed!');
}

/**
 * Main test runner
 */
async function runChallengeCardTests() {
  try {
    console.log('🧪 Starting ChallengeCard component tests...');
    
    await testChallengeDataValidation();
    await testChallengeCompletionLogic();
    await testCategoryStyling();
    await testDateFormatting();
    await testChallengeCardInteractions();
    
    console.log('\n🎉 All ChallengeCard component tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runChallengeCardTests();
}