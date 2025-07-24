import { getMany } from './index';
import { getUserChallengeHistory, countUserChallenges } from './challenges';

/**
 * User statistics interface
 */
export interface UserStats {
  totalChallenges: number;
  completedChallenges: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

/**
 * Calculate a user's current streak
 * @param userId User ID
 * @returns Current streak count
 */
export function calculateCurrentStreak(userId: string): number {
  // Get the user's challenge history, ordered by date descending
  const challenges = getUserChallengeHistory(userId, 100, 0);

  // If no challenges, return 0
  if (challenges.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert today to YYYY-MM-DD format for comparison (using local timezone)
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  // Check if the most recent challenge is from today and is completed
  const mostRecent = challenges[0];
  if (mostRecent.date !== todayStr && mostRecent.completed) {
    // The most recent challenge is from a previous day and is completed
    // Start counting from that day
    let currentDate = new Date(mostRecent.date);

    for (const challenge of challenges) {
      const challengeDate = new Date(challenge.date);
      challengeDate.setHours(0, 0, 0, 0);

      // Check if this challenge is from the expected date and is completed
      if (
        challengeDate.getTime() === currentDate.getTime() &&
        challenge.completed
      ) {
        streak++;

        // Move to the previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (
        challengeDate.getTime() === currentDate.getTime() &&
        !challenge.completed
      ) {
        // Challenge exists for this day but is not completed, break the streak
        break;
      } else if (challengeDate.getTime() < currentDate.getTime()) {
        // There's a gap in the dates, break the streak
        break;
      }
      // If the challenge date is greater than current date, continue to the next challenge
    }
  } else if (mostRecent.date === todayStr && mostRecent.completed) {
    // Today's challenge is completed, start the streak from today
    streak = 1;

    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - 1);

    // Skip the first challenge (today's) and check previous days
    for (let i = 1; i < challenges.length; i++) {
      const challenge = challenges[i];
      const challengeDate = new Date(challenge.date);
      challengeDate.setHours(0, 0, 0, 0);

      // Check if this challenge is from the expected date and is completed
      if (
        challengeDate.getTime() === currentDate.getTime() &&
        challenge.completed
      ) {
        streak++;

        // Move to the previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (
        challengeDate.getTime() === currentDate.getTime() &&
        !challenge.completed
      ) {
        // Challenge exists for this day but is not completed, break the streak
        break;
      } else if (challengeDate.getTime() < currentDate.getTime()) {
        // There's a gap in the dates, break the streak
        break;
      }
      // If the challenge date is greater than current date, continue to the next challenge
    }
  }

  return streak;
}

/**
 * Calculate a user's longest streak
 * @param userId User ID
 * @returns Longest streak count
 */
export function calculateLongestStreak(userId: string): number {
  // Get all of the user's challenges, ordered by date
  const challenges = getMany<{ date: string; completed: number }>(`
    SELECT date, completed
    FROM user_challenges
    WHERE user_id = ?
    ORDER BY date ASC
  `, userId);

  if (challenges.length === 0) {
    return 0;
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let previousDate: Date | null = null;

  for (const challenge of challenges) {
    const challengeDate = new Date(challenge.date);
    challengeDate.setHours(0, 0, 0, 0);

    // If the challenge is completed
    if (challenge.completed) {
      // If this is the first challenge or there's no gap in dates
      if (
        previousDate === null ||
        (previousDate.getTime() === challengeDate.getTime() - 86400000) // 1 day in milliseconds
      ) {
        currentStreak++;
      } else {
        // There's a gap, reset the streak
        currentStreak = 1;
      }

      // Update the longest streak if the current streak is longer
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      // Update the previous date
      previousDate = challengeDate;
    } else {
      // Challenge not completed, reset the streak
      currentStreak = 0;
      previousDate = null;
    }
  }

  return longestStreak;
}

/**
 * Calculate a user's completion rate
 * @param userId User ID
 * @returns Completion rate as a percentage (0-100)
 */
export function calculateCompletionRate(userId: string): number {
  const totalChallenges = countUserChallenges(userId);

  if (totalChallenges === 0) {
    return 0;
  }

  const completedChallenges = countUserChallenges(userId, true);

  return Math.round((completedChallenges / totalChallenges) * 100);
}

/**
 * Get a user's statistics
 * @param userId User ID
 * @returns User statistics object
 */
export function getUserStats(userId: string): UserStats {
  const totalChallenges = countUserChallenges(userId);
  const completedChallenges = countUserChallenges(userId, true);
  const currentStreak = calculateCurrentStreak(userId);
  const longestStreak = calculateLongestStreak(userId);
  const completionRate = totalChallenges > 0
    ? Math.round((completedChallenges / totalChallenges) * 100)
    : 0;

  return {
    totalChallenges,
    completedChallenges,
    currentStreak,
    longestStreak,
    completionRate
  };
}