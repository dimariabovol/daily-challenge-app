import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from './index';

/**
 * Interface for the authenticated user information
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Type for the request with authenticated user
 */
export type AuthenticatedRequest = NextRequest & {
  user: AuthUser;
};

/**
 * Middleware to protect API routes with JWT authentication
 * 
 * @param handler The route handler function
 * @returns A new handler function that includes authentication
 */
export function withAuth<T>(
  handler: (req: AuthenticatedRequest, ...args: unknown[]) => Promise<T>
): (req: NextRequest, ...args: unknown[]) => Promise<T | NextResponse> {
  return async (req: NextRequest, ...args: unknown[]) => {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Add user to request object
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = {
      id: decoded.sub,
      email: decoded.email
    };
    
    // Call the original handler with the authenticated request
    return handler(authenticatedReq, ...args);
  };
}

/**
 * Helper function to create a protected API route
 * 
 * @param methods Allowed HTTP methods
 * @param handler Route handler function
 * @returns Object with handler functions for each allowed method
 */
export function createProtectedRoute(
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[],
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Record<string, (req: NextRequest) => Promise<NextResponse>> {
  const protectedHandler = withAuth(handler);
  
  const routeHandlers: Record<string, (req: NextRequest) => Promise<NextResponse>> = {};
  
  methods.forEach(method => {
    routeHandlers[method] = protectedHandler;
  });
  
  return routeHandlers;
}