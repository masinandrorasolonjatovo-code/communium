// Unit tests for matching algorithm
import { findMatches, batchFindMatches, UserProfile } from '../src/matching';

describe('Matching Algorithm - Unit Tests', () => {
  const mockUsers: UserProfile[] = [
    {
      id: 1,
      role: 'VIP',
      interests: ['coding', 'AI', 'blockchain'],
      skills: ['JavaScript', 'Python', 'Solidity'],
      goals: ['startup', 'innovation'],
      availability: 80,
    },
    {
      id: 2,
      role: 'Regular',
      interests: ['coding', 'web', 'blockchain'],
      skills: ['JavaScript', 'React', 'Node.js'],
      goals: ['startup', 'learning'],
      availability: 70,
    },
    {
      id: 3,
      role: 'Youth',
      interests: ['AI', 'machine-learning', 'data'],
      skills: ['Python', 'TensorFlow', 'SQL'],
      goals: ['learning', 'research'],
      availability: 60,
    },
    {
      id: 4,
      role: 'Regular',
      interests: ['marketing', 'sales', 'business'],
      skills: ['Excel', 'Salesforce', 'Analytics'],
      goals: ['entrepreneurship', 'growth'],
      availability: 85,
    },
  ];

  describe('findMatches', () => {
    test('should find matches for a user', () => {
      const user = mockUsers[0];
      const candidates = mockUsers.slice(1);

      const matches = findMatches(user, candidates);

      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.length).toBeLessThanOrEqual(10);
    });

    test('should return matches sorted by score (highest first)', () => {
      const user = mockUsers[0];
      const candidates = mockUsers.slice(1);

      const matches = findMatches(user, candidates);

      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].matchScore).toBeGreaterThanOrEqual(matches[i + 1].matchScore);
      }
    });

    test('should filter matches by minimum threshold', () => {
      const user = mockUsers[0];
      const candidates = mockUsers.slice(1);

      const matches = findMatches(user, candidates);

      matches.forEach((match) => {
        expect(match.matchScore).toBeGreaterThan(30);
      });
    });

    test('should find common interests', () => {
      const user = mockUsers[0];
      const candidates = [mockUsers[1]]; // User 1 and 2 share 'coding' and 'blockchain'

      const matches = findMatches(user, candidates);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].commonInterests).toContain('coding');
      expect(matches[0].commonInterests).toContain('blockchain');
    });

    test('should not match same user', () => {
      const user = mockUsers[0];
      const candidates = [mockUsers[0], mockUsers[1]];

      const matches = findMatches(user, candidates);

      expect(matches.every((match) => match.userId !== user.id)).toBe(true);
    });

    test('should respect limit parameter', () => {
      const user = mockUsers[0];
      const candidates = mockUsers.slice(1);

      const matches = findMatches(user, candidates, 2);

      expect(matches.length).toBeLessThanOrEqual(2);
    });

    test('should handle empty candidates', () => {
      const user = mockUsers[0];
      const candidates: UserProfile[] = [];

      const matches = findMatches(user, candidates);

      expect(matches).toEqual([]);
    });

    test('should calculate scores between 0 and 100', () => {
      const user = mockUsers[0];
      const candidates = mockUsers.slice(1);

      const matches = findMatches(user, candidates);

      matches.forEach((match) => {
        expect(match.matchScore).toBeGreaterThanOrEqual(0);
        expect(match.matchScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('batchFindMatches', () => {
    test('should perform batch matching for all users', () => {
      const results = batchFindMatches(mockUsers);

      expect(results.size).toBe(mockUsers.length);
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(true);
      expect(results.has(3)).toBe(true);
      expect(results.has(4)).toBe(true);
    });

    test('should return matches for each user', () => {
      const results = batchFindMatches(mockUsers);

      results.forEach((matches) => {
        expect(Array.isArray(matches)).toBe(true);
        expect(matches.length).toBeLessThanOrEqual(10);
      });
    });

    test('should not include self-matches in batch results', () => {
      const results = batchFindMatches(mockUsers);

      results.forEach((matches, userId) => {
        matches.forEach((match) => {
          expect(match.userId).not.toBe(userId);
        });
      });
    });
  });

  describe('Performance', () => {
    test('should find matches for 100 users in less than 500ms', () => {
      const largeUserSet: UserProfile[] = [];
      for (let i = 0; i < 100; i++) {
        largeUserSet.push({
          id: i,
          role: ['VIP', 'Regular', 'Youth'][i % 3] as 'VIP' | 'Regular' | 'Youth',
          interests: ['coding', 'AI', 'blockchain', 'web', 'mobile'].slice(0, (i % 4) + 1),
          skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'].slice(0, (i % 5) + 1),
          goals: ['startup', 'learning', 'innovation'].slice(0, (i % 3) + 1),
          availability: (i % 100) + 1,
        });
      }

      const startTime = performance.now();
      const results = batchFindMatches(largeUserSet);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
      expect(results.size).toBe(100);
    });
  });
});
