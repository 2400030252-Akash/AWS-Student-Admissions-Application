import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, generateStudent, generateApplication, extractCourses, extractStudentId } from './config.js';

const requestDuration = new Trend('request_duration');
const errorRate = new Rate('error_rate');
const timeoutRate = new Rate('timeout_rate');

export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 VUs
    { duration: '3m', target: 10 }, // Steady state admissions traffic
    { duration: '1m', target: 0 },  // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'error_rate': ['rate<0.05'],
  },
};

export function setup() {
  const res = http.get(`${BASE_URL}/api/courses`);
  const courseIds = extractCourses(res);
  return { courseIds };
}

export default function (data) {
  const rand = Math.random();
  let res;
  const jsonHeaders = { headers: { 'Content-Type': 'application/json' } };

  if (rand < 0.40) {
    // 40% Browse applications
    res = http.get(`${BASE_URL}/api/applications?limit=15`);
    check(res, { 'browse applications 200': (r) => r.status === 200 });
  } else if (rand < 0.60) {
    // 20% Browse registered students
    res = http.get(`${BASE_URL}/api/students?limit=15`);
    check(res, { 'browse students 200': (r) => r.status === 200 });
  } else if (rand < 0.75) {
    // 15% Register a student
    const studentPayload = JSON.stringify(generateStudent());
    res = http.post(`${BASE_URL}/api/students`, studentPayload, jsonHeaders);
    check(res, { 'register student 201': (r) => r.status === 201 });
  } else if (rand < 0.90) {
    // 15% Submit new admission application
    const studentPayload = JSON.stringify(generateStudent());
    const studentRes = http.post(`${BASE_URL}/api/students`, studentPayload, jsonHeaders);
    
    if (studentRes.status === 201) {
      const studentId = extractStudentId(studentRes);
      if (studentId) {
        const appPayload = JSON.stringify(generateApplication(studentId, data.courseIds));
        res = http.post(`${BASE_URL}/api/applications`, appPayload, jsonHeaders);
        check(res, { 'submit application 201': (r) => r.status === 201 });
      }
    }
  } else if (rand < 0.95) {
    // 5% View Admissions Dashboard statistics
    res = http.get(`${BASE_URL}/api/applications/stats`);
    check(res, { 'dashboard stats 200': (r) => r.status === 200 });
  } else {
    // 5% Health and metrics telemetry poll
    res = http.get(`${BASE_URL}/api/metrics`);
    check(res, { 'metrics telemetry 200': (r) => r.status === 200 });
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

  sleep(Math.random() * 1.5 + 0.5); // Think time 0.5 - 2s
}
