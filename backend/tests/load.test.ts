// Load tests for API endpoints and matching algorithm
// Tests response times under load
import http from 'http';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const LOAD_TEST_DURATION = 30000; // 30 seconds
const CONCURRENT_REQUESTS = 100; // Number of concurrent users

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
}

let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
const responseTimes: number[] = [];

/**
 * Simulate a single API request
 */
function makeRequest(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const url = new URL(path, API_BASE_URL);

    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        resolve(responseTime);
      });
    });

    req.on('error', (err) => {
      failedRequests++;
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      failedRequests++;
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Run load test with multiple concurrent requests
 */
async function runLoadTest(): Promise<LoadTestMetrics> {
  console.log(`Starting load test with ${CONCURRENT_REQUESTS} concurrent users for ${LOAD_TEST_DURATION}ms`);

  const testEndTime = Date.now() + LOAD_TEST_DURATION;
  const promises: Promise<void>[] = [];

  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const userRequest = async () => {
      while (Date.now() < testEndTime) {
        try {
          totalRequests++;
          // Test matching endpoint
          const responseTime = await makeRequest('/api/matches');
          successfulRequests++;
          responseTimes.push(responseTime);

          if (responseTime > 2000) {
            console.warn(`Slow response detected: ${responseTime}ms`);
          }
        } catch (error) {
          // Error already counted in failedRequests
          console.error(`Request failed: ${error}`);
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
      }
    };

    promises.push(userRequest());
  }

  await Promise.all(promises);

  // Calculate metrics
  responseTimes.sort((a, b) => a - b);
  const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const p95Index = Math.floor(responseTimes.length * 0.95);
  const p99Index = Math.floor(responseTimes.length * 0.99);
  const testDuration = LOAD_TEST_DURATION / 1000;
  const requestsPerSecond = totalRequests / testDuration;

  const metrics: LoadTestMetrics = {
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime: Math.round(averageResponseTime),
    minResponseTime: responseTimes[0],
    maxResponseTime: responseTimes[responseTimes.length - 1],
    p95ResponseTime: responseTimes[p95Index],
    p99ResponseTime: responseTimes[p99Index],
    requestsPerSecond: Math.round(requestsPerSecond),
  };

  return metrics;
}

/**
 * Print load test results
 */
function printResults(metrics: LoadTestMetrics): void {
  console.log('\n========== LOAD TEST RESULTS ==========');
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Successful: ${metrics.successfulRequests}`);
  console.log(`Failed: ${metrics.failedRequests}`);
  console.log(`Success Rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`);
  console.log(`Requests/Second: ${metrics.requestsPerSecond}`);
  console.log('\n========== RESPONSE TIME METRICS ==========');
  console.log(`Average: ${metrics.averageResponseTime}ms`);
  console.log(`Min: ${metrics.minResponseTime}ms`);
  console.log(`Max: ${metrics.maxResponseTime}ms`);
  console.log(`P95: ${metrics.p95ResponseTime}ms`);
  console.log(`P99: ${metrics.p99ResponseTime}ms`);
  console.log('========================================\n');

  // Performance threshold checks
  const thresholds = {
    averageResponseTime: 1000, // 1 second
    p95ResponseTime: 2000, // 2 seconds
    p99ResponseTime: 3000, // 3 seconds
    successRate: 95, // 95%
  };

  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;

  console.log('========== PERFORMANCE CHECKS ==========');
  console.log(`Average Response Time (< ${thresholds.averageResponseTime}ms): ${
    metrics.averageResponseTime <= thresholds.averageResponseTime ? '✓ PASS' : '✗ FAIL'
  }`);
  console.log(`P95 Response Time (< ${thresholds.p95ResponseTime}ms): ${
    metrics.p95ResponseTime <= thresholds.p95ResponseTime ? '✓ PASS' : '✗ FAIL'
  }`);
  console.log(`P99 Response Time (< ${thresholds.p99ResponseTime}ms): ${
    metrics.p99ResponseTime <= thresholds.p99ResponseTime ? '✓ PASS' : '✗ FAIL'
  }`);
  console.log(`Success Rate (> ${thresholds.successRate}%): ${
    successRate >= thresholds.successRate ? '✓ PASS' : '✗ FAIL'
  }`);
  console.log('========================================\n');

  // Exit with error code if thresholds are not met
  if (
    metrics.averageResponseTime > thresholds.averageResponseTime ||
    metrics.p95ResponseTime > thresholds.p95ResponseTime ||
    metrics.p99ResponseTime > thresholds.p99ResponseTime ||
    successRate < thresholds.successRate
  ) {
    process.exit(1);
  }
}

// Run load test
runLoadTest()
  .then((metrics) => {
    printResults(metrics);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
