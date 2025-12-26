import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],     // Error rate should be less than 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Health Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Register User
  const email = `loadtest_${Date.now()}_${Math.random()}@example.com`;
  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email,
    password: 'Test123456',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const registerSuccess = check(registerRes, {
    'register status is 201': (r) => r.status === 201,
    'register returns access token': (r) => JSON.parse(r.body).accessToken !== undefined,
  });

  if (!registerSuccess) {
    errorRate.add(1);
    return;
  }

  const accessToken = JSON.parse(registerRes.body).accessToken;
  sleep(1);

  // Test 3: Get Products
  const productsRes = http.get(`${BASE_URL}/products`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Create Order (if products exist)
  if (productsRes.status === 200) {
    const products = JSON.parse(productsRes.body);
    if (products.length > 0) {
      const orderRes = http.post(`${BASE_URL}/orders`, JSON.stringify({
        items: [
          {
            productId: products[0].id,
            quantity: 1,
            unitPrice: products[0].price,
          },
        ],
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      check(orderRes, {
        'order status is 201': (r) => r.status === 201,
      }) || errorRate.add(1);
    }
  }

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify(data, null, 2),
  };
}

