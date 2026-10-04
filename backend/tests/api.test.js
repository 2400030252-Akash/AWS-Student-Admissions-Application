import test from 'node:test';
import assert from 'node:assert';
import { request } from './setup.js';

test('1. Health check endpoint verifies PostgreSQL / Aurora connectivity', async (t) => {
  const res = await request('GET', '/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(res.data.data.status, 'healthy');
  assert.strictEqual(res.data.data.database, 'connected');
  assert.ok(res.data.data.poolInfo);
});

test('2. Courses endpoint returns active academic engineering courses', async (t) => {
  const res = await request('GET', '/api/courses');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  const courses = res.data.data.courses || res.data.data;
  assert.ok(Array.isArray(courses));
  assert.ok(courses.length > 0, 'Should have at least 1 course seeded');
  assert.ok(courses[0].name);
  assert.ok(courses[0].code);
});

test('3. Complete Student CRUD workflow with validation', async (t) => {
  const uid = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const newStudent = {
    full_name: 'Test Student Automated',
    email: `student.${uid}@example.com`,
    phone: '9876543210',
    date_of_birth: '2004-05-15',
    gender: 'Male',
    address: '42 Academic Way, University Campus',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001'
  };

  // POST Create student
  const createRes = await request('POST', '/api/students', newStudent);
  assert.strictEqual(createRes.status, 201, `Failed to create student: ${JSON.stringify(createRes.data)}`);
  assert.strictEqual(createRes.data.success, true);
  const created = createRes.data.data.student;
  assert.ok(created.id, 'Created student must have UUID id');
  assert.strictEqual(created.email, newStudent.email);
  const studentId = created.id;

  // GET Single student
  const getRes = await request('GET', `/api/students/${studentId}`);
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getRes.data.data.student.id, studentId);
  assert.strictEqual(getRes.data.data.student.full_name, newStudent.full_name);

  // GET List students
  const listRes = await request('GET', `/api/students?search=${encodeURIComponent(newStudent.email)}`);
  assert.strictEqual(listRes.status, 200);
  assert.ok(listRes.data.data.students.length >= 1);
  assert.strictEqual(listRes.data.data.students[0].email, newStudent.email);

  // PUT Update student
  const updateRes = await request('PUT', `/api/students/${studentId}`, {
    full_name: 'Test Student Updated Name',
    city: 'Hyderabad'
  });
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.data.data.student.full_name, 'Test Student Updated Name');
  assert.strictEqual(updateRes.data.data.student.city, 'Hyderabad');

  // DELETE Student
  const deleteRes = await request('DELETE', `/api/students/${studentId}`);
  assert.strictEqual(deleteRes.status, 204);

  // Verify 404 after deletion
  const verifyRes = await request('GET', `/api/students/${studentId}`);
  assert.strictEqual(verifyRes.status, 404);
});

test('4. Complete Application creation, audit events, and review workflow', async (t) => {
  // First, create a student to apply
  const uid = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const studentRes = await request('POST', '/api/students', {
    full_name: 'Applicant Student',
    email: `applicant.${uid}@example.com`,
    phone: '9123456780',
    date_of_birth: '2005-02-10',
    gender: 'Female',
    address: '10 Tech Street',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001'
  });
  assert.strictEqual(studentRes.status, 201);
  const studentId = studentRes.data.data.student.id;

  // Get available course
  const coursesRes = await request('GET', '/api/courses');
  const courseId = (coursesRes.data.data.courses || coursesRes.data.data)[0].id;

  // Submit Application
  const appData = {
    student_id: studentId,
    course_id: courseId,
    academic_year: '2024-2025',
    previous_qualification: '12th CBSE Science',
    percentage: 92.5,
    application_type: 'REGULAR'
  };

  const appRes = await request('POST', '/api/applications', appData);
  assert.strictEqual(appRes.status, 201);
  assert.strictEqual(appRes.data.success, true);
  const app = appRes.data.data.application;
  assert.ok(app.id);
  assert.ok(app.application_number.startsWith('APP-'));
  assert.strictEqual(app.status, 'PENDING');
  const appId = app.id;

  // Fetch Application Details with Events
  const detailRes = await request('GET', `/api/applications/${appId}`);
  assert.strictEqual(detailRes.status, 200);
  const appDetail = detailRes.data.data.application;
  assert.strictEqual(appDetail.id, appId);
  assert.ok(Array.isArray(appDetail.events));
  assert.ok(appDetail.events.length >= 1, 'Should have CREATED event in audit log');

  // Update Status to UNDER_REVIEW then APPROVED
  const reviewRes = await request('PUT', `/api/applications/${appId}`, {
    status: 'UNDER_REVIEW',
    remarks: 'Document verification passed'
  });
  assert.strictEqual(reviewRes.status, 200);

  const approveRes = await request('PUT', `/api/applications/${appId}`, {
    status: 'APPROVED',
    remarks: 'Admission granted'
  });
  assert.strictEqual(approveRes.status, 200);
  assert.strictEqual(approveRes.data.data.application.status, 'APPROVED');

  // Re-fetch detail to check event log
  const updatedDetailRes = await request('GET', `/api/applications/${appId}`);
  const updatedEvents = updatedDetailRes.data.data.application.events;
  assert.ok(updatedEvents.length >= 3, 'Must have recorded CREATED and 2 STATUS_CHANGED events');
});

test('5. Application Statistics endpoint returns aggregate overview', async (t) => {
  const res = await request('GET', '/api/applications/stats');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  const stats = res.data.data;
  assert.ok(typeof stats.total === 'number');
  assert.ok(typeof stats.pending === 'number');
  assert.ok(typeof stats.approved === 'number');
  assert.ok(Array.isArray(stats.byCourse));
  assert.ok(Array.isArray(stats.byStatus));
  assert.ok(Array.isArray(stats.recentApplications));
});

test('6. Input Validation rejects invalid payloads', async (t) => {
  // Missing required student fields
  const badStudent = await request('POST', '/api/students', { full_name: '' });
  assert.strictEqual(badStudent.status, 400);
  assert.strictEqual(badStudent.data.success, false);

  // Missing required application fields
  const badApp = await request('POST', '/api/applications', { student_id: null });
  assert.strictEqual(badApp.status, 400);
  assert.strictEqual(badApp.data.success, false);

  // Invalid percentage (> 100)
  const badPercentage = await request('POST', '/api/applications', {
    student_id: '00000000-0000-0000-0000-000000000000',
    course_id: '00000000-0000-0000-0000-000000000000',
    academic_year: '2024-2025',
    previous_qualification: '12th',
    percentage: 150
  });
  assert.strictEqual(badPercentage.status, 400);
});

test('7. Application-level Metrics endpoint returns telemetry and CloudWatch disclaimer', async (t) => {
  const res = await request('GET', '/api/metrics');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  const metrics = res.data.data;
  assert.ok(metrics.note.includes('AWS CloudWatch'));
  assert.ok(typeof metrics.totalRequests === 'number');
  assert.ok(metrics.latencies);
  assert.ok(metrics.latencies.requests);
  assert.ok(metrics.latencies.database);
  assert.ok(metrics.pool);
});
