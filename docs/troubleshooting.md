# Complete Troubleshooting Guide for Aurora Serverless v2 Admissions Project

This guide provides targeted solutions for the most common issues encountered across local development, AWS Aurora deployment, k6 load testing, and CloudWatch performance analysis.

---

## Index of Issues

1. [Cannot Connect to Aurora](#1-cannot-connect-to-aurora)
2. [Connection Timeout](#2-connection-timeout)
3. [Security Group Problem](#3-security-group-problem)
4. [Wrong Endpoint](#4-wrong-endpoint)
5. [Wrong Port](#5-wrong-port)
6. [Wrong Credentials](#6-wrong-credentials)
7. [SSL Error](#7-ssl-error)
8. [Database Does Not Exist](#8-database-does-not-exist)
9. [Table Does Not Exist](#9-table-does-not-exist)
10. [Connection Pool Exhausted](#10-connection-pool-exhausted)
11. [Too Many Connections (PostgreSQL Error 53300)](#11-too-many-connections)
12. [k6 Cannot Reach API](#12-k6-cannot-reach-api)
13. [API Works Locally but Not After Deployment](#13-api-works-locally-but-not-after-deployment)
14. [High Latency Under Load](#14-high-latency-under-load)
15. [Request Timeout (HTTP 504 / Gateway Timeout)](#15-request-timeout)
16. [Aurora Does Not Scale as Expected](#16-aurora-does-not-scale-as-expected)

---

### 1. Cannot Connect to Aurora
- **Symptom**: `Error: connect ECONNREFUSED` or `could not connect to server: Connection refused`.
- **Cause**: Network packet cannot reach the Aurora cluster because Public Access is disabled while attempting to connect from outside the VPC, or the DB instance is in `Modifying` or `Stopped` status.
- **Solution**:
  1. In AWS RDS Console > Databases, verify cluster status is **Available**.
  2. If connecting from your laptop, ensure **Publicly Accessible** is set to **Yes**.
  3. If running the backend inside an AWS VPC (e.g. EC2/ECS), verify the backend and Aurora share the same VPC or have VPC Peering enabled.

---

### 2. Connection Timeout
- **Symptom**: `psql: error: connection to server at "...", port 5432 failed: Connection timed out` or Node.js `ETIMEDOUT`.
- **Cause**: Traffic is dropped silently by an AWS Security Group or Network Access Control List (NACL).
- **Solution**:
  1. Check your current public IP via `curl https://checkip.amazonaws.com`.
  2. In AWS Console > EC2 > Security Groups, select the Aurora security group.
  3. Edit **Inbound Rules**: Add PostgreSQL (port 5432) with source set to `<your-current-ip>/32`. Dynamic home IPs change frequently—update this whenever your ISP rotates your IP.

---

### 3. Security Group Problem
- **Symptom**: Inbound rule exists, but connection still hangs or times out.
- **Cause**: The rule was added to the wrong security group, or an outbound rule on the client security group blocks port 5432.
- **Solution**:
  1. Navigate to **RDS** > **Databases** > `aurora-admissions-cluster`. Under **Connectivity & security**, verify which Security Group is actively attached.
  2. Verify the VPC matches between client and database.
  3. Never use `0.0.0.0/0` in production. For EC2 instances, add the EC2's Security Group ID (e.g., `sg-0123456789abcdef0`) as the inbound source rule.

---

### 4. Wrong Endpoint
- **Symptom**: `getaddrinfo ENOTFOUND` or `psql: error: could not translate host name`.
- **Cause**: Using the Reader endpoint instead of the Writer endpoint for write operations, or typos in the cluster hostname.
- **Solution**:
  1. Open RDS Console > Databases > `aurora-admissions-cluster`.
  2. Under **Endpoints**, find the **Writer instance**: `aurora-admissions-cluster.cluster-xxxx.region.rds.amazonaws.com`.
  3. Never use an individual instance endpoint (`aurora-instance-1.xxxx`) because failover will break connectivity. Always use the Cluster Writer Endpoint.

---

### 5. Wrong Port
- **Symptom**: `Connection refused on port 5432` or application hung if port 3306 (MySQL) or 80 was configured by mistake.
- **Cause**: PostgreSQL operates on standard TCP port `5432`.
- **Solution**: Verify `DATABASE_PORT=5432` in `.env` and verify inbound security group rule allows port `5432`.

---

### 6. Wrong Credentials
- **Symptom**: `fatal: password authentication failed for user "admissions_admin"` (PostgreSQL error code `28P01`).
- **Cause**: Mismatch between `.env` password and master password configured during RDS cluster creation.
- **Solution**:
  1. Check RDS Console > Databases > `aurora-admissions-cluster` > **Modify**.
  2. Set a new **Master password**, check **Apply immediately**, and click **Save**.
  3. Update `DATABASE_PASSWORD` in `.env` and restart the backend.
  4. Note: Do not use AWS IAM access keys as the database password!

---

### 7. SSL Error
- **Symptom**: `error: no pg_hba.conf entry for host ..., SSL off` or `self-signed certificate in certificate chain`.
- **Cause**: Aurora PostgreSQL requires encrypted SSL/TLS connections by default.
- **Solution**:
  1. Ensure `DATABASE_SSL=true` in `.env`.
  2. In `backend/src/config/database.js`, the pg Pool is configured with `ssl: { rejectUnauthorized: false }` for development.
  3. For strict enterprise verification, download the Amazon RDS Global Root CA bundle from AWS and configure `ca: fs.readFileSync('global-bundle.pem')`.

---

### 8. Database Does Not Exist
- **Symptom**: `error: database "aurora_admissions" does not exist` (error code `3D000`).
- **Cause**: RDS defaults to creating a maintenance database named `postgres`, but not the custom database if omitted during creation.
- **Solution**:
  1. Connect to the default `postgres` database via `psql`:
     ```bash
     psql -h <writer-endpoint> -U admissions_admin -d postgres -p 5432
     ```
  2. Run SQL:
     ```sql
     CREATE DATABASE aurora_admissions;
     ```

---

### 9. Table Does Not Exist
- **Symptom**: `relation "students" does not exist` (error code `42P01`).
- **Cause**: Backend started before running `database/schema.sql`.
- **Solution**:
  Execute the schema script against the `aurora_admissions` database:
  ```bash
  psql -h <writer-endpoint> -U admissions_admin -d aurora_admissions -f database/schema.sql
  psql -h <writer-endpoint> -U admissions_admin -d aurora_admissions -f database/seed.sql
  ```

---

### 10. Connection Pool Exhausted
- **Symptom**: Requests hang for 5 seconds and fail with `Error: timeout exceeded when trying to connect` or `Connection pool exhausted`.
- **Cause**: High concurrency load (e.g. k6 100 VUs) exceeds `DB_POOL_MAX`, and waiting queries exceed `connectionTimeoutMillis`.
- **Solution**:
  1. In `.env`, increase `DB_POOL_MAX=30` or `50`.
  2. Increase `DB_CONNECTION_TIMEOUT=10000` (10 seconds).
  3. Ensure all controller/service functions release clients using `finally { client.release(); }` or use the standard `pool.query()` helper.

---

### 11. Too Many Connections
- **Symptom**: `FATAL: remaining connection slots are reserved for non-replication superuser connections` (PostgreSQL error code `53300`).
- **Cause**: Multiple backend instances or excessive pool sizes exceed Aurora's maximum connections formula:
  $$\text{Max Connections} = \text{LEAST}(\{ \text{DBInstanceClassMemory} / 9531392 \}, 5000)$$
  At 0.5 ACU (approx. 1 GB RAM allocated to DB), default max connections is around 100–120.
- **Solution**:
  1. Keep `DB_POOL_MAX` around 20–25 per backend replica.
  2. Consider placing AWS RDS Proxy in front of Aurora if scaling to dozens of backend containers.
  3. Raise Minimum ACU to 1.0 or 2.0 to allocate more memory and allow more connections.

---

### 12. k6 Cannot Reach API
- **Symptom**: `dial tcp [::1]:3001: connectex: No connection could be made because the target machine actively refused it`.
- **Cause**: The Node.js Express server is not running on port 3001 or k6 `BASE_URL` is pointing to the wrong host/port.
- **Solution**:
  1. Verify the server is running: `curl http://localhost:3001/api/health`.
  2. When executing k6, override the URL if needed:
     ```bash
     k6 run -e BASE_URL=http://localhost:3001 load-tests/smoke.js
     ```

---

### 13. API Works Locally but Not After Deployment
- **Symptom**: Frontend displays empty dashboards or network errors when deployed to Vercel/EC2.
- **Cause**: Frontend still points to `http://localhost:3001`, or CORS policy rejects the production frontend origin.
- **Solution**:
  1. Rebuild frontend with `VITE_API_URL=https://api.yourdomain.com`.
  2. In backend `.env`, set `CORS_ORIGIN=https://portal.yourdomain.com`.
  3. Verify security group on cloud server allows port 3001 or 443.

---

### 14. High Latency Under Load
- **Symptom**: Latency shoots up from 25ms to 2000ms+ during k6 spike tests.
- **Cause**:
  1. Database queries performing sequential table scans due to missing indexes.
  2. Scaling lag in Aurora Serverless v2 while adjusting from 0.5 to higher ACUs.
- **Solution**:
  1. Verify indexes exist:
     ```sql
     \d students
     \d applications
     ```
  2. Run `EXPLAIN ANALYZE` on sluggish queries:
     ```sql
     EXPLAIN ANALYZE SELECT * FROM applications WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 15;
     ```
  3. Observe CloudWatch: If `CPUUtilization` hits 100% before ACUs increment, this is expected scaling lag (the core academic phenomenon of this project).

---

### 15. Request Timeout
- **Symptom**: HTTP 504 Gateway Timeout or `Error: Query read timeout`.
- **Cause**: Under sudden load, queries in the pg pool wait longer than `DB_QUERY_TIMEOUT`.
- **Solution**:
  1. Tune `DB_QUERY_TIMEOUT=30000` (30 seconds) in `.env`.
  2. Increase Aurora's Minimum ACU to 2.0 to prevent deep cold-state delays.
  3. Log slow queries using `statement_timeout` parameters.

---

### 16. Aurora Does Not Scale as Expected
- **Symptom**: CloudWatch shows `ServerlessDatabaseCapacity` remains flat at 0.5 ACU even during high k6 load.
- **Cause**:
  1. The load test is hitting rate limiter (HTTP 429) or pool queue before queries actually reach Aurora.
  2. The load test is too short (Aurora scaling algorithm requires sustained resource pressure for at least 15–30 seconds before scaling up).
  3. Maximum capacity setting in Aurora is capped at 0.5 ACU.
- **Solution**:
  1. In `.env`, increase `RATE_LIMIT_MAX=10000`.
  2. Ensure the spike test runs with at least 50–100 VUs for 2+ minutes (`load-tests/spike-test.js`).
  3. In RDS Console, verify **Maximum ACU** is set to 8 or 16.
