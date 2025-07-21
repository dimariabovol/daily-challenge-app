import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '.';

// Define the authenticated request type with user information
export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
  };
}

/**
 * Middleware to protect API routes that require authentication
 * 
 * @param request Next.js request object
 * @returns Response or undefined to continue
 */
export function authMiddleware(request: NextRequest) {
  // Get the Authorization header
  const authHeader = request.headers.get('Authorization');
  
  // Extract token from header
  const token = extractTokenFromHeader(authHeader || '');
  
  // If no token is provided, return 401 Unauthorized
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Verify token
  const payload = verifyToken(token);
  
  // If token is invalid, return 401 Unauthorized
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
  
  // Token is valid, continue to the API route
  // We can also add the user ID to the request for use in the API route
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.sub);
  requestHeaders.set('x-user-email', payload.email);
  
  // Continue to the API route with the modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Helper function to get the user ID from the request headers
 * This is set by the authMiddleware
 * 
 * @param request Next.js request object
 * @returns User ID or null if not authenticated
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

/**
 * Higher-order function to protect API routes that require authentication
 * 
 * @param handler The route handler function
 * @returns A new handler function that checks authentication before calling the original handler
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    
    // Extract token from header
    const token = extractTokenFromHeader(authHeader || '');
    
    // If no token is provided, return 401 Unauthorized
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify token
    const payload = verifyToken(token);
    
    // If token is invalid, return 401 Unauthorized
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Add user information to the request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = {
      id: payload.sub,
      email: payload.email
    };
    
    // Call the original handler with the authenticated request
    return handler(authenticatedReq);
  };
}