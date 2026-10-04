# Aurora Serverless v2 Cost Analysis & Calculation Methodology

## 1. Aurora Serverless v2 Pricing Model Overview

Aurora Serverless v2 charges based on four core dimensions:
1. **Compute (ACU-Hours)**: Billed per second with a 1-minute minimum.
   - 1 ACU = approx. 2 GiB of RAM + proportional vCPU + network throughput.
   - ACUs dynamically scale in fine-grained increments of 0.5 ACU.
2. **Cluster Storage**: Billed per GB-month of actual data stored.
3. **I/O Requests (Aurora Standard)**: Billed per million I/O read/write requests.
   *(Note: If using Aurora I/O-Optimized, I/O requests are included at a higher baseline compute rate).*
4. **Backup Storage**: Automated backup retention beyond the size of the cluster storage.
5. **AWS CloudWatch Metrics**: Custom metric ingestion and dashboard charges (first 10 metrics and 3 dashboards are generally free tier).

> [!IMPORTANT]
> **Verify Current AWS Pricing**: Cloud pricing changes periodically and varies by region. Always check the official [AWS Aurora Pricing Page](https://aws.amazon.com/rds/aurora/pricing/) for current figures before finalizing financial projections.

---

## 2. Mathematical Cost Formulas

### A. Compute Cost Calculation
$$\text{ACU-Hours} = \text{Average ACUs} \times \text{Hours in Period}$$
$$\text{Compute Cost} = \text{ACU-Hours} \times \text{Price per ACU-Hour}$$

### B. Storage Cost Calculation
$$\text{Storage Cost} = \text{Average Storage (GB)} \times \text{Storage Price per GB-Month}$$

### C. Total Monthly Database Cost
$$\text{Total Cost} = \text{Compute Cost} + \text{Storage Cost} + \text{I/O Cost} + \text{Backup Cost}$$

---

## 3. Academic Cost Modeling Template

Fill in this table using your chosen AWS Region (e.g. `us-east-1` or `ap-south-1`):

| Cost Factor | Unit | Unit Rate (Enter Actual AWS Price) | Monthly Usage Estimate | Total Monthly Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Aurora ACU-Hour** | per ACU-Hour | \$ \_\_\_\_\_\_\_ | \_\_\_\_\_\_\_ ACU-hrs | \$ \_\_\_\_\_\_\_ |
| **Cluster Storage** | per GB-Month | \$ \_\_\_\_\_\_\_ | \_\_\_\_\_\_\_ GB | \$ \_\_\_\_\_\_\_ |
| **Database I/O** | per 1M Requests | \$ \_\_\_\_\_\_\_ | \_\_\_\_\_\_\_ M requests | \$ \_\_\_\_\_\_\_ |
| **Backup Storage** | per GB-Month | \$ \_\_\_\_\_\_\_ | \_\_\_\_\_\_\_ GB | \$ \_\_\_\_\_\_\_ |
| **Total Estimated Cost** | — | — | — | **\$ \_\_\_\_\_\_\_** |

---

## 4. Minimum ACU Configuration Cost Comparison

In this academic experiment, evaluate the economic cost of maintaining higher baseline readiness vs. scaling up on demand:

| Configuration | Min ACU | Idle Monthly ACU-Hours (730h) | Idle Monthly Cost (\$) | Spike Period Cost (30h) (\$) | Combined Monthly Cost (\$) | Scaling Lag Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Config A: Low Baseline** | 0.5 ACU | 365 ACU-hrs | \$ \_\_\_\_\_\_\_ | \$ \_\_\_\_\_\_\_ | \$ \_\_\_\_\_\_\_ | High (Lag on initial spike) |
| **Config B: Balanced** | 2.0 ACU | 1,460 ACU-hrs | \$ \_\_\_\_\_\_\_ | \$ \_\_\_\_\_\_\_ | \$ \_\_\_\_\_\_\_ | Moderate (Minimal lag) |
| **Config C: High Readiness** | 4.0 ACU | 2,920 ACU-hrs | \$ \_\_\_\_\_\_\_ | \$ \_\_\_\_\_\_\_ | \$ \_\_\_\_\_\_\_ | Negligible (Immediate capacity) |
| **Config D: Static Provisioned (db.r6g.xlarge)** | 32 GB RAM | Fixed Instance | \$ \_\_\_\_\_\_\_ | Fixed | \$ \_\_\_\_\_\_\_ | None (Always overprovisioned) |

---

## 5. Cost-Benefit Conclusion & Discussion Points

1. **Seasonal Admissions Pattern**: Student admissions traffic is heavily cyclical (90% idle during academic terms, 10% extreme peak during 2–3 weeks of admissions).
2. **Economic Justification**: Compare how much money is saved by letting Aurora sleep at 0.5 ACU for 11 months of the year versus paying for fixed provisioned database capacity.
3. **SLA Compromise**: Discuss whether an initial 10-second scaling lag is acceptable for non-critical admissions workflows, or whether setting `Min ACU = 2.0` during known admission dates is the optimal hybrid strategy.
