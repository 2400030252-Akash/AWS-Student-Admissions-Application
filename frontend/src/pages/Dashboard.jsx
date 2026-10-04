import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import { getApplicationStats } from '../api/applications';
import { formatDate } from '../utils/formatters';
import './Dashboard.css';

const STATUS_COLORS = {
  PENDING: '#f57f17',
  UNDER_REVIEW: '#0277bd',
  APPROVED: '#2e7d32',
  REJECTED: '#c62828'
};

const COURSE_COLORS = ['#1a237e', '#0277bd', '#00695c', '#e65100', '#4a148c', '#1b5e20'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchData = async () => {
    try {
      const res = await getApplicationStats();
      const data = res?.data || res;
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error && !stats) return <ErrorState message={error} onRetry={fetchData} />;

  const statusData = (stats?.byStatus || []).map(item => ({
    name: item.status,
    value: item.count,
    color: STATUS_COLORS[item.status] || '#999'
  }));

  const courseData = (stats?.byCourse || []).map(item => ({
    name: item.courseName?.length > 20 ? item.courseName.substring(0, 18) + '...' : item.courseName,
    count: item.count
  }));

  const columns = [
    { header: 'App No', accessor: 'application_number' },
    { header: 'Student', accessor: 'student_name' },
    { header: 'Course', accessor: 'course_name' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Date', render: (row) => formatDate(row.created_at) }
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="date-display">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="stats-grid">
        <Card title="Total Applications" value={stats?.total || 0} colorClass="indigo" />
        <Card title="Pending" value={stats?.pending || 0} colorClass="yellow" />
        <Card title="Under Review" value={stats?.underReview || 0} colorClass="blue" />
        <Card title="Approved" value={stats?.approved || 0} colorClass="green" />
        <Card title="Rejected" value={stats?.rejected || 0} colorClass="red" />
        <Card title="Today's Applications" value={stats?.today || 0} colorClass="cyan" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Applications by Status</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <h3>Applications by Course</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1a237e">
                  {courseData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={COURSE_COLORS[index % COURSE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <h2>Recent Applications</h2>
        {stats?.recentApplications?.length > 0 ? (
          <DataTable columns={columns} data={stats.recentApplications} />
        ) : (
          <p className="empty-text">No applications yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
