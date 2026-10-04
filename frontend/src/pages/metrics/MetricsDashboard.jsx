import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Legend, CartesianGrid, Cell 
} from 'recharts';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import { getMetrics } from '../../api/metrics';
import './MetricsDashboard.css';

const MetricsDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await getMetrics();
      const data = res?.data || res;
      setMetrics(data);
      setError(null);

      // Append to rolling history (max 30 points)
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const newPoint = {
        time: timeStr,
        reqAvg: data?.latencies?.requests?.avg || 0,
        reqP95: data?.latencies?.requests?.p95 || 0,
        reqP99: data?.latencies?.requests?.p99 || 0,
        dbAvg: data?.latencies?.database?.avg || 0,
        dbP95: data?.latencies?.database?.p95 || 0,
        activeConn: data?.pool?.active || 0,
        totalReq: data?.totalRequests || 0
      };

      const updatedHistory = [...historyRef.current, newPoint].slice(-30);
      historyRef.current = updatedHistory;
      setHistory(updatedHistory);
    } catch (err) {
      setError('Metrics API unreachable. Verify that backend is running at http://localhost:3001.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 3000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  if (loading && !metrics) return <LoadingSpinner />;
  if (error && !metrics) return <ErrorState message={error} onRetry={fetchMetrics} />;

  const reqDistribution = [
    { name: 'Successful', count: metrics?.successfulRequests || 0, color: '#2e7d32' },
    { name: 'Failed', count: metrics?.failedRequests || 0, color: '#c62828' },
    { name: 'Timeouts', count: metrics?.timeouts || 0, color: '#f57f17' }
  ];

  return (
    <div className="metrics-dashboard">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1>Performance & Load Testing Metrics</h1>
          <p className="text-muted" style={{ margin: '4px 0 0 0', color: '#666' }}>
            Real-time telemetry captured during k6 load testing scenarios
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.95rem' }}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={e => setAutoRefresh(e.target.checked)} 
            />
            Auto-refresh (3s)
          </label>
          <button className="btn btn-primary btn-sm" onClick={fetchMetrics}>
            Refresh Now
          </button>
        </div>
      </div>

      <div className="info-banner" style={{
        background: '#e8f4fd',
        border: '1px solid #b6e0fe',
        color: '#084298',
        padding: '16px 20px',
        borderRadius: '8px',
        marginBottom: '24px',
        fontSize: '0.95rem',
        lineHeight: '1.5'
      }}>
        <strong>NOTICE:</strong> These are <strong>APPLICATION-LEVEL</strong> metrics measured by the Node.js Express server and PostgreSQL connection pool. 
        Database engine metrics such as <em>ServerlessDatabaseCapacity (ACUs)</em>, <em>ACUUtilization</em>, and <em>BufferCacheHitRatio</em> must be monitored directly via <strong>AWS CloudWatch</strong> when connected to Amazon Aurora PostgreSQL Serverless v2.
      </div>

      <h2 style={{ marginTop: '20px', marginBottom: '16px' }}>HTTP Request Telemetry</h2>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card title="Total Requests" value={metrics?.totalRequests || 0} colorClass="indigo" />
        <Card title="Success Rate" value={`${metrics?.successRate || 100}%`} colorClass="green" />
        <Card title="Avg Latency" value={`${metrics?.latencies?.requests?.avg || 0} ms`} colorClass="blue" />
        <Card title="P95 Latency" value={`${metrics?.latencies?.requests?.p95 || 0} ms`} colorClass="yellow" />
        <Card title="P99 Latency" value={`${metrics?.latencies?.requests?.p99 || 0} ms`} colorClass="red" />
        <Card title="Request Timeouts" value={metrics?.timeouts || 0} colorClass="red" />
      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="chart-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>HTTP Latency Over Time (ms)</h3>
          <div style={{ height: 280 }}>
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis unit="ms" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reqAvg" stroke="#1a237e" strokeWidth={2} name="Avg Latency" dot={false} />
                  <Line type="monotone" dataKey="reqP95" stroke="#f57f17" strokeWidth={2} name="P95 Latency" dot={false} />
                  <Line type="monotone" dataKey="reqP99" stroke="#c62828" strokeWidth={2} name="P99 Latency" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
                Accumulating latency samples... Run k6 load tests to view dynamic scaling curves.
              </div>
            )}
          </div>
        </div>

        <div className="chart-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Request Execution Breakdown</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reqDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {reqDistribution.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: '20px', marginBottom: '16px' }}>Database Query & Connection Pool Telemetry</h2>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card title="Active DB Connections" value={metrics?.pool?.active || 0} colorClass="indigo" />
        <Card title="Idle DB Connections" value={metrics?.pool?.idle || 0} colorClass="cyan" />
        <Card title="Total Pool Size" value={metrics?.pool?.total || 0} colorClass="blue" />
        <Card title="Waiting in Queue" value={metrics?.pool?.waiting || 0} colorClass="yellow" />
        <Card title="DB Query Avg Latency" value={`${metrics?.latencies?.database?.avg || 0} ms`} colorClass="green" />
        <Card title="Database Errors" value={metrics?.dbErrors || 0} colorClass="red" />
      </div>

      <div className="chart-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Database Latency & Pool Saturation Over Time</h3>
        <div style={{ height: 260 }}>
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" unit="ms" />
                <YAxis yAxisId="right" orientation="right" unit=" conns" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="dbAvg" stroke="#2e7d32" strokeWidth={2} name="DB Avg Latency (ms)" dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="dbP95" stroke="#f57f17" strokeWidth={2} name="DB P95 Latency (ms)" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="activeConn" stroke="#512da8" strokeWidth={2} name="Active Connections" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
              Accumulating database metrics... Run load tests to observe connection pool scaling.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
