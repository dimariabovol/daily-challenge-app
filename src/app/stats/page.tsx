'use client';

import { useAuth } from '@/lib/auth';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Your Statistics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Track your progress and see how you&apos;re doing with your daily challenges.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <p className="text-gray-500 dark:text-gray-400">
            Statistics will be implemented in a future task.
          </p>
        </div>
      </div>
    </Layout>
  );
}