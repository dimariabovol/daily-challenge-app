'use client';

import { useAuth } from '@/lib/auth';
import Layout from '@/components/Layout';
import ChallengeCard, { Challenge } from '@/components/ChallengeCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';
import { apiService } from '@/lib/api';

// SWR fetcher function for today's challenge
const fetchTodaysChallenge = async (): Promise<Challenge> => {
  return apiService.fetchTodaysChallenge();
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // SWR hook for fetching today's challenge
  const {
    data: challenge,
    error,
    isLoading: challengeLoading,
    mutate
  } = useSWR(
    user ? 'todays-challenge' : null, // Only fetch if user is authenticated
    fetchTodaysChallenge,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Handle challenge completion toggle
  const handleToggleComplete = async (challengeId: string, completed: boolean): Promise<void> => {
    try {
      let updatedChallenge: Challenge;
      
      if (completed) {
        updatedChallenge = await apiService.completeChallenge(challengeId);
      } else {
        updatedChallenge = await apiService.uncompleteChallenge(challengeId);
      }
      
      // Update the SWR cache with the new data
      mutate(updatedChallenge, false);
    } catch (error) {
      console.error('Failed to toggle challenge completion:', error);
      throw error; // Re-throw to let the component handle the error
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

  // If user is not authenticated, show a message (they will be redirected)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium mb-2">Please log in</div>
          <div className="text-sm text-gray-500 mb-4">You need to be logged in to view this page</div>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show the main content
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Today&apos;s Challenge
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ready to take on today&apos;s challenge? Let&apos;s make it count!
          </p>
        </div>

        {/* Loading state */}
        {challengeLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !challengeLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Failed to load today&apos;s challenge
              </h3>
            </div>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error.message || 'Something went wrong while fetching your challenge.'}
            </p>
            <button
              onClick={() => mutate()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Challenge content */}
        {challenge && !challengeLoading && (
          <ChallengeCard
            challenge={challenge}
            onToggleComplete={handleToggleComplete}
            loading={false}
          />
        )}

        {/* Quick navigation */}
        {challenge && (
          <div className="mt-8 text-center">
            <div className="flex justify-center space-x-4">
              <Link
                href="/history"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                View History
              </Link>
              <Link
                href="/stats"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                View Stats
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
