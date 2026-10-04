import React, { useEffect, useState, useCallback } from 'react';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getHealth } from '../../api/health';
import './SystemHealth.css';

const SystemHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await getHealth();
      const data = res?.data || res;
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError('Cannot reach backend server. Please verify backend is running on port 3001.');
      setHealthData(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const isDbConnected = healthData?.database === 'connected';
  const isHealthy = healthData?.status === 'healthy' && isDbConnected;

  if (loading && !healthData && !error) return <LoadingSpinner />;

  return (
    <div className="system-health">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>System Health & Connectivity</h1>
          <p className="text-muted" style={{ margin: '4px 0 0 0', color: '#666' }}>
            Live status of Express backend and PostgreSQL / Aurora connection pool
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchHealth}>
          Check Now
        </button>
      </div>
      
      <div className="health-status-container" style={{
        background: isHealthy ? '#e8f5e9' : '#ffebee',
        border: `1px solid ${isHealthy ? '#c8e6c9' : '#ffcdd2'}`,
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: isHealthy ? '#2e7d32' : '#c62828',
          boxShadow: isHealthy ? '0 0 12px #2e7d32' : '0 0 12px #c62828'
        }} />
        <div>
          <h2 style={{ margin: 0, color: isHealthy ? '#1b5e20' : '#b71c1c' }}>
            {error ? 'System Unreachable' : isHealthy ? 'All Systems Operational' : 'Degraded / Database Disconnected'}
          </h2>
          <div style={{ color: '#555', marginTop: '4px' }}>
            Last verified: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
          </div>
        </div>
      </div>

      {healthData && (
        <div className="health-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <Card title="Node.js API Server">
            <ul className="details-list" style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
              <li><strong>Status:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>ONLINE</span></li>
              <li><strong>Environment:</strong> {healthData.environment || 'development'}</li>
              <li><strong>Server Timestamp:</strong> {healthData.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'N/A'}</li>
              <li><strong>Architecture:</strong> RESTful Express + pg Pool</li>
            </ul>
          </Card>
          
          <Card title="PostgreSQL / Aurora Database">
            <ul className="details-list" style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2' }}>
              <li>
                <strong>Database State:</strong> 
                <span style={{ 
                  color: isDbConnected ? '#2e7d32' : '#c62828', 
                  fontWeight: 'bold', 
                  marginLeft: '8px' 
                }}>
                  {isDbConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </li>
              <li><strong>Engine Compatibility:</strong> PostgreSQL 15+ / Aurora Serverless v2</li>
              <li><strong>Pool Total Clients:</strong> {healthData.poolInfo?.total ?? 0}</li>
              <li><strong>Pool Idle Clients:</strong> {healthData.poolInfo?.idle ?? 0}</li>
              <li><strong>Queries Waiting in Queue:</strong> {healthData.poolInfo?.waiting ?? 0}</li>
            </ul>
          </Card>
        </div>
      )}
      
      {error && (
        <div className="error-alert" style={{ background: '#fff3cd', border: '1px solid #ffeeba', color: '#856404', padding: '16px 20px', borderRadius: '8px' }}>
          <strong>Error Encountered:</strong> {error}
          <p style={{ margin: '8px 0 0 0' }}>
            Make sure the backend is running via <code>npm run dev:backend</code> or <code>npm start</code> inside the <code>backend/</code> directory.
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
