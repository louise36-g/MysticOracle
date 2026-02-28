/**
 * Rate Limiting Load Test Script
 *
 * Uses autocannon to load-test rate-limited endpoints on a running local server.
 * Run with: npm run load-test
 * Or:       npx tsx scripts/load-test.ts [baseUrl]
 *
 * Default target: http://localhost:3001
 */

import autocannon from 'autocannon';

const BASE_URL = process.argv[2] || 'http://localhost:3001';
const DURATION_SECONDS = 10;

interface EndpointConfig {
  name: string;
  path: string;
  method: 'GET' | 'POST';
  expectedLimiter: string;
  expectedMax: number;
  expectedWindowMs: number;
  connections: number;
}

const endpoints: EndpointConfig[] = [
  {
    name: 'Health (General Limiter)',
    path: '/api/v1/health',
    method: 'GET',
    expectedLimiter: 'general',
    expectedMax: 500,
    expectedWindowMs: 15 * 60 * 1000,
    connections: 10,
  },
  {
    name: 'Translations (General Limiter)',
    path: '/api/v1/translations/en',
    method: 'GET',
    expectedLimiter: 'general',
    expectedMax: 500,
    expectedWindowMs: 15 * 60 * 1000,
    connections: 10,
  },
  {
    name: 'Contact (Strict Limiter)',
    path: '/api/v1/contact',
    method: 'POST',
    expectedLimiter: 'strict',
    expectedMax: 10,
    expectedWindowMs: 60 * 1000,
    connections: 5,
  },
];

interface TestResult {
  name: string;
  requestsPerSec: number;
  latencyP50: number;
  latencyP99: number;
  total2xx: number;
  total429: number;
  totalOther: number;
  passed: boolean;
  notes: string;
}

async function runEndpointTest(endpoint: EndpointConfig): Promise<TestResult> {
  const url = `${BASE_URL}${endpoint.path}`;

  console.log(`\n--- Testing: ${endpoint.name} ---`);
  console.log(`  URL: ${url}`);
  console.log(`  Method: ${endpoint.method}`);
  console.log(`  Expected limiter: ${endpoint.expectedLimiter} (max=${endpoint.expectedMax})`);
  console.log(`  Duration: ${DURATION_SECONDS}s, Connections: ${endpoint.connections}`);

  const result = await autocannon({
    url,
    method: endpoint.method,
    duration: DURATION_SECONDS,
    connections: endpoint.connections,
    // Don't throw on non-2xx
    bailout: undefined,
  });

  const total2xx = result['2xx'] ?? 0;
  const total429 = result['4xx'] ?? 0; // 429s will show up in 4xx bucket
  const totalNon2xx4xx = result.non2xx - total429;

  // Determine pass/fail
  // For strict limiter (max=10), we expect 429s to appear
  // For general limiter (max=500), we may or may not see 429s depending on throughput
  let passed = true;
  let notes = '';

  if (endpoint.expectedMax <= 50) {
    // Strict limiters: we MUST see 429s since we'll exceed the limit quickly
    if (total429 === 0) {
      passed = false;
      notes = 'Expected 429 responses but got none — limiter may not be active';
    } else {
      notes = `429s detected as expected (limiter max=${endpoint.expectedMax})`;
    }
  } else {
    // General limiters: 429s may or may not appear depending on total requests sent
    const totalRequests = total2xx + result.non2xx;
    if (totalRequests > endpoint.expectedMax && total429 === 0) {
      passed = false;
      notes = `Sent ${totalRequests} requests exceeding max=${endpoint.expectedMax} but got no 429s`;
    } else if (total429 > 0) {
      notes = `429s appeared after exceeding max=${endpoint.expectedMax}`;
    } else {
      notes = `Sent ${totalRequests} requests (under max=${endpoint.expectedMax}), no 429s expected`;
    }
  }

  return {
    name: endpoint.name,
    requestsPerSec: result.requests.average,
    latencyP50: result.latency.p50,
    latencyP99: result.latency.p99,
    total2xx,
    total429,
    totalOther: totalNon2xx4xx,
    passed,
    notes,
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Rate Limiting Load Test');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Duration per endpoint: ${DURATION_SECONDS}s`);
  console.log('='.repeat(60));

  // Verify server is reachable
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/v1/health`);
    if (!healthCheck.ok) {
      console.error(`\nServer returned ${healthCheck.status} on health check.`);
      console.error('Make sure the server is running: npm run dev');
      process.exit(1);
    }
  } catch {
    console.error(`\nCannot reach ${BASE_URL}. Make sure the server is running: npm run dev`);
    process.exit(1);
  }

  const results: TestResult[] = [];

  for (const endpoint of endpoints) {
    const result = await runEndpointTest(endpoint);
    results.push(result);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  const col = {
    name: 30,
    rps: 10,
    p50: 10,
    p99: 10,
    ok: 8,
    limited: 8,
    result: 6,
  };

  const header = [
    'Endpoint'.padEnd(col.name),
    'req/s'.padStart(col.rps),
    'p50ms'.padStart(col.p50),
    'p99ms'.padStart(col.p99),
    '2xx'.padStart(col.ok),
    '429'.padStart(col.limited),
    'Result'.padStart(col.result),
  ].join(' | ');

  console.log(header);
  console.log('-'.repeat(header.length));

  for (const r of results) {
    const row = [
      r.name.padEnd(col.name),
      r.requestsPerSec.toFixed(0).padStart(col.rps),
      r.latencyP50.toFixed(1).padStart(col.p50),
      r.latencyP99.toFixed(1).padStart(col.p99),
      String(r.total2xx).padStart(col.ok),
      String(r.total429).padStart(col.limited),
      (r.passed ? 'PASS' : 'FAIL').padStart(col.result),
    ].join(' | ');

    console.log(row);
  }

  console.log('');
  for (const r of results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${r.name}: ${r.notes}`);
  }

  const allPassed = results.every(r => r.passed);
  console.log('');
  console.log(allPassed ? 'All endpoints passed.' : 'Some endpoints failed — see notes above.');
  process.exit(allPassed ? 0 : 1);
}

main();
