import { Challenge } from '@/components/ChallengeCard';

// API response types (for future use)
// interface ApiResponse<T> {
//   data?: T;
//   error?: string;
// }

interface TodaysChallengeResponse {
  id: string;
  date: string;
  title: string;
  description: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

interface ChallengeHistoryResponse {
  challenges: Challenge[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface ChallengeHistoryApiResponse {
  challenges: TodaysChallengeResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface UserStats {
  totalChallenges: number;
  completedChallenges: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

interface UserStatsResponse {
  stats: UserStats;
}

// Convert API response to Challenge interface
function transformChallengeResponse(response: TodaysChallengeResponse): Challenge {
  return {
    id: response.id,
    date: response.date,
    title: response.title,
    description: response.description,
    completed: response.completed,
    completedAt: response.completed_at,
    category: response.category
  };
}

// Get JWT token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;
  
  try {
    const user = JSON.parse(storedUser);
    return user.token || null;
  } catch {
    // If parsing fails, remove the invalid data
    localStorage.removeItem('user');
    return null;
  }
}

// Create authenticated fetch wrapper
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle authentication errors
  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Authentication required');
  }

  return response;
}

// API service functions
export const apiService = {
  // Fetch today's challenge
  async fetchTodaysChallenge(): Promise<Challenge> {
    const response = await authenticatedFetch('/api/challenges/today');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: TodaysChallengeResponse = await response.json();
    return transformChallengeResponse(data);
  },

  // Complete a challenge
  async completeChallenge(challengeId: string): Promise<Challenge> {
    const response = await authenticatedFetch('/api/challenges/complete', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: TodaysChallengeResponse = await response.json();
    return transformChallengeResponse(data);
  },

  // Uncomplete a challenge
  async uncompleteChallenge(challengeId: string): Promise<Challenge> {
    const response = await authenticatedFetch('/api/challenges/complete', {
      method: 'DELETE',
      body: JSON.stringify({ challengeId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: TodaysChallengeResponse = await response.json();
    return transformChallengeResponse(data);
  },

  // Fetch challenge history with pagination and filtering
  async fetchChallengeHistory(page: number = 1, limit: number = 20, completed?: boolean): Promise<ChallengeHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (completed !== undefined) {
      params.append('completed', completed.toString());
    }
    
    const response = await authenticatedFetch(`/api/challenges/history?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: ChallengeHistoryApiResponse = await response.json();
    
    // Transform challenges to match the Challenge interface
    return {
      challenges: data.challenges.map(transformChallengeResponse),
      pagination: data.pagination
    };
  },

  // Fetch user statistics
  async fetchUserStats(): Promise<UserStats> {
    const response = await authenticatedFetch('/api/user/stats');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: UserStatsResponse = await response.json();
    return data.stats;
  },
};

// SWR fetcher function
export const fetcher = (_url: string) => apiService.fetchTodaysChallenge();