# Complete Step-by-Step AWS Setup & Aurora Manual Configuration Guide

This guide provides a comprehensive, end-to-end walkthrough for deploying and validating the **Amazon Aurora PostgreSQL Serverless v2** database cluster for the Student Admissions Portal.

---

## Architecture Context

```text
React Frontend (Vite)
       │
       ▼ (HTTP REST)
Node.js + Express API Backend (pg Connection Pool)
       │
       ▼ (PostgreSQL Wire Protocol / Port 5432 / SSL)
Amazon Aurora PostgreSQL Serverless v2 (Cluster Writer Endpoint)
```

---

## STEP 1: AWS Region Selection
1. Log in to the [AWS Management Console](https://console.aws.amazon.com).
2. Choose an AWS region closest to your geographical location to minimize network round-trip latency. Recommended regions that fully support Aurora Serverless v2 include:
   - `us-east-1` (N. Virginia)
   - `us-east-2` (Ohio)
   - `us-west-2` (Oregon)
   - `ap-south-1` (Mumbai)
   - `eu-west-1` (Ireland)
3. Check regional pricing at [AWS Aurora Pricing](https://aws.amazon.com/rds/aurora/pricing/) as ACU hourly rates vary slightly by region.

---

## STEP 2: Create Aurora PostgreSQL Serverless v2 Cluster
1. Navigate to the **RDS Console** in AWS.
2. In the navigation pane, choose **Databases**, then click **Create database**.
3. Choose **Standard create**.
4. **Engine options**: Select **Amazon Aurora**.
5. **Edition**: Choose **Amazon Aurora PostgreSQL-Compatible Edition**.
6. **Engine Version**: Select a recent PostgreSQL 15 or 16 release (e.g., PostgreSQL 15.4 or later compatible).
7. **Templates**: Choose **Dev/Test** for an academic project.
8. **Settings**:
   - **DB cluster identifier**: `aurora-admissions-cluster`
   - **Master username**: `admissions_admin`
   - **Master password**: Provide a strong, generated password (e.g., 16+ alphanumeric characters). Store this securely in your password manager.
9. **Cluster storage configuration**: Aurora Standard.
10. **Instance configuration**:
    - Select **Serverless v2**.
11. **Capacity settings**:
    - **Minimum capacity**: Set to `0.5` ACU (Aurora Capacity Unit). 
      *(Note: 1 ACU provides approximately 2 GiB of memory with corresponding compute and networking).*
    - **Maximum capacity**: Set to `16` ACU (or `8` ACU for strict budget constraints).

---

## STEP 3: Configure Networking
1. **Virtual Private Cloud (VPC)**: Select your **Default VPC** (or a dedicated custom VPC).
2. **DB Subnet Group**: Choose **default** (it automatically spans all Availability Zones in the VPC).
3. **Public access**:
   - **Production Best Practice**: Always set to **No** (database lives in private subnets, accessed only via an application server or bastion host).
   - **Academic Testing Setup**: If running your Node.js backend on your local machine, you may set Public access to **Yes**, but you **MUST restrict the security group in Step 4**.
4. **Availability Zones**: Aurora automatically replicates data across 3 Availability Zones.

---

## STEP 4: Configure Database Security & Firewalls
1. **VPC security group (firewall)**: Choose **Create new** and name it `aurora-admissions-sg`.
2. Open the **EC2 Console** > **Security Groups** and select `aurora-admissions-sg`.
3. Under **Inbound rules**, click **Edit inbound rules**:
   - **Rule 1**:
     - **Type**: `PostgreSQL`
     - **Port**: `5432`
     - **Source**: Select **My IP** (this automatically populates your public IP, e.g., `203.0.113.50/32`).
   - If running the backend on an AWS EC2 instance or ECS container:
     - **Source**: Choose the Security Group ID of the backend server (e.g., `sg-0abc1234def56789`).
   - ⚠️ **SECURITY WARNING**: **NEVER** set the Source to `0.0.0.0/0` (Anywhere IPv4). Opening port 5432 to the entire internet exposes your database to brute-force attacks and automated bots.
4. **Encryption**: Verify **Enable encryption** is checked (uses AWS KMS key `aws/rds`).

---

## STEP 5: Find the Aurora Cluster & Instance Endpoints
1. In the RDS Console, click **Databases** and select `aurora-admissions-cluster`.
2. Under the **Connectivity & security** tab, locate the **Endpoints** table:
   - **Writer instance**: `aurora-admissions-cluster.cluster-xxxx.region.rds.amazonaws.com`
     - Type: `Writer`
     - Port: `5432`
     - *Use this endpoint for all backend reads and writes.*
   - **Reader instance**: `aurora-admissions-cluster.cluster-ro-xxxx.region.rds.amazonaws.com`
     - Type: `Reader`
     - Port: `5432`
     - *Used for read replicas if scaled horizontally.*

---

## STEP 6: Connect Using PostgreSQL Tools (psql / pgAdmin)

### Option A: Using `psql` CLI
```bash
# Connect to default database first to create project database
psql "host=aurora-admissions-cluster.cluster-xxxx.region.rds.amazonaws.com port=5432 dbname=postgres user=admissions_admin sslmode=require"
```
Enter your password when prompted.

### Option B: Using `pgAdmin 4`
1. Right-click **Servers** > **Register** > **Server...**
2. In the **General** tab, Name: `Aurora Serverless v2 Admissions`.
3. In the **Connection** tab:
   - **Host name/address**: `<writer-endpoint>`
   - **Port**: `5432`
   - **Maintenance database**: `postgres`
   - **Username**: `admissions_admin`
   - **Password**: `<your-master-password>`
4. In the **SSL** tab:
   - **SSL mode**: `Require`

---

## STEP 7: Create the Project Database Schema & Seed Data

Run the following commands using `psql` to create the database, tables, triggers, and seed records:

```bash
# 1. Create dedicated database
psql "host=<writer-endpoint> port=5432 dbname=postgres user=admissions_admin sslmode=require" -c "CREATE DATABASE aurora_admissions;"

# 2. Apply Schema (UUIDs, tables, indexes, constraints, triggers)
psql "host=<writer-endpoint> port=5432 dbname=aurora_admissions user=admissions_admin sslmode=require" -f database/schema.sql

# 3. Seed Courses, Students, Sample Applications, and Events
psql "host=<writer-endpoint> port=5432 dbname=aurora_admissions user=admissions_admin sslmode=require" -f database/seed.sql
```

---

## STEP 8: Configure Application Environment Variables

In your project root (and inside `backend/`), create or update `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Amazon Aurora Serverless v2 PostgreSQL Connection
DATABASE_HOST=aurora-admissions-cluster.cluster-xxxx.region.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=aurora_admissions
DATABASE_USER=admissions_admin
DATABASE_PASSWORD=YourSecureMasterPassword123!
DATABASE_SSL=true

# Connection Pool Tuning for Concurrency
DB_POOL_MAX=25
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
DB_QUERY_TIMEOUT=30000

# CORS & Rate Limiting
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=5000
```

---

## STEP 9: Test Health Check Endpoint

Start the backend:
```bash
npm run dev:backend
```

In a browser or curl, test the health endpoint:
```bash
curl http://localhost:3001/api/health
```

Expected output:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-10-03T14:30:00.000Z",
    "environment": "production",
    "poolInfo": {
      "total": 1,
      "idle": 1,
      "waiting": 0
    }
  }
}
```

---

## STEP 10: Verify Database Connectivity & CRUD Workflows

Run the automated test suite to confirm end-to-end functionality against Aurora:
```bash
npm test
```
Verify that all 7 test suites pass (student CRUD, application lifecycle, audit logs, and metrics).

---

## STEP 11: Run Normal Workload Scenario (k6)

Execute the steady-state baseline workload:
```bash
k6 run load-tests/normal-load.js
```
- **Virtual Users**: 10 VUs
- **Duration**: 5 minutes
- **Traffic**: Browsing applications, registering students, viewing stats
- **Observation**: Aurora remains at minimum capacity (e.g. 0.5 ACU) without noticeable latency.

---

## STEP 12: Run Spike Workload Scenario (Deadline Rush)

Simulate a sudden surge of applicants submitting admission forms right before a deadline:
```bash
k6 run load-tests/spike-test.js
```
- **Surge**: 5 VUs &rarr; 100 VUs in 10 seconds.
- **Payload**: 80% heavy writes (student registration + application creation in transactions).

---

## STEP 13: Open AWS CloudWatch Console
1. In the AWS Console search bar, type **CloudWatch**.
2. In the navigation pane, choose **Metrics** > **All metrics**.
3. Under the **AWS Namespaces**, choose **RDS**.
4. Choose **Per-Database Metrics** or **Database Cluster Metrics**.

---

## STEP 14: Key Aurora Metrics to Monitor

Filter metrics for `aurora-admissions-cluster`:

| CloudWatch Metric Name | Description | Key Indicator |
| :--- | :--- | :--- |
| `ServerlessDatabaseCapacity` | Current allocated ACUs (0.5 to 16) | Measures auto-scaling response |
| `ACUUtilization` | % of currently provisioned capacity used | Triggers scaling when consistently high |
| `CPUUtilization` | % of host CPU utilized | Compute pressure |
| `DatabaseConnections` | Number of open client connections | Pool saturation check |
| `CommitLatency` | Average time taken to commit transactions | Write latency degradation |
| `BufferCacheHitRatio` | % of requests served from memory | Memory pressure indicator |
| `FreeableMemory` | Available RAM in bytes | Memory scaling indicator |

---

## STEP 15: Observe Aurora Serverless v2 Capacity Behavior

During the spike test, observe in CloudWatch:
1. **Scaling Lag**: Aurora detects sustained CPU/ACU pressure and incrementally scales ACUs (e.g., 0.5 &rarr; 1.0 &rarr; 2.0 &rarr; 4.0).
2. **Latencies**: During the initial 10–30 seconds of scaling lag, notice temporary latency spikes or timeouts in the application metrics dashboard (`/metrics`).
3. **Stabilization**: Once capacity reaches higher ACU, response times flatten out and timeouts disappear.
4. **Scale-Down**: After traffic drops back to 5 VUs, observe that Aurora gradually decrements capacity back towards the minimum ACU setting.

---

## STEP 16: Repeat Tests with Different Minimum ACU Values

To analyze cost vs. performance trade-offs:
1. Go to **RDS** > **Databases** > `aurora-admissions-cluster` > **Modify**.
2. Change **Minimum capacity**:
   - **Configuration A**: `0.5 ACU` (Maximum cost savings, highest scaling lag)
   - **Configuration B**: `2.0 ACU` (Balanced cost and readiness)
   - **Configuration C**: `4.0 ACU` (Lowest latency, no scaling lag timeouts, higher idle cost)
3. Re-run `k6 run load-tests/spike-test.js` under each configuration.
4. Record metrics in the tables provided in `docs/experiments.md`.

---

## AWS API vs PostgreSQL Protocol Clarification

> [!IMPORTANT]
> **Database Queries**: Your Node.js backend connects to Aurora using standard PostgreSQL network protocol (`pg` pool). No AWS SDK, IAM user, or AWS API keys (`AWS_ACCESS_KEY_ID`) are required for database queries.
>
> **AWS SDK**: Only used if you write a separate script or tool to read metrics programmatically from the CloudWatch API.
>
> **IAM Authentication (Optional)**: While Aurora supports IAM database authentication via temporary security tokens, standard password authentication is recommended and sufficient for this project.
