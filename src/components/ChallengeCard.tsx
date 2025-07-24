'use client';

import { useState } from 'react';

export interface ChallengeCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Challenge {
  id: string;
  date: string; // YYYY-MM-DD format
  title: string;
  description: string;
  category: ChallengeCategory;
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

interface ChallengeCardProps {
  challenge: Challenge;
  onToggleComplete: (challengeId: string, completed: boolean) => Promise<void>;
  loading?: boolean;
}

// Category color mappings for consistent styling
const categoryStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  fitness: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: '💪'
  },
  creativity: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: '🎨'
  },
  learning: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: '📚'
  },
  productivity: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    icon: '⚡'
  },
  mindfulness: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: '🧘'
  },
  social: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    icon: '👥'
  }
};

export default function ChallengeCard({ challenge, onToggleComplete, loading = false }: ChallengeCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  
  const categoryStyle = categoryStyles[challenge.category.id.toLowerCase()] || categoryStyles.learning;
  const categoryIcon = challenge.category.icon || categoryStyle.icon;

  const handleToggleComplete = async () => {
    if (isToggling || loading) return;
    
    setIsToggling(true);
    try {
      await onToggleComplete(challenge.id, !challenge.completed);
    } catch (error) {
      console.error('Failed to toggle challenge completion:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCompletedTime = (completedAt?: string) => {
    if (!completedAt) return null;
    const date = new Date(completedAt);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`
      relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md
      ${challenge.completed 
        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' 
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }
    `}>
      {/* Completion indicator */}
      {challenge.completed && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <div className="p-6">
        {/* Header with category and date */}
        <div className="flex items-center justify-between mb-4">
          <div className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
            ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}
          `}>
            <span className="mr-2 text-base">{categoryIcon}</span>
            {challenge.category.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(challenge.date)}
          </div>
        </div>

        {/* Challenge content */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            {challenge.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Completion status and action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {challenge.completed ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Completed</span>
                {challenge.completedAt && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    at {formatCompletedTime(challenge.completedAt)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                </svg>
                <span>Not completed</span>
              </div>
            )}
          </div>

          {/* Toggle button */}
          <button
            onClick={handleToggleComplete}
            disabled={isToggling || loading}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${challenge.completed
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 focus:ring-gray-500'
                : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 focus:ring-blue-500'
              }
              ${(isToggling || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {isToggling ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {challenge.completed ? 'Unmarking...' : 'Marking...'}
              </div>
            ) : (
              challenge.completed ? 'Mark as Incomplete' : 'Mark as Complete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}