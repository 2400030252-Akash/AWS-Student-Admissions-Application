# CloudWatch Monitoring Guide

Monitoring Aurora Serverless v2 is crucial to understanding its scaling behavior and performance under load.

## Step-by-Step Setup
1. Log in to the AWS Management Console.
2. Navigate to the **CloudWatch** service.
3. On the left sidebar, click **Metrics** > **All metrics**.
4. Select the **RDS** namespace.
5. Select **Per-Database Metrics** (or **DBClusterIdentifier**).

## Key Metrics to Monitor
Search for your `aurora-admissions-cluster` and select the following key metrics:

- `ServerlessDatabaseCapacity`: Shows the current Aurora Capacity Units (ACUs) allocated to your database.
- `ACUUtilization`: The percentage of the allocated ACUs that are actively being used.
- `CPUUtilization`: The percentage of allocated compute power currently in use.
- `DatabaseConnections`: The number of client sessions connected to the DB.
- `ReadLatency` / `WriteLatency`: The average amount of time taken per disk I/O operation.
- `NetworkThroughput`: The volume of network traffic to/from the database.
- `FreeableMemory`: The amount of available RAM.
- `BufferCacheHitRatio`: The percentage of requests served from RAM instead of disk (should be high).

*Note: Verify metric availability as some metrics depend on the exact engine version.*

## Creating a Dashboard
1. Go to CloudWatch > **Dashboards**.
2. Click **Create dashboard** and name it `Aurora-Admissions-Load-Test`.
3. Click **Add widget** > **Line** > **Metrics**.
4. Find and select the `ServerlessDatabaseCapacity` metric for your cluster. Click **Create widget**.
5. Repeat to add widgets for `DatabaseConnections`, `CPUUtilization`, and `ReadLatency`.

## Monitoring During Load Tests
- When running k6 tests, set the dashboard time range to **Custom** (e.g., the last 30 minutes) and enable **Auto-refresh** (e.g., 10 seconds).
- **Compare Normal vs Spike**: Observe the baseline `ServerlessDatabaseCapacity` before the test, and watch how quickly it spikes in response to load. After the test finishes, observe how long it takes for the capacity to scale back down.

## CloudWatch Alarms (Optional)
You can set alarms if metrics cross thresholds.
1. Go to CloudWatch > **Alarms**.
2. Create alarm on `CPUUtilization` > 80%.
3. Choose an SNS topic to receive email alerts.
