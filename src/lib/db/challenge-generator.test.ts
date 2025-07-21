import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateDailyChallenge, getTodaysChallengeId, getUpcomingChallenges } from './challenge-generator';
import type { Category, ChallengeTemplate, UserChallenge, CompleteChallenge } from './challenges';

// Mock the dependencies
vi.mock('./challenges', () => ({
  getCategories: vi.fn(),
  getChallengeTemplates: vi.fn(),
  createUserChallenge: vi.fn(),
  getUserChallengeByDate: vi.fn(),
  getUserChallengeById: vi.fn(),
  getChallengeTemplateById: vi.fn()
}));

vi.mock('./index', () => ({
  transaction: vi.fn((callback: (db: any) => any) => callback({ prepare: () => ({ all: vi.fn() }) })),
  closeDb: vi.fn()
}));

// Import the mocked modules
import { getCategories, getChallengeTemplates, createUserChallenge, getUserChallengeByDate, getUserChallengeById, getChallengeTemplateById } from './challenges';
import { transaction } from './index';

describe('Challenge Generator', () => {
  // Mock data
  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Fitness', color: '#4CAF50', icon: 'fitness' },
    { id: 'cat2', name: 'Creativity', color: '#FF9800', icon: 'creativity' },
    { id: 'cat3', name: 'Learning', color: '#2196F3', icon: 'learning' },
    { id: 'cat4', name: 'Productivity', color: '#9C27B0', icon: 'productivity' },
    { id: 'cat5', name: 'Mindfulness', color: '#00BCD4', icon: 'mindfulness' },
    { id: 'cat6', name: 'Social', color: '#F44336', icon: 'social' }
  ];
  
  const mockTemplates: Record<string, ChallengeTemplate[]> = {
    'cat1': [
      { id: 'temp1', title: 'Do 20 push-ups', description: 'Challenge yourself', category_id: 'cat1' },
      { id: 'temp2', title: 'Take a 30-minute walk', description: 'Get moving', category_id: 'cat1' }
    ],
    'cat2': [
      { id: 'temp3', title: 'Draw a self-portrait', description: 'Express yourself', category_id: 'cat2' },
      { id: 'temp4', title: 'Write a short poem', description: 'Be creative', category_id: 'cat2' }
    ],
    'cat3': [
      { id: 'temp5', title: 'Learn 5 new words', description: 'Expand vocabulary', category_id: 'cat3' },
      { id: 'temp6', title: 'Read an article', description: 'Learn something new', category_id: 'cat3' }
    ],
    'cat4': [
      { id: 'temp7', title: 'Clear your email inbox', description: 'Organize communications', category_id: 'cat4' },
      { id: 'temp8', title: 'Create a to-do list', description: 'Plan your week', category_id: 'cat4' }
    ],
    'cat5': [
      { id: 'temp9', title: 'Meditate for 10 minutes', description: 'Quiet your mind', category_id: 'cat5' },
      { id: 'temp10', title: 'Practice gratitude', description: 'List things you appreciate', category_id: 'cat5' }
    ],
    'cat6': [
      { id: 'temp11', title: 'Call a friend', description: 'Reconnect with someone', category_id: 'cat6' },
      { id: 'temp12', title: 'Give compliments', description: 'Spread positivity', category_id: 'cat6' }
    ]
  };
  
  interface MockChallenge extends UserChallenge {
    id: string;
    user_id: string;
    template_id: string;
    date: string;
    completed: number;
    created_at: string;
  }
  
  const mockChallenges: Record<string, MockChallenge> = {};
  let mockChallengeId = 1;
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock getCategories
    vi.mocked(getCategories).mockReturnValue(mockCategories);
    
    // Mock getChallengeTemplates
    vi.mocked(getChallengeTemplates).mockImplementation((categoryId?: string) => {
      if (categoryId && categoryId in mockTemplates) {
        return mockTemplates[categoryId] || [];
      }
      return Object.values(mockTemplates).flat();
    });
    
    // Mock getUserChallengeByDate
    vi.mocked(getUserChallengeByDate).mockImplementation((userId: string, date: string) => {
      const key = `${userId}-${date}`;
      return mockChallenges[key] as unknown as CompleteChallenge;
    });
    
    // Mock createUserChallenge
    vi.mocked(createUserChallenge).mockImplementation((userId: string, templateId: string, date: string) => {
      const id = `challenge-${mockChallengeId++}`;
      const challenge: MockChallenge = {
        id,
        user_id: userId,
        template_id: templateId,
        date,
        completed: 0,
        created_at: new Date().toISOString()
      };
      mockChallenges[`${userId}-${date}`] = challenge;
      return challenge;
    });
    
    // Mock getUserChallengeById
    vi.mocked(getUserChallengeById).mockImplementation((id: string) => {
      for (const key in mockChallenges) {
        if (mockChallenges[key].id === id) {
          return mockChallenges[key];
        }
      }
      return undefined;
    });
    
    // Mock getChallengeTemplateById
    vi.mocked(getChallengeTemplateById).mockImplementation((id: string) => {
      for (const catId in mockTemplates) {
        const template = mockTemplates[catId].find(t => t.id === id);
        if (template) return template;
      }
      return undefined;
    });
    
    // Mock transaction
    vi.mocked(transaction).mockImplementation((callback: (db: any) => any) => {
      const mockDb = {
        prepare: () => ({
          all: (userId: string) => {
            // Return recent challenges for the user
            const recentChallenges = [];
            for (const key in mockChallenges) {
              if (key.startsWith(`${userId}-`)) {
                const challenge = mockChallenges[key];
                const template = mockTemplates[Object.keys(mockTemplates)[0]][0];
                recentChallenges.push({
                  id: challenge.id,
                  date: challenge.date,
                  category_id: template.category_id
                });
              }
            }
            return recentChallenges;
          }
        })
      };
      return callback(mockDb);
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should generate a challenge for a user and date', () => {
    const userId = 'test-user-1';
    const date = '2023-01-01';
    
    const challengeId = generateDailyChallenge(userId, date);
    expect(challengeId).toBeDefined();
    
    expect(createUserChallenge).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      date
    );
  });

  it('should return the same challenge ID for the same user and date', () => {
    const userId = 'test-user-2';
    const date = '2023-01-02';
    
    // First call should create a challenge
    const challengeId1 = generateDailyChallenge(userId, date);
    
    // Second call should return the existing challenge
    const challengeId2 = generateDailyChallenge(userId, date);
    
    expect(challengeId1).toBe(challengeId2);
    expect(createUserChallenge).toHaveBeenCalledTimes(1);
  });

  it('should generate different challenges for different dates', () => {
    const userId = 'test-user-3';
    const date1 = '2023-01-03';
    const date2 = '2023-01-04';
    
    const challengeId1 = generateDailyChallenge(userId, date1);
    const challengeId2 = generateDailyChallenge(userId, date2);
    
    expect(challengeId1).not.toBe(challengeId2);
    expect(createUserChallenge).toHaveBeenCalledTimes(2);
  });

  it('should generate today\'s challenge', () => {
    const userId = 'test-user-7';
    const today = new Date().toISOString().split('T')[0];
    
    const challengeId = getTodaysChallengeId(userId);
    expect(challengeId).toBeDefined();
    
    expect(createUserChallenge).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      today
    );
  });

  it('should generate upcoming challenges', () => {
    const userId = 'test-user-8';
    const days = 5;
    
    const challengeIds = getUpcomingChallenges(userId, days);
    expect(challengeIds).toHaveLength(days);
    
    expect(createUserChallenge).toHaveBeenCalledTimes(days);
  });
});