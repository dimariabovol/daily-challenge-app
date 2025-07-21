import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { 
  completeUserChallenge, 
  uncompleteUserChallenge, 
  getUserChallengeById,
  getChallengeTemplateById,
  getCategoryById
} from '@/lib/db/challenges';

/**
 * POST /api/challenges/complete
 * Mark a challenge as completed for the authenticated user
 */
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Parse the request body to get the challenge ID
    const body = await request.json();
    const { challengeId } = body;
    
    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }
    
    // Get the challenge to verify it exists and belongs to the user
    const existingChallenge = getUserChallengeById(challengeId);
    
    if (!existingChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }
    
    // Verify the challenge belongs to the authenticated user
    if (existingChallenge.user_id !== request.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to this challenge' },
        { status: 403 }
      );
    }
    
    // Mark the challenge as completed
    const updatedChallenge = completeUserChallenge(challengeId);
    
    if (!updatedChallenge) {
      return NextResponse.json(
        { error: 'Failed to complete challenge' },
        { status: 500 }
      );
    }
    
    // Get the challenge template
    const template = getChallengeTemplateById(updatedChallenge.template_id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Challenge template not found' },
        { status: 500 }
      );
    }
    
    // Get the category
    const category = getCategoryById(template.category_id);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 500 }
      );
    }
    
    // Return the updated challenge with template and category information
    return NextResponse.json({
      id: updatedChallenge.id,
      date: updatedChallenge.date,
      title: template.title,
      description: template.description,
      completed: updatedChallenge.completed === 1,
      completed_at: updatedChallenge.completed === 1 ? updatedChallenge.completed_at : null,
      created_at: updatedChallenge.created_at,
      category: {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon
      }
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/challenges/complete
 * Unmark a challenge as completed for the authenticated user
 */
export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Parse the request body to get the challenge ID
    const body = await request.json();
    const { challengeId } = body;
    
    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      );
    }
    
    // Get the challenge to verify it exists and belongs to the user
    const existingChallenge = getUserChallengeById(challengeId);
    
    if (!existingChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }
    
    // Verify the challenge belongs to the authenticated user
    if (existingChallenge.user_id !== request.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to this challenge' },
        { status: 403 }
      );
    }
    
    // Unmark the challenge as completed
    const updatedChallenge = uncompleteUserChallenge(challengeId);
    
    if (!updatedChallenge) {
      return NextResponse.json(
        { error: 'Failed to uncomplete challenge' },
        { status: 500 }
      );
    }
    
    // Get the challenge template
    const template = getChallengeTemplateById(updatedChallenge.template_id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Challenge template not found' },
        { status: 500 }
      );
    }
    
    // Get the category
    const category = getCategoryById(template.category_id);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 500 }
      );
    }
    
    // Return the updated challenge with template and category information
    return NextResponse.json({
      id: updatedChallenge.id,
      date: updatedChallenge.date,
      title: template.title,
      description: template.description,
      completed: updatedChallenge.completed === 1,
      completed_at: updatedChallenge.completed === 1 ? updatedChallenge.completed_at : null,
      created_at: updatedChallenge.created_at,
      category: {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon
      }
    });
  } catch (error) {
    console.error('Error uncompleting challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});