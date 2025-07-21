import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';

/**
 * GET /api/auth/test
 * Protected route that returns the authenticated user's information
 */
async function handler(req: AuthenticatedRequest) {
  // The user object is available because of the withAuth middleware
  const { id, email } = req.user;
  
  return NextResponse.json({
    message: 'Authentication successful',
    user: {
      id,
      email
    }
  });
}

// Export the protected route handler
export const GET = withAuth(handler);