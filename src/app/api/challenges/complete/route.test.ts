import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST, DELETE } from './route';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import * as challengesDb from '@/lib/db/challenges';

// Mock the auth middleware
vi.mock('@/lib/auth/middleware', () => ({
  withAuth: (handler: Function) => handler,
  AuthenticatedRequest: NextRequest
}));

// Mock the challenges database module
vi.mock('@/lib/db/challenges', () => ({
  getUserChallengeById: vi.fn(),
  completeUserChallenge: vi.fn(),
  uncompleteUserChallenge: vi.fn(),
  getChallengeTemplateById: vi.fn(),
  getCategoryById: vi.fn()
}));

describe('Challenge Completion API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockChallenge = {
    id: 'challenge-123',
    user_id: 'user-123',
    template_id: 'template-123',
    date: '2025-07-21',
    completed: 0,
    completed_at: undefined,
    created_at: '2025-07-21T00:00:00.000Z'
  };

  const mockCompletedChallenge = {
    ...mockChallenge,
    completed: 1,
    completed_at: '2025-07-21T12:00:00.000Z'
  };

  const mockTemplate = {
    id: 'template-123',
    title: 'Test Challenge',
    description: 'This is a test challenge',
    category_id: 'category-123',
    created_at: '2025-01-01T00:00:00.000Z'
  };

  const mockCategory = {
    id: 'category-123',
    name: 'Test Category',
    color: '#FF0000',
    icon: 'test-icon'
  };

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

  describe('POST /api/challenges/complete', () => {
    it('should return 400 if challenge ID is missing', async () => {
      // Create a mock request with empty body
      const request = new NextRequest('http://localhost/api/challenges/complete', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      // Add user to request
      (request as any).user = mockUser;

      const response = await POST(request as any);
      const responseData = await (response as any).json();

      expect(responseData).toEqual({ error: 'Challenge ID is required' });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    });

    it('should return 404 if challenge is not found', async () => {
      // Mock getUserChallengeById to return undefined
      vi.mocked(challengesDb.getUserChallengeById).mockReturnValue(undefined);

      // Create a mock request with challenge ID
      const request = new NextRequest('http://localhost/api/challenges/complete', {
        method: 'POST',
        body: JSON.stringify({ challengeId: 'challenge-123' }),
      });
      
      // Add user to request
      (request as any).user = mockUser;

      const response = await POST(request as any);
      const responseData = await (response as any).json();

      expect(responseData).toEqual({ error: 'Challenge not found' });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Challenge not found' },
        { status: 404 }
      );
      expect(challengesDb.getUserChallengeById).toHaveBeenCalledWith('challenge-123');
    });

    it('should return 403 if challenge belongs to another user', async () => {
      // Mock getUserChallengeById to return a challenge with different user ID
      vi.mocked(challengesDb.getUserChallengeById).mockReturnValue({
        ...mockChallenge,
        user_id: 'another-user',
        completed_at: undefined
      });

      // Create a mock request with challenge ID
      const request = new NextRequest('http://localhost/api/challenges/complete', {
        method: 'POST',
        body: JSON.stringify({ challengeId: 'challenge-123' }),
      });
      
      // Add user to request
      (request as any).user = mockUser;

      const response = await POST(request as any);
      const responseData = await (response as any).json();

      expect(responseData).toEqual({ error: 'Unauthorized access to this challenge' });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized access to this challenge' },
        { status: 403 }
      );
    });

    it('should complete the challenge and return the updated challenge', async () => {
      // Mock database functions
      vi.mocked(challengesDb.getUserChallengeById).mockReturnValue(mockChallenge);
      vi.mocked(challengesDb.completeUserChallenge).mockReturnValue(mockCompletedChallenge);
      vi.mocked(challengesDb.getChallengeTemplateById).mockReturnValue(mockTemplate);
      vi.mocked(challengesDb.getCategoryById).mockReturnValue(mockCategory);

      // Create a mock request with challenge ID
      const request = new NextRequest('http://localhost/api/challenges/complete', {
        method: 'POST',
        body: JSON.stringify({ challengeId: 'challenge-123' }),
      });
      
      // Add user to request
      (request as any).user = mockUser;

      const response = await POST(request as any);
      const responseData = await (response as any).json();

      expect(challengesDb.getUserChallengeById).toHaveBeenCalledWith('challenge-123');
      expect(challengesDb.completeUserChallenge).toHaveBeenCalledWith('challenge-123');
      expect(challengesDb.getChallengeTemplateById).toHaveBeenCalledWith('template-123');
      expect(challengesDb.getCategoryById).toHaveBeenCalledWith('category-123');
      
      expect(responseData).toEqual({
        id: 'challenge-123',
        date: '2025-07-21',
        title: 'Test Challenge',
        description: 'This is a test challenge',
        completed: true,
        completed_at: '2025-07-21T12:00:00.000Z',
        created_at: '2025-07-21T00:00:00.000Z',
        category: {
          id: 'category-123',
          name: 'Test Category',
          color: '#FF0000',
          icon: 'test-icon'
        }
      });
    });
  });

  describe('DELETE /api/challenges/complete', () => {
    it('should return 400 if challenge ID is missing', async () => {
      // Create a mock request with empty body
      const request = new NextRequest('http://localhost/api/challenges/complete', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });
      
      // Add user to request
      (request as any).user = mockUser;

      const response = await DELETE(request as any);
      const responseData = await (response as any).json();

      expect(responseData).toEqual({ error: 'Challenge ID is required' });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    });

    it('should return 404 if challenge is not found', async () => {
      // Mock getUserChallengeById to return undefined
      vi.mocked(challengesDb.getUserChallengeById).mockReturnValue(undefined);

      // Create a mock request with challenge ID
      const request = new NextRequest('http://localhost/api/challenges/complete', {
        method: 'DELETE',
        body: JSON.stringify({ challengeId: 'challenge-123' }),
      });
      
      // Add user to request
      (request as any).user = mockUser;

      const response = await DELETE(request as any);
      const responseData = await (response as any).json();

      expect(responseData).toEqual({ error: 'Challenge not found' });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Challenge not found' },
        { status: 404 }
      );
      expect(challengesDb.getUserChallengeById).toHaveBeenCalledWith('challenge-123');
    });

    it('should return 403 if challenge belongs to another user', async () => {
      // Mock getUserChallengeById to return a challenge with different user ID
      vi.mocked(challengesDb.getUserChallengeById).mockReturnValue({
        ...mockChallenge,
        user_id: 'another-user',
        completed_at: undefined
      });

      // Create a mock request with challenge ID
      const request = new NextRequest('http://localhost/api/challenges/complete', {
        method: 'DELETE',
        body: JSON.stringify({ challengeId: 'challenge-123' }),
      });
      
      // Add user to request
      (request as any).user = mockUser;

      const response = await DELETE(request as any);
      const responseData = await (response as any).json();

      expect(responseData).toEqual({ error: 'Unauthorized access to this challenge' });
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized access to this challenge' },
        { status: 403 }
      );
    });

    it('should uncomplete the challenge and return the updated challenge', async () => {
      // Mock database functions
      vi.mocked(challengesDb.getUserChallengeById).mockReturnValue(mockCompletedChallenge);
      vi.mocked(challengesDb.uncompleteUserChallenge).mockReturnValue(mockChallenge);
      vi.mocked(challengesDb.getChallengeTemplateById).mockReturnValue(mockTemplate);
      vi.mocked(challengesDb.getCategoryById).mockReturnValue(mockCategory);

      // Create a mock request with challenge ID
      const request = new NextRequest('http://localhost/api/challenges/complete', {
        method: 'DELETE',
        body: JSON.stringify({ challengeId: 'challenge-123' }),
      });
      
      // Add user to request
      (request as any).user = mockUser;

      const response = await DELETE(request as any);
      const responseData = await (response as any).json();

      expect(challengesDb.getUserChallengeById).toHaveBeenCalledWith('challenge-123');
      expect(challengesDb.uncompleteUserChallenge).toHaveBeenCalledWith('challenge-123');
      expect(challengesDb.getChallengeTemplateById).toHaveBeenCalledWith('template-123');
      expect(challengesDb.getCategoryById).toHaveBeenCalledWith('category-123');
      
      expect(responseData).toEqual({
        id: 'challenge-123',
        date: '2025-07-21',
        title: 'Test Challenge',
        description: 'This is a test challenge',
        completed: false,
        completed_at: null,
        created_at: '2025-07-21T00:00:00.000Z',
        category: {
          id: 'category-123',
          name: 'Test Category',
          color: '#FF0000',
          icon: 'test-icon'
        }
      });
    });
  });
});