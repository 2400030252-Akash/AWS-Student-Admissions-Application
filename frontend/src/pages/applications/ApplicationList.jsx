import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { getApplications, deleteApplication } from '../../api/applications';
import { getCourses } from '../../api/courses';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import './ApplicationList.css';

const ApplicationList = () => {
  const [apps, setApps] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchCoursesList = async () => {
      try {
        const res = await getCourses();
        const data = res?.data?.courses || res?.data || res || [];
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load courses', err);
      }
    };
    fetchCoursesList();
  }, []);

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(courseFilter ? { course_id: courseFilter } : {})
      }).toString();

      const res = await getApplications(`?${params}`);
      const data = res?.data || res;
      setApps(data?.applications || []);
      if (data?.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, courseFilter]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }
    try {
      await deleteApplication(id);
      addToast('Application deleted successfully', 'success');
      fetchApps();
    } catch (err) {
      addToast(err.message || 'Failed to delete application', 'error');
    }
  };

  const columns = [
    { header: 'Application No.', accessor: 'application_number' },
    { 
      header: 'Student', 
      render: (row) => (
        <div>
          <div style={{ fontWeight: '500' }}>{row.student_name || 'N/A'}</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>{row.student_email}</div>
        </div>
      )
    },
    { header: 'Course', accessor: 'course_name' },
    { header: 'Academic Year', accessor: 'academic_year' },
    { header: 'Percentage', render: (row) => `${row.percentage}%` },
    { header: 'Type', accessor: 'application_type' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Submitted', render: (row) => formatDate(row.created_at) },
    { 
      header: 'Actions', 
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={(e) => { e.stopPropagation(); navigate(`/applications/${row.id}`); }}
          >
            Review
          </button>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={(e) => handleDelete(row.id, e)}
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="applications-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Admission Applications</h1>
          <p className="text-muted" style={{ margin: '4px 0 0 0', color: '#666' }}>
            Total Applications: {totalCount}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/applications/new')}>
          + New Application
        </button>
      </div>
      
      <div className="filters-bar" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <select 
          className="form-control" 
          style={{ maxWidth: '200px' }} 
          value={statusFilter} 
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select 
          className="form-control" 
          style={{ maxWidth: '280px' }} 
          value={courseFilter} 
          onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Courses</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading && apps.length === 0 ? (
        <LoadingSpinner />
      ) : error && apps.length === 0 ? (
        <ErrorState message={error} onRetry={fetchApps} />
      ) : apps.length === 0 ? (
        <EmptyState 
          message="No applications found" 
          action={<button className="btn btn-primary" onClick={() => navigate('/applications/new')}>Create First Application</button>} 
        />
      ) : (
        <>
          <DataTable columns={columns} data={apps} onRowClick={(row) => navigate(`/applications/${row.id}`)} />
          
          {totalPages > 1 && (
            <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ApplicationList;
