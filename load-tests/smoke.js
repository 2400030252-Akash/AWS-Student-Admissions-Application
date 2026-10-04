import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';

export const options = {
  vus: 2,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
  },
};

export default function () {
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });
  sleep(1);

  const studentsRes = http.get(`${BASE_URL}/api/students`);
  check(studentsRes, {
    'students status is 200': (r) => r.status === 200,
  });
  sleep(1);

  const statsRes = http.get(`${BASE_URL}/api/applications/stats`);
  check(statsRes, {
    'stats status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
