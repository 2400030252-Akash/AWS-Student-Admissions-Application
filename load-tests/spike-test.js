import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, generateStudent, generateApplication, extractCourses, extractStudentId } from './config.js';

const requestDuration = new Trend('request_duration');
const errorRate = new Rate('error_rate');
const timeoutRate = new Rate('timeout_rate');

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Warm-up / normal traffic
    { duration: '1m', target: 5 },    // Steady baseline
    { duration: '10s', target: 100 }, // DEADLINE SPIKE: Surge to 100 VUs in 10s!
    { duration: '2m', target: 100 },  // Sustained deadline rush
    { duration: '30s', target: 5 },   // Traffic recedes
    { duration: '1m', target: 5 },    // Post-deadline cooldown
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3500'],
    'error_rate': ['rate<0.20'], // Expect potential scaling lag errors during sudden 10s spike
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

  // Write-heavy spike representing students rushing to submit before deadline
  if (rand < 0.40) {
    // 40% Direct student registrations
    const payload = JSON.stringify(generateStudent());
    res = http.post(`${BASE_URL}/api/students`, payload, jsonHeaders);
    check(res, { 'register student 201': (r) => r.status === 201 });
  } else if (rand < 0.80) {
    // 40% Full registration + application submission flow
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
    // 20% Dashboard & Application inquiries
    res = http.get(`${BASE_URL}/api/applications/stats`);
    check(res, { 'stats check 200': (r) => r.status === 200 });
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

  // Short pause to maintain high request rate during spike
  sleep(Math.random() * 0.8 + 0.2);
}
