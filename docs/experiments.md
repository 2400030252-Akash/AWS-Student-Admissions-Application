# Scaling Experiments

## EXPERIMENT 1: Scaling Lag / Timeout Detection

**Goal**: Determine if there is noticeable latency or application timeouts during the rapid scaling phase when load hits suddenly.

### Results Template

| Metric | Baseline (Pre-test) | Spike (During k6 ramp-up) | Recovery (Post-test) |
| --- | --- | --- | --- |
| P50 Latency (ms) | | | |
| P95 Latency (ms) | | | |
| P99 Latency (ms) | | | |
| Error Rate (%) | | | |
| Timeout Rate (%) | | | |
| Aurora ACU | | | |
| Time to Scale (sec)| N/A | | N/A |

## EXPERIMENT 2: Minimum ACU Comparison

**Goal**: Evaluate the performance and cost trade-offs of setting different Minimum ACU limits.

**Instructions**:
1. Go to RDS Console > Databases > select cluster > Modify.
2. Change Minimum ACU to the required value (0.5, 2.0, 4.0).
3. Apply immediately. Wait for cluster status to become 'Available'.
4. Run the standard spike test for each configuration.

### Results Template

| Metric | Config A (Min 0.5 ACU) | Config B (Min 2.0 ACU) | Config C (Min 4.0 ACU) |
| --- | --- | --- | --- |
| Avg ACU | | | |
| Peak ACU | | | |
| Avg Latency (ms) | | | |
| P95 Latency (ms) | | | |
| Errors (%) | | | |
| Cold Start Time (s)| | | |
| Approx. Cost/Hr | | | |

## Analysis Questions
- At 0.5 Min ACU, were there any initial timeouts during the spike?
- Did a higher Min ACU (2.0 or 4.0) completely eliminate scaling lag?
- Based on the cost vs performance trade-off, which Min ACU is recommended for production?
