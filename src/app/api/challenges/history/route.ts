import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getUserChallengeHistory, countUserChallenges } from '@/lib/db/challenges';

/**
 * GET /api/challenges/history
 * Get challenge history for the authenticated user with pagination and filtering
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Number of challenges per page (default: 20, max: 100)
 * - completed: Filter by completion status (true/false, optional)
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.user.id;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const completedParam = searchParams.get('completed');
    
    // Parse completed filter
    let completed: boolean | undefined;
    if (completedParam === 'true') {
      completed = true;
    } else if (completedParam === 'false') {
      completed = false;
    }
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Get challenge history
    const challenges = getUserChallengeHistory(userId, limit, offset, completed);
    
    // Get total count for pagination
    const totalCount = countUserChallenges(userId, completed);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;
    
    return NextResponse.json({
      challenges,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error getting challenge history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});