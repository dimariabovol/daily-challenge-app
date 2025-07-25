'use client';

import { useAuth } from '@/lib/auth';
import Layout from '@/components/Layout';
import ChallengeCard, { Challenge } from '@/components/ChallengeCard';
import { apiService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface ChallengeHistoryData {
  challenges: Challenge[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [historyData, setHistoryData] = useState<ChallengeHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [completedFilter, setCompletedFilter] = useState<boolean | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch challenge history
  const fetchHistory = useCallback(async (page: number = 1, completed?: boolean, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const data = await apiService.fetchChallengeHistory(page, 20, completed);
      
      if (append) {
        setHistoryData(prevData => {
          if (prevData) {
            return {
              challenges: [...prevData.challenges, ...data.challenges],
              pagination: data.pagination
            };
          }
          return data;
        });
      } else {
        setHistoryData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenge history');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []); // Remove historyData dependency

  // Load initial data when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      fetchHistory(1, completedFilter);
    }
  }, [user, loading, completedFilter, fetchHistory]);

  // Handle filter change
  const handleFilterChange = (completed?: boolean) => {
    setCompletedFilter(completed);
    setCurrentPage(1);
    setHistoryData(null);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (historyData?.pagination.hasMore && !isLoadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchHistory(nextPage, completedFilter, true);
    }
  };

  // Handle challenge completion toggle
  const handleToggleComplete = async (challengeId: string, completed: boolean) => {
    try {
      if (completed) {
        await apiService.completeChallenge(challengeId);
      } else {
        await apiService.uncompleteChallenge(challengeId);
      }
      
      // Update the challenge in the local state
      if (historyData) {
        const updatedChallenges = historyData.challenges.map(challenge =>
          challenge.id === challengeId
            ? { ...challenge, completed, completedAt: completed ? new Date().toISOString() : undefined }
            : challenge
        );
        setHistoryData({
          ...historyData,
          challenges: updatedChallenges
        });
      }
    } catch (error) {
      console.error('Failed to toggle challenge completion:', error);
      throw error;
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium mb-2">Loading...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render anything (they will be redirected)
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Challenge History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your past challenges and track your progress over time.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handleFilterChange(undefined)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                completedFilter === undefined
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All Challenges
            </button>
            <button
              onClick={() => handleFilterChange(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                completedFilter === true
                  ? 'bg-green-600 text-white dark:bg-green-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => handleFilterChange(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                completedFilter === false
                  ? 'bg-orange-600 text-white dark:bg-orange-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Not Completed
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading your challenge history...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                Failed to load challenge history
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => fetchHistory(1, completedFilter)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && historyData && historyData.challenges.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {completedFilter === true ? 'No completed challenges yet' :
                 completedFilter === false ? 'No incomplete challenges' :
                 'No challenge history yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {completedFilter === true ? 'Complete some challenges to see them here.' :
                 completedFilter === false ? 'All your challenges have been completed!' :
                 'Start completing daily challenges to build your history.'}
              </p>
              {completedFilter !== undefined && (
                <button
                  onClick={() => handleFilterChange(undefined)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  View all challenges
                </button>
              )}
            </div>
          </div>
        )}

        {/* Challenge List */}
        {!isLoading && !error && historyData && historyData.challenges.length > 0 && (
          <div className="space-y-6">
            {/* Results summary */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Showing {historyData.challenges.length} of {historyData.pagination.total} challenges
              {completedFilter === true && ' (completed only)'}
              {completedFilter === false && ' (not completed only)'}
            </div>

            {/* Challenge cards */}
            <div className="space-y-4">
              {historyData.challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>

            {/* Load More Button */}
            {historyData.pagination.hasMore && (
              <div className="text-center pt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading more...
                    </div>
                  ) : (
                    'Load More Challenges'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}