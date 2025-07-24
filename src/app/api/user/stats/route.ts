import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getUserStats } from '@/lib/db/statistics';

/**
 * GET /api/user/stats
 * Get user statistics including streaks and completion rate
 */
async function getStats(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const userId = req.user.id;
    
    // Get user statistics
    const stats = getUserStats(userId);
    
    return NextResponse.json({
      stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}

// Export the protected GET handler
export const GET = withAuth(getStats);