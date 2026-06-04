// Matching Algorithm for Communium
// This algorithm matches users based on interests, skills, and goals

export interface UserProfile {
  id: number;
  role: 'VIP' | 'Regular' | 'Youth';
  interests: string[];
  skills: string[];
  goals: string[];
  availability: number; // 0-100 score
}

export interface MatchResult {
  userId: number;
  matchScore: number;
  commonInterests: string[];
  commonSkills: string[];
  commonGoals: string[];
}

/**
 * Calculate compatibility score between two users
 * Score ranges from 0 to 100
 */
function calculateCompatibilityScore(user1: UserProfile, user2: UserProfile): number {
  if (user1.id === user2.id) return 0;

  let score = 0;
  let weightedComponents = 0;

  // Interest matching (40% weight)
  const commonInterests = user1.interests.filter((interest) =>
    user2.interests.includes(interest)
  );
  const interestScore =
    (commonInterests.length / Math.max(user1.interests.length, user2.interests.length)) * 100 || 0;
  score += interestScore * 0.4;
  weightedComponents += 0.4;

  // Skills matching (30% weight)
  const commonSkills = user1.skills.filter((skill) => user2.skills.includes(skill));
  const skillScore =
    (commonSkills.length / Math.max(user1.skills.length, user2.skills.length)) * 100 || 0;
  score += skillScore * 0.3;
  weightedComponents += 0.3;

  // Goals matching (20% weight)
  const commonGoals = user1.goals.filter((goal) => user2.goals.includes(goal));
  const goalScore =
    (commonGoals.length / Math.max(user1.goals.length, user2.goals.length)) * 100 || 0;
  score += goalScore * 0.2;
  weightedComponents += 0.2;

  // Availability bonus (10% weight)
  const availabilityScore = (user1.availability + user2.availability) / 2;
  score += availabilityScore * 0.1;
  weightedComponents += 0.1;

  // Role matching bonus (VIP gets slight preference)
  if ((user1.role === 'VIP' && user2.role !== 'VIP') || (user1.role !== 'VIP' && user2.role === 'VIP')) {
    score += 5; // Bonus for cross-role matching
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Find best matches for a user
 */
export function findMatches(currentUser: UserProfile, candidates: UserProfile[], limit: number = 10): MatchResult[] {
  const matches = candidates
    .map((candidate) => {
      const score = calculateCompatibilityScore(currentUser, candidate);
      const commonInterests = currentUser.interests.filter((interest) =>
        candidate.interests.includes(interest)
      );
      const commonSkills = currentUser.skills.filter((skill) => candidate.skills.includes(skill));
      const commonGoals = currentUser.goals.filter((goal) => candidate.goals.includes(goal));

      return {
        userId: candidate.id,
        matchScore: score,
        commonInterests,
        commonSkills,
        commonGoals,
      };
    })
    .filter((match) => match.matchScore > 30) // Minimum threshold
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return matches;
}

/**
 * Batch matching - for performance optimization
 */
export function batchFindMatches(users: UserProfile[]): Map<number, MatchResult[]> {
  const results = new Map<number, MatchResult[]>();

  for (const user of users) {
    const otherUsers = users.filter((u) => u.id !== user.id);
    results.set(user.id, findMatches(user, otherUsers));
  }

  return results;
}