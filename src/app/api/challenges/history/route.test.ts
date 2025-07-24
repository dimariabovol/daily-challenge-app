import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import * as challengesDb from '@/lib/db/challenges';

// Mock the auth middleware
vi.mock('@/lib/auth/middleware', () => ({
  withAuth: (handler: Function) => handler,
  AuthenticatedRequest: NextRequest
}));

// Mock the challenges database module
vi.mock('@/lib/db/challenges', () => ({
  getUserChallengeHistory: vi.fn(),
  countUserChallenges: vi.fn()
}));

describe('Challenge History API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockChallenges = [
    {
      id: 'challenge-1',
      date: '2025-07-21',
      title: 'Test Challenge 1',
      description: 'This is test challenge 1',
      completed: true,
      completed_at: '2025-07-21T12:00:00.000Z',
      created_at: '2025-07-21T00:00:00.000Z',
      category: {
        id: 'category-1',
        name: 'Fitness',
        color: '#FF0000',
        icon: 'fitness-icon'
      }
    },
    {
      id: 'challenge-2',
      date: '2025-07-20',
      title: 'Test Challenge 2',
      description: 'This is test challenge 2',
      completed: false,
      completed_at: undefined,
      created_at: '2025-07-20T00:00:00.000Z',
      category: {
        id: 'category-2',
        name: 'Learning',
        color: '#00FF00',
        icon: 'learning-icon'
      }
    }
  ];

  beforeEach(() => {
    // Setup request object with authenticated user
    vi.spyOn(NextResponse, 'json').mockImplementation((data) => {
      return { json: () => data } as unknown as NextResponse;
    });

    // Reset mocks
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/challenges/history', () => {
    it('should return challenge history with default pagination', async () => {
      // Mock database functions
      vi.mocked(challengesDb.getUserChallengeHistory).mockReturnValue(mockChallenges);
      vi.mocked(challengesDb.countUserChallenges).mockReturnValue(2);

      // Create a mock request
      const request = new NextRequest('http://localhost/api/challenges/history');

      // Add user to request
      (request as any).user = mockUser;

      const response = await GET(request as any);
      const responseData = await (response as any).json();

      expect(challengesDb.getUserChallengeHistory).toHaveBeenCalledWith('user-123', 20, 0, undefined);
      expect(challengesDb.countUserChallenges).toHaveBeenCalledWith('user-123', undefined);

      expect(responseData).toEqual({
        challenges: mockChallenges,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          hasMore: false
        }
      });
    });

    it('should handle pagination parameters', async () => {
      // Mock database functions
      vi.mocked(challengesDb.getUserChallengeHistory).mockReturnValue([mockChallenges[0]]);
      vi.mocked(challengesDb.countUserChallenges).mockReturnValue(25);

      // Create a mock request with pagination parameters
      const request = new NextRequest('http://localhost/api/challenges/history?page=2&limit=10');

      // Add user to request
      (request as any).user = mockUser;

      const response = await GET(request as any);
      const responseData = await (response as any).json();

      expect(challengesDb.getUserChallengeHistory).toHaveBeenCalledWith('user-123', 10, 10, undefined);
      expect(challengesDb.countUserChallenges).toHaveBeenCalledWith('user-123', undefined);

      expect(responseData).toEqual({
        challenges: [mockChallenges[0]],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          hasMore: true
        }
      });
    });

    it('should filter by completed status', async () => {
      // Mock database functions
      const completedChallenges = [mockChallenges[0]];
      vi.mocked(challengesDb.getUserChallengeHistory).mockReturnValue(completedChallenges);
      vi.mocked(challengesDb.countUserChallenges).mockReturnValue(1);

      // Create a mock request with completed filter
      const request = new NextRequest('http://localhost/api/challenges/history?completed=true');

      // Add user to request
      (request as any).user = mockUser;

      const response = await GET(request as any);
      const responseData = await (response as any).json();

      expect(challengesDb.getUserChallengeHistory).toHaveBeenCalledWith('user-123', 20, 0, true);
      expect(challengesDb.countUserChallenges).toHaveBeenCalledWith('user-123', true);

      expect(responseData).toEqual({
        challenges: completedChallenges,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          hasMore: false
        }
      });
    });

    it('should filter by incomplete status', async () => {
      // Mock database functions
      const incompleteChallenges = [mockChallenges[1]];
      vi.mocked(challengesDb.getUserChallengeHistory).mockReturnValue(incompleteChallenges);
      vi.mocked(challengesDb.countUserChallenges).mockReturnValue(1);

      // Create a mock request with completed filter
      const request = new NextRequest('http://localhost/api/challenges/history?completed=false');

      // Add user to request
      (request as any).user = mockUser;

      const response = await GET(request as any);
      const responseData = await (response as any).json();

      expect(challengesDb.getUserChallengeHistory).toHaveBeenCalledWith('user-123', 20, 0, false);
      expect(challengesDb.countUserChallenges).toHaveBeenCalledWith('user-123', false);

      expect(responseData).toEqual({
        challenges: incompleteChallenges,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          hasMore: false
        }
      });
    });

    it('should enforce maximum limit of 100', async () => {
      // Mock database functions
      vi.mocked(challengesDb.getUserChallengeHistory).mockReturnValue([]);
      vi.mocked(challengesDb.countUserChallenges).mockReturnValue(0);

      // Create a mock request with limit > 100
      const request = new NextRequest('http://localhost/api/challenges/history?limit=150');

      // Add user to request
      (request as any).user = mockUser;

      const response = await GET(request as any);
      await (response as any).json();

      expect(challengesDb.getUserChallengeHistory).toHaveBeenCalledWith('user-123', 100, 0, undefined);
    });

    it('should enforce minimum page of 1', async () => {
      // Mock database functions
      vi.mocked(challengesDb.getUserChallengeHistory).mockReturnValue([]);
      vi.mocked(challengesDb.countUserChallenges).mockReturnValue(0);

      // Create a mock request with page < 1
      const request = new NextRequest('http://localhost/api/challenges/history?page=0');

      // Add user to request
      (request as any).user = mockUser;

      const response = await GET(request as any);
      const responseData = await (response as any).json();

      expect(challengesDb.getUserChallengeHistory).toHaveBeenCalledWith('user-123', 20, 0, undefined);
      expect(responseData.pagination.page).toBe(1);
    });

    it('should handle database errors', async () => {
      // Mock database functions to throw error
      vi.mocked(challengesDb.getUserChallengeHistory).mockImplementation(() => {
        throw new Error('Database error');
      });

      // Create a mock request
      const request = new NextRequest('http://localhost/api/challenges/history');

      // Add user to request
      (request as any).user = mockUser;

      const response = await GET(request as any);
      const responseData = await (response as any).json();

      expect(responseData).toEqual({ error: 'Internal server error' });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal server error' },
        { status: 500 }
      );
    });
  });
});