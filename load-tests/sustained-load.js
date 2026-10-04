import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, generateStudent, generateApplication, extractCourses, extractStudentId } from './config.js';

const requestDuration = new Trend('request_duration');
const errorRate = new Rate('error_rate');
const timeoutRate = new Rate('timeout_rate');

export const options = {
  stages: [
    { duration: '2m', target: 50 }, // Ramp up to 50 VUs
    { duration: '5m', target: 50 }, // Sustained admission peak
    { duration: '1m', target: 0 },  // Ramp down to zero
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'],
    'error_rate': ['rate<0.10'],
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

  if (rand < 0.35) {
    // 35% Browse applications
    res = http.get(`${BASE_URL}/api/applications?limit=20`);
    check(res, { 'browse applications 200': (r) => r.status === 200 });
  } else if (rand < 0.55) {
    // 20% Browse registered students
    res = http.get(`${BASE_URL}/api/students?limit=20`);
    check(res, { 'browse students 200': (r) => r.status === 200 });
  } else if (rand < 0.75) {
    // 20% Register student
    const payload = JSON.stringify(generateStudent());
    res = http.post(`${BASE_URL}/api/students`, payload, jsonHeaders);
    check(res, { 'register student 201': (r) => r.status === 201 });
  } else if (rand < 0.90) {
    // 15% Complete application submission
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
  } else {
    // 10% Dashboard statistics aggregation query (intensive join)
    res = http.get(`${BASE_URL}/api/applications/stats`);
    check(res, { 'dashboard stats 200': (r) => r.status === 200 });
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

  sleep(Math.random() * 1.5 + 0.5);
}
