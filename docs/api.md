# Student Admissions Portal - REST API Reference Documentation

All API responses follow a consistent JSON response envelope:

**Success Response Envelope**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response Envelope**:
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE"
  }
}
```

---

## Endpoint Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service and PostgreSQL/Aurora health probe |
| `GET` | `/api/students` | Paginated list of registered students (with search) |
| `GET` | `/api/students/:id` | Single student profile with associated applications |
| `POST` | `/api/students` | Register a new prospective student |
| `PUT` | `/api/students/:id` | Update student demographic profile |
| `DELETE` | `/api/students/:id` | Delete student and cascade applications |
| `GET` | `/api/applications` | Paginated admissions applications (filters: status, course) |
| `GET` | `/api/applications/:id` | Single application with applicant info and event audit trail |
| `POST` | `/api/applications` | Submit new admission application (starts in `PENDING`) |
| `PUT` | `/api/applications/:id` | Update application status (reviews, decisions) |
| `DELETE` | `/api/applications/:id` | Withdraw or remove an application |
| `GET` | `/api/applications/stats` | Aggregated admissions metrics (status, course breakdown) |
| `GET` | `/api/courses` | List of all active academic programs |
| `GET` | `/api/metrics` | Node.js telemetry and connection pool metrics |

---

## 1. System & Health Endpoints

### `GET /api/health`
Checks the backend Express instance and verifies database connectivity via `SELECT 1`.

- **Response (200 OK - Healthy)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-10-03T14:40:00.000Z",
    "environment": "development",
    "poolInfo": {
      "total": 5,
      "idle": 4,
      "waiting": 0
    }
  }
}
```

- **Response (503 Service Unavailable - Database Disconnected)**:
```json
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "database": "disconnected",
    "timestamp": "2026-10-03T14:40:00.000Z",
    "environment": "development"
  }
}
```

---

## 2. Student Management Endpoints

### `GET /api/students`
Retrieves a paginated list of students. Supports optional full-text search.

- **Query Parameters**:
  - `page` (optional, default: `1`): Current page number.
  - `limit` (optional, default: `20`, max: `100`): Results per page.
  - `search` (optional): Filter by name, email, or city.

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "e8e82ef4-7db3-4318-8fbf-ef883015ee61",
        "full_name": "Aarav Patel",
        "email": "aarav.patel@example.com",
        "phone": "9876543210",
        "city": "Mumbai",
        "state": "Maharashtra",
        "created_at": "2026-10-03T14:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### `GET /api/students/:id`
Retrieves full details for a student, including all applications submitted by them.

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "e8e82ef4-7db3-4318-8fbf-ef883015ee61",
      "full_name": "Aarav Patel",
      "email": "aarav.patel@example.com",
      "phone": "9876543210",
      "date_of_birth": "2004-05-15",
      "gender": "Male",
      "address": "123 MG Road",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "created_at": "2026-10-03T14:00:00.000Z",
      "updated_at": "2026-10-03T14:00:00.000Z",
      "applications": [
        {
          "id": "a98a65d7-1234-5678-90ab-cdef12345678",
          "application_number": "APP-20240501-12345",
          "course_name": "Computer Science and Engineering",
          "status": "APPROVED",
          "percentage": 88.50
        }
      ]
    }
  }
}
```

### `POST /api/students`
Registers a new prospective student.

- **Request Body**:
```json
{
  "full_name": "Diya Sharma",
  "email": "diya.sharma@example.com",
  "phone": "9876543211",
  "date_of_birth": "2005-02-20",
  "gender": "Female",
  "address": "45 Brigade Road",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001"
}
```

- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "c1f7b0a3-2345-6789-01bc-def234567890",
      "full_name": "Diya Sharma",
      "email": "diya.sharma@example.com",
      "phone": "9876543211",
      "date_of_birth": "2005-02-20",
      "gender": "Female",
      "address": "45 Brigade Road",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "created_at": "2026-10-03T14:42:00.000Z"
    }
  }
}
```

- **Response (400 Bad Request - Validation Error)**:
```json
{
  "success": false,
  "error": {
    "message": "Valid email is required; Valid phone number is required (10-15 digits)",
    "code": "VALIDATION_ERROR"
  }
}
```

- **Response (409 Conflict - Duplicate Email)**:
```json
{
  "success": false,
  "error": {
    "message": "A record with this information already exists.",
    "code": "UNIQUE_VIOLATION"
  }
}
```

### `PUT /api/students/:id`
Updates demographic or contact information for an existing student.

