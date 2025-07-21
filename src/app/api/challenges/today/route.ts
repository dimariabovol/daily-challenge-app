import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getTodaysChallengeId } from '@/lib/db/challenge-generator';
import { getUserChallengeById, getChallengeTemplateById, getCategoryById } from '@/lib/db/challenges';

/**
 * GET /api/challenges/today
 * Get today's challenge for the authenticated user
 * If no challenge exists for today, one will be generated
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = request.user.id;
    
    // Generate or get today's challenge ID
    const challengeId = getTodaysChallengeId(userId);
    
    // Get the challenge details
    const challenge = getUserChallengeById(challengeId);
    
    if (!challenge) {
      return NextResponse.json(
        { error: 'Failed to retrieve challenge' },
        { status: 500 }
      );
    }
    
    // Get the challenge template
    const template = getChallengeTemplateById(challenge.template_id);
    
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
    
    // Return the challenge with template and category information
    return NextResponse.json({
      id: challenge.id,
      date: challenge.date,
      title: template.title,
      description: template.description,
      completed: challenge.completed === 1,
      completed_at: challenge.completed_at,
      created_at: challenge.created_at,
      category: {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon
      }
    });
  } catch (error) {
    console.error('Error getting today\'s challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});