import { pool } from '../config/database.js';

class MetricsCollector {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.requestDurations = [];
    this.dbQueryDurations = [];
    this.dbErrors = 0;
    this.timeouts = 0;
    this.recentHistory = [];
  }

  recordRequest() { this.totalRequests++; }
  recordSuccessfulRequest() { this.successfulRequests++; }
  recordFailedRequest() { this.failedRequests++; }
  
  recordRequestDuration(duration) {
    this.requestDurations.push(duration);
    if (this.requestDurations.length > 2000) this.requestDurations.shift();
  }

  recordDbQuery(duration) {
    this.dbQueryDurations.push(duration);
    if (this.dbQueryDurations.length > 2000) this.dbQueryDurations.shift();
  }

  recordDbError() { this.dbErrors++; }
  recordTimeout() { this.timeouts++; }

  calculatePercentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return Math.round((sorted[base] + rest * (sorted[base + 1] - sorted[base])) * 100) / 100;
    } else {
      return Math.round(sorted[base] * 100) / 100;
    }
  }

  getMetrics() {
    const reqAvg = this.requestDurations.length 
      ? Math.round((this.requestDurations.reduce((a, b) => a + b, 0) / this.requestDurations.length) * 100) / 100 
      : 0;
    const dbAvg = this.dbQueryDurations.length 
      ? Math.round((this.dbQueryDurations.reduce((a, b) => a + b, 0) / this.dbQueryDurations.length) * 100) / 100 
      : 0;

    const successRate = this.totalRequests > 0 
      ? Math.round((this.successfulRequests / this.totalRequests) * 10000) / 100 
      : 100;

    const totalConnections = pool?.totalCount || 0;
    const idleConnections = pool?.idleCount || 0;
    const activeConnections = Math.max(0, totalConnections - idleConnections);
    const waitingRequests = pool?.waitingCount || 0;

    return {
      note: 'These are application-level metrics. Aurora capacity (ACU) metrics must be obtained from AWS CloudWatch after connecting the application to Aurora Serverless v2.',
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate,
      dbErrors: this.dbErrors,
      timeouts: this.timeouts,
      pool: {
        total: totalConnections,
        active: activeConnections,
        idle: idleConnections,
        waiting: waitingRequests
      },
      latencies: {
        requests: {
          avg: reqAvg,
          p50: this.calculatePercentile(this.requestDurations, 0.5),
          p95: this.calculatePercentile(this.requestDurations, 0.95),
          p99: this.calculatePercentile(this.requestDurations, 0.99),
        },
        database: {
          avg: dbAvg,
          p50: this.calculatePercentile(this.dbQueryDurations, 0.5),
          p95: this.calculatePercentile(this.dbQueryDurations, 0.95),
          p99: this.calculatePercentile(this.dbQueryDurations, 0.99),
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const metrics = new MetricsCollector();