- **Request Body**:
```json
{
  "phone": "9876549999",
  "city": "Pune",
  "state": "Maharashtra"
}
```

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "c1f7b0a3-2345-6789-01bc-def234567890",
      "full_name": "Diya Sharma",
      "phone": "9876549999",
      "city": "Pune",
      "updated_at": "2026-10-03T14:45:00.000Z"
    }
  }
}
```

### `DELETE /api/students/:id`
Deletes a student record and cascades deletion of all their applications.

- **Response**: `204 No Content`

---

## 3. Admission Application Endpoints

### `GET /api/applications`
Retrieves a paginated list of admission applications with joined student names and course titles.

- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 20)
  - `status` (optional): Filter by `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`.
  - `course_id` (optional): Filter by course UUID.

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
        "application_number": "APP-20241003-84729",
        "student_id": "c1f7b0a3-2345-6789-01bc-def234567890",
        "student_name": "Diya Sharma",
        "student_email": "diya.sharma@example.com",
        "course_name": "Computer Science and Engineering",
        "academic_year": "2024-2025",
        "percentage": 94.20,
        "application_type": "REGULAR",
        "status": "PENDING",
        "created_at": "2026-10-03T14:43:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### `GET /api/applications/:id`
Fetches a single application by UUID, including full student information, course details, and complete lifecycle audit log (`events`).

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
      "application_number": "APP-20241003-84729",
      "student_id": "c1f7b0a3-2345-6789-01bc-def234567890",
      "student_name": "Diya Sharma",
      "student_email": "diya.sharma@example.com",
      "student_phone": "9876543211",
      "course_name": "Computer Science and Engineering",
      "course_code": "CSE",
      "academic_year": "2024-2025",
      "previous_qualification": "12th CBSE Science",
      "percentage": 94.20,
      "application_type": "REGULAR",
      "status": "APPROVED",
      "remarks": "Eligibility requirements verified",
      "reviewed_at": "2026-10-03T14:50:00.000Z",
      "created_at": "2026-10-03T14:43:00.000Z",
      "events": [
        {
          "id": "e1-uuid",
          "event_type": "CREATED",
          "new_status": "PENDING",
          "description": "Application submitted",
          "created_at": "2026-10-03T14:43:00.000Z"
        },
        {
          "id": "e2-uuid",
          "event_type": "STATUS_CHANGED",
          "old_status": "PENDING",
          "new_status": "UNDER_REVIEW",
          "description": "Status changed from PENDING to UNDER_REVIEW",
          "created_at": "2026-10-03T14:48:00.000Z"
        },
        {
          "id": "e3-uuid",
          "event_type": "STATUS_CHANGED",
          "old_status": "UNDER_REVIEW",
          "new_status": "APPROVED",
          "description": "Status changed from UNDER_REVIEW to APPROVED",
          "created_at": "2026-10-03T14:50:00.000Z"
        }
      ]
    }
  }
}
```

### `POST /api/applications`
Submits a new admission application. Executes inside a database transaction that automatically creates both the application record and the initial `CREATED` event.

- **Request Body**:
```json
{
  "student_id": "c1f7b0a3-2345-6789-01bc-def234567890",
  "course_id": "f5a1e2d3-4567-8901-abcd-ef0123456789",
  "academic_year": "2024-2025",
  "previous_qualification": "12th CBSE Science",
  "percentage": 94.20,
  "application_type": "REGULAR"
}
```

- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
      "application_number": "APP-20241003-84729",
      "status": "PENDING",
      "percentage": 94.20,
      "created_at": "2026-10-03T14:43:00.000Z"
    }
  }
}
```

### `PUT /api/applications/:id`
Updates the status or remarks of an application. Executes inside a transaction: automatically records a `STATUS_CHANGED` event in `application_events` and sets `reviewed_at` if approved or rejected.

- **Request Body**:
```json
{
  "status": "APPROVED",
  "remarks": "Candidate qualifies on merit quota"
}
```

- **Response (200 OK)**: Returns updated application object.

### `DELETE /api/applications/:id`
Deletes an application and its audit log entries.

- **Response**: `204 No Content`

### `GET /api/applications/stats`
Executes aggregate queries across all applications to compute statistics for the Dashboard.

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total": 1500,
    "pending": 450,
    "underReview": 320,
    "approved": 580,
    "rejected": 150,
    "today": 42,
    "thisWeek": 280,
    "thisMonth": 1500,
    "byCourse": [
      { "courseName": "Computer Science and Engineering", "count": 520 },
      { "courseName": "Artificial Intelligence and Machine Learning", "count": 380 }
    ],
    "byStatus": [
      { "status": "APPROVED", "count": 580 },
      { "status": "PENDING", "count": 450 }
    ],
    "recentApplications": [ ... ]
  }
}
```

---

## 4. Academic Programs Endpoint

### `GET /api/courses`
Lists all active academic programs available for admissions.

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "f5a1e2d3-4567-8901-abcd-ef0123456789",
      "name": "Computer Science and Engineering",
      "code": "CSE",
      "description": "B.Tech in Computer Science and Engineering",
      "duration_years": 4,
      "is_active": true
    }
  ]
}
```

---

## 5. Performance Telemetry Endpoint

### `GET /api/metrics`
Exposes application-level metrics captured by the Node.js Express server.

> [!NOTE]
> These metrics are application-side measurements. Aurora capacity (ACU) scaling and database engine internals must be retrieved from AWS CloudWatch.

- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "note": "These are application-level metrics. Aurora capacity (ACU) metrics must be obtained from AWS CloudWatch after connecting the application to Aurora Serverless v2.",
    "totalRequests": 12450,
    "successfulRequests": 12380,
    "failedRequests": 70,
    "successRate": 99.44,
    "dbErrors": 4,
    "timeouts": 66,
    "pool": {
      "total": 20,
      "active": 18,
      "idle": 2,
      "waiting": 3
    },
    "latencies": {
      "requests": {
        "avg": 45.2,
        "p50": 22.0,
        "p95": 140.5,
        "p99": 480.0
      },
      "database": {
        "avg": 12.4,
        "p50": 6.0,
        "p95": 38.0,
        "p99": 115.0
      }
    },
    "timestamp": "2026-10-03T14:55:00.000Z"
  }
}
```

---

## 6. Authentication Context

This academic project intentionally focuses on **database scaling behavior**, **concurrency latency**, and **Aurora Serverless v2 capacity auto-scaling**. To eliminate synthetic token refresh delays during high-VU k6 load tests, endpoints are accessible without JWT session tokens. In production deployments, endpoints can be secured via an API Gateway (e.g., AWS API Gateway with Cognito Authorizers).
