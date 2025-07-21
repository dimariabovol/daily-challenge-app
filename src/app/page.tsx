'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading, logout } = useAuth();
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Daily Challenge App</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              Logged in as <span className="font-medium">{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to Daily Challenge App</h2>
          <p className="mb-6">Your daily challenge will appear here soon!</p>
          <p className="text-sm text-gray-500">
            This is a placeholder for the daily challenge content that will be implemented in future tasks.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Daily Challenge App
        </div>
      </footer>
    </div>
  );
}
