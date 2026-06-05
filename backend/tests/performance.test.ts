// Performance benchmark tests
// Measures execution time of critical functions

import { findMatches, batchFindMatches, UserProfile } from '../src/matching';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
}

/**
 * Generate mock user data for benchmarking
 */
function generateMockUsers(count: number): UserProfile[] {
  const interests = [
    'coding',
    'AI',
    'blockchain',
    'web',
    'mobile',
    'startup',
    'innovation',
    'data',
    'IoT',
  ];
  const skills = [
    'JavaScript',
    'Python',
    'React',
    'Node.js',
    'SQL',
    'Docker',
    'Kubernetes',
    'AWS',
  ];
  const goals = [
    'startup',
    'learning',
    'innovation',
    'growth',
    'mentorship',
    'investment',
  ];

  const users: UserProfile[] = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: i,
      role: ['VIP', 'Regular', 'Youth'][i % 3] as 'VIP' | 'Regular' | 'Youth',
      interests: interests.slice(0, (i % 5) + 1),
      skills: skills.slice(0, (i % 4) + 1),
      goals: goals.slice(0, (i % 3) + 1),
      availability: (i % 100) + 1,
    });
  }
  return users;
}

/**
 * Run benchmark
 */
function benchmark(name: string, fn: () => void, iterations: number = 1000): BenchmarkResult {
  console.log(`Running benchmark: ${name} (${iterations} iterations)`);

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    fn();
    const endTime = performance.now();
    times.push(endTime - startTime);
  }

  times.sort((a, b) => a - b);
  const totalTime = times.reduce((a, b) => a + b, 0);
  const averageTime = totalTime / iterations;
  const minTime = times[0];
  const maxTime = times[iterations - 1];
  const opsPerSecond = 1000 / averageTime;

  return {
    name,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    opsPerSecond,
  };
}

/**
 * Print benchmark results
 */
function printBenchmarkResults(results: BenchmarkResult[]): void {
  console.log('\n========== BENCHMARK RESULTS ==========');
  console.log(
    'Name'.padEnd(40) +
      'Avg (ms)'.padEnd(12) +
      'Min (ms)'.padEnd(12) +
      'Max (ms)'.padEnd(12) +
      'Ops/s'
  );
  console.log('-'.repeat(88));

  results.forEach((result) => {
    console.log(
      result.name.padEnd(40) +
        result.averageTime.toFixed(3).padEnd(12) +
        result.minTime.toFixed(3).padEnd(12) +
        result.maxTime.toFixed(3).padEnd(12) +
        Math.round(result.opsPerSecond).toString()
    );
  });

  console.log('========================================\n');

  // Performance targets
  console.log('========== PERFORMANCE TARGETS ==========');
  console.log(
    'Target: Match finding for 1000 users in < 2 seconds (page load target)'
  );

  results.forEach((result) => {
    if (result.name.includes('1000 users')) {
      const estimatedTotal = (result.averageTime * 1000) / 1000; // Estimated for 1000 users
      const status = estimatedTotal < 2000 ? '✓ PASS' : '✗ FAIL';
      console.log(
        `${result.name}: ${estimatedTotal.toFixed(0)}ms ${status}`
      );
    }
  });
  console.log('========================================\n');
}

// Run benchmarks
const results: BenchmarkResult[] = [];

// Benchmark 1: Simple match finding (10 users)
const users10 = generateMockUsers(10);
const user10 = users10[0];
results.push(
  benchmark('findMatches (10 users)', () => {
    findMatches(user10, users10.slice(1), 5);
  }, 1000)
);

// Benchmark 2: Medium match finding (100 users)
const users100 = generateMockUsers(100);
const user100 = users100[0];
results.push(
  benchmark('findMatches (100 users)', () => {
    findMatches(user100, users100.slice(1), 10);
  }, 500)
);

// Benchmark 3: Large match finding (1000 users)
const users1000 = generateMockUsers(1000);
const user1000 = users1000[0];
results.push(
  benchmark('findMatches (1000 users)', () => {
    findMatches(user1000, users1000.slice(1), 20);
  }, 100)
);

// Benchmark 4: Batch matching (100 users)
results.push(
  benchmark('batchFindMatches (100 users)', () => {
    batchFindMatches(users100);
  }, 10)
);

// Benchmark 5: Batch matching (500 users)
const users500 = generateMockUsers(500);
results.push(
  benchmark('batchFindMatches (500 users)', () => {
    batchFindMatches(users500);
  }, 5)
);

printBenchmarkResults(results);

// Exit with error if performance targets are not met
const largeUserBenchmark = results.find((r) => r.name.includes('1000 users'));
if (largeUserBenchmark && largeUserBenchmark.averageTime > 2000) {
  console.error('Performance target not met for 1000 users!');
  process.exit(1);
}

console.log('All benchmarks completed successfully!');
process.exit(0);
