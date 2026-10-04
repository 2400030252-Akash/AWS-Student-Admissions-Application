import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL } from './config.js';

const requestDuration = new Trend('request_duration');
const errorRate = new Rate('error_rate');
const timeoutRate = new Rate('timeout_rate');

export const options = {
  stages: [
    { duration: '1m', target: 80 },  // Ramp to 80 VUs
    { duration: '3m', target: 80 },  // Peak traffic saturation
    { duration: '10s', target: 5 },  // Sudden drop to 5 VUs (deadline passed)
    { duration: '3m', target: 5 },   // Observe latency cooldown and connection recovery
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2500'],
  },
};

export default function () {
  const rand = Math.random();
  let res;

  if (rand < 0.3) {
    res = http.get(`${BASE_URL}/api/health`);
    check(res, { 'health check 200': (r) => r.status === 200 });
  } else if (rand < 0.7) {
    res = http.get(`${BASE_URL}/api/applications?limit=10`);
    check(res, { 'applications list 200': (r) => r.status === 200 });
  } else {
    res = http.get(`${BASE_URL}/api/applications/stats`);
    check(res, { 'stats overview 200': (r) => r.status === 200 });
  }

  if (res) {
    requestDuration.add(res.timings.duration);
    if (res.status >= 400) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
    if (res.status === 504 || (res.error && res.error.toLowerCase().includes('timeout'))) {
      timeoutRate.add(1);
    }
  }

  sleep(Math.random() * 1 + 0.5);
}
