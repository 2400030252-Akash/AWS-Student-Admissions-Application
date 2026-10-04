# Aurora Serverless v2 for a Variable-Load Application: Student Admissions Portal

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Amazon Aurora](https://img.shields.io/badge/AWS-Aurora%20Serverless%20v2-orange.svg)](https://aws.amazon.com/rds/aurora/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb.svg)](https://reactjs.org/)
[![k6](https://img.shields.io/badge/Load%20Testing-k6-purple.svg)](https://k6.io/)

A complete academic cloud and database engineering project demonstrating auto-scaling, scaling lag, timeout mitigation, and economic cost optimization on **Amazon Aurora PostgreSQL Serverless v2** using a realistic university student admissions portal.

---

## 1. Project Overview

University student admissions portals exhibit extreme workload variability:
- **Off-Peak (90% of the academic year)**: Infrequent traffic from administrative staff and occasional inquiries.
- **Peak (10% of the year)**: Severe bursts and surges of concurrent student registrations and document submissions right before admission deadlines.

This project empirically demonstrates:
1. **Dynamic Scaling**: Aurora Serverless v2 scales compute capacity in fractions of 0.5 ACU without downtime or connection drops.
2. **Variable Traffic Resilience**: The application handles high write concurrency using database connection pooling.
3. **Dual Telemetry**: Application-level latency and database metrics are captured in Node.js while engine metrics are monitored via AWS CloudWatch.
4. **Scaling Lag Bottleneck**: Sudden spikes (e.g. 5 to 100 VUs in 10s) reveal brief scaling delays before ACU expansion occurs.
5. **Minimum ACU Tuning**: Comparative analysis of minimum capacity settings (0.5 ACU vs 2.0 ACU vs 4.0 ACU).
6. **Cost Optimization**: Analysis of how Serverless v2 saves cost compared to overprovisioned static DB instances.

---

## 2. Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React 18 + Vite SPA                  │
│       (Dashboard, Students, Applications, Metrics)     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON / REST
┌───────────────────────────▼────────────────────────────┐
│              Node.js + Express REST API                │
│ (Rate Limiting, Parameterized SQL, Telemetry Engine)   │
└───────────────────────────┬────────────────────────────┘
                            │ pg.Pool (Max: 25, Warm Sockets)
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     Local PostgreSQL      │ │  Amazon Aurora Serverless │
│      Docker Container     │ │     PostgreSQL Cluster    │
│    (Development / Test)   │ │  (0.5 ACU - 16 ACU / SSL) │
└───────────────────────────┘ └───────────────────────────┘
```

---

## 3. Technologies Used

- **Frontend**: React 18, Vite, React Router DOM v6, Recharts, CSS Modules / Custom Responsive CSS.
- **Backend**: Node.js (ESM), Express.js, `pg` (node-postgres with connection pooling), `helmet`, `cors`, `express-rate-limit`, `morgan`, `dotenv`.
- **Database**: PostgreSQL 15+ compatible schema, Amazon Aurora PostgreSQL Serverless v2, `pgcrypto` for UUIDv4 generation.
- **Load Testing**: k6 by Grafana (5 workload scenarios).
- **Monitoring**: Application-level telemetry middleware + AWS CloudWatch (`ServerlessDatabaseCapacity`, `ACUUtilization`, `CPUUtilization`).
- **Containerization**: Docker & Docker Compose.

---

## 4. Folder Structure

```text
aurora-admissions-project/
├── backend/                        # Node.js + Express REST API
│   ├── src/
│   │   ├── config/                 # Database pool and environment config
│   │   ├── controllers/            # Request handlers
│   │   ├── db/queries/             # Parameterized SQL query modules
│   │   ├── middleware/             # Error handling, rate limiting, metrics collector
│   │   ├── routes/                 # Express API routes
│   │   ├── services/               # Business logic & transaction handling
│   │   ├── utils/                  # Response formatters, error classes, pagination
│   │   ├── app.js                  # Express application setup
│   │   └── index.js                # Server entry point with graceful shutdown
│   ├── tests/                      # Automated API test suite (Node test runner)
│   ├── .env.example                # Backend environment template
│   └── package.json
├── frontend/                       # React 18 + Vite SPA
│   ├── src/
│   │   ├── api/                    # API client layer (fetch)
│   │   ├── components/             # Reusable UI cards, tables, badges, toast
│   │   ├── context/                # Toast notifications context
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── pages/                  # Dashboard, Students, Applications, Metrics, Health
│   │   ├── utils/                  # Date & number formatters
│   │   ├── App.jsx                 # Routing configuration
│   │   └── main.jsx                # Application root
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
├── database/                       # Database scripts (Aurora compatible)
│   ├── schema.sql                  # DDL: tables, indexes, constraints, triggers
│   ├── seed.sql                    # Initial courses, students, and applications
│   └── migrations/
│       └── 001_initial_schema.sql  # Transactional schema migration
├── load-tests/                     # k6 Load Testing Scenarios
│   ├── config.js                   # Shared k6 helpers, data generators, URL overrides
│   ├── smoke.js                    # Scenario 1: Sanity smoke verification (2 VUs)
│   ├── normal-load.js              # Scenario 2: Normal admissions traffic (10 VUs)
│   ├── spike-test.js               # Scenario 3: Deadline surge rush (100 VUs in 10s)
│   ├── sustained-load.js           # Scenario 4: Extended peak admissions (50 VUs)
│   └── recovery-test.js            # Scenario 5: Rapid drop & cooldown (80 -> 5 VUs)
├── scripts/                        # Utility scripts
│   ├── generate-test-data.js       # Configurable batch test data generator
│   ├── run-tests.sh                # Linux/macOS automated test runner
│   └── run-tests.ps1               # Windows PowerShell test runner
├── docs/                           # Detailed Technical Documentation
│   ├── architecture.md             # System architecture & connection pool mechanics
│   ├── database.md                 # ER diagram, table descriptions, index rationales
│   ├── api.md                      # Exhaustive REST API specification
│   ├── load-testing.md             # Comprehensive k6 execution guide
│   ├── aws-setup.md                # 16-step manual Aurora configuration guide
│   ├── cloudwatch.md               # CloudWatch dashboard setup & metrics guide
│   ├── experiments.md              # Scaling lag & ACU comparison experiment templates
│   ├── cost-analysis.md            # Aurora pricing formulas & cost calculation templates
│   └── troubleshooting.md          # 16 detailed troubleshooting scenarios
├── docker-compose.yml              # Local PostgreSQL container configuration
├── .env.example                    # Unified root environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # Monorepo management scripts
└── README.md                       # Master project documentation
```

---

## 5. Prerequisites

Before starting, ensure you have the following installed:
1. **Node.js**: v18.0.0 or higher (`node -v`)
2. **npm**: v9.0.0 or higher (`npm -v`)
3. **Docker Desktop**: Running locally (`docker --version`)
4. **k6**: Required for running load tests (`k6 version`)
   - Windows: `choco install k6` or `winget install k6`
   - macOS: `brew install k6`
   - Linux: `sudo apt install k6`
5. **psql** (optional, recommended for manual SQL queries): `psql --version`

---

## 6. Local Setup

Clone the repository and install all dependencies:

```bash
# 1. Clone repo and navigate into project
cd "d:\Projects\AWS Project\aurora-admissions-project"

# 2. Install all dependencies across root, backend, and frontend
npm run install:all
```

---

## 7. PostgreSQL Setup (Local Docker)

Spin up a local PostgreSQL 15 instance via Docker Compose:

```bash
# Start local PostgreSQL container (schema and seed run automatically)
npm run db:setup
```

To verify the database container is healthy:
```bash
docker ps
```

---

## 8. Environment Variables

Create `.env` in the root directory (and in `backend/`):

```bash
# Windows PowerShell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
```

Default local configuration:
```env
PORT=3001
NODE_ENV=development

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=aurora_admissions
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_SSL=false

DB_POOL_MAX=25
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
DB_QUERY_TIMEOUT=30000

CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=5000
VITE_API_URL=http://localhost:3001
```

---

## 9. Database Migration

If you need to manually apply or reset the database schema:

```bash
# Apply schema
psql -h localhost -p 5432 -U postgres -d aurora_admissions -f database/schema.sql
```

---

## 10. Seed Data Generation

The database includes default seed courses and sample records in `database/seed.sql`. To generate thousands of realistic records for performance testing:

```bash
# Generate 1,000 students and 2,000 applications
npm run generate:data -- --students=1000 --applications=2000

# Custom volume for large-scale stress testing
node scripts/generate-test-data.js --students=5000 --applications=10000
```

---

## 11. Running Frontend

Start the Vite development server:

```bash
npm run dev:frontend
```
Open your browser at `http://localhost:5173`.

---

## 12. Running Backend

In a separate terminal, launch the Express API server:

```bash
npm run dev:backend
```
The server will start on `http://localhost:3001`.

Verify health:
```bash
curl http://localhost:3001/api/health
```

---

## 13. Running Automated Tests

Run the built-in test suite to verify all API routes, database transactions, and validation rules:

```bash
npm test
```

---

## 14. Running k6 Load Tests

Ensure the backend server is running, then execute any scenario:

```bash
# Scenario 1: Sanity Smoke Check
k6 run load-tests/smoke.js

# Scenario 2: Normal Routine Admissions Traffic
k6 run load-tests/normal-load.js

# Scenario 3: Sudden Deadline Surge (5 -> 100 VUs in 10s)
k6 run load-tests/spike-test.js

# Scenario 4: Sustained Peak Admissions (50 VUs for 5 min)
k6 run load-tests/sustained-load.js

# Scenario 5: Rapid Recovery & Scale-Down (80 -> 5 VUs)
k6 run load-tests/recovery-test.js
```

---

## 15. Connecting to Amazon Aurora Serverless v2

To switch from local PostgreSQL to AWS Aurora:
1. Provision your Aurora Serverless v2 PostgreSQL cluster per [docs/aws-setup.md](docs/aws-setup.md).
2. Obtain the **Cluster Writer Endpoint** from the RDS Console.
3. Update `.env`:
   ```env
   DATABASE_HOST=aurora-admissions-cluster.cluster-xxxx.us-east-1.rds.amazonaws.com
   DATABASE_PORT=5432
   DATABASE_NAME=aurora_admissions
   DATABASE_USER=admissions_admin
   DATABASE_PASSWORD=YourMasterPasswordHere
   DATABASE_SSL=true
   ```
4. Run `schema.sql` and `seed.sql` against the Aurora endpoint.
5. Restart your backend: `npm run dev:backend`.
6. Test connectivity at `http://localhost:3001/api/health`.

---

## 16. CloudWatch Monitoring

When connected to Aurora, open AWS CloudWatch and monitor:
- `ServerlessDatabaseCapacity`: Instantaneous ACUs allocated (0.5 to 16).
- `ACUUtilization`: Percentage of allocated ACU capacity actively in use.
- `CPUUtilization`: Host CPU percentage.
- `DatabaseConnections`: Number of open client connections.

See [docs/cloudwatch.md](docs/cloudwatch.md) for step-by-step instructions on creating a dedicated CloudWatch dashboard.

---

## 17. Troubleshooting

Detailed solutions for connection timeouts, security group configuration, SSL errors, pool exhaustion, and scaling lag can be found in [docs/troubleshooting.md](docs/troubleshooting.md).

---

## 18. Performance Experiments & Cost Analysis

- **Experiment 1 (Scaling Lag)**: Documented in [docs/experiments.md](docs/experiments.md). Measures P95/P99 latency spikes and timeouts during sudden 10-second traffic surges.
- **Experiment 2 (Minimum ACU Comparison)**: Compares performance and cold starts between Min 0.5 ACU, Min 2.0 ACU, and Min 4.0 ACU.
- **Cost Analysis**: Step-by-step formulas and calculation templates are provided in [docs/cost-analysis.md](docs/cost-analysis.md).
