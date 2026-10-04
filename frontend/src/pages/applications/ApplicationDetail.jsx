import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplication, updateApplication } from '../../api/applications';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import './ApplicationDetail.css';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApp = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getApplication(id);
      const data = res?.data?.application || res?.data || res;
      setApp(data);
      setNewStatus(data?.status || 'PENDING');
      setRemarks(data?.remarks || '');
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch application details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await updateApplication(id, { 
        status: newStatus, 
        remarks 
      });
      addToast(`Status updated to ${newStatus} successfully`, 'success');
      fetchApp();
    } catch (err) {
      addToast(err.message || 'Error updating status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchApp} />;
  if (!app) return <div>Application record not found.</div>;

  const events = app.events || [];

  return (
    <div className="app-detail">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Application {app.application_number}</h2>
          <span className="text-muted" style={{ color: '#666' }}>Submitted on {formatDate(app.created_at)}</span>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/applications')}>
          &larr; Back to Applications
        </button>
      </div>

      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="info-card student-info" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 }}>Student Profile</h3>
          <p><strong>Name:</strong> {app.student_name || 'N/A'}</p>
          <p><strong>Email:</strong> {app.student_email || 'N/A'}</p>
          <p><strong>Phone:</strong> {app.student_phone || 'N/A'}</p>
          {app.student_id && (
            <p>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ marginTop: '8px' }}
                onClick={() => navigate(`/students/${app.student_id}`)}
              >
                View Full Student Profile
              </button>
            </p>
          )}
        </div>

        <div className="info-card app-info" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 }}>Course & Admission Info</h3>
          <p><strong>Course:</strong> {app.course_name} ({app.course_code})</p>
          <p><strong>Academic Year:</strong> {app.academic_year}</p>
          <p><strong>Application Type:</strong> {app.application_type}</p>
          <p><strong>Previous Qualification:</strong> {app.previous_qualification}</p>
          <p><strong>Percentage:</strong> <strong style={{ color: '#1a237e' }}>{app.percentage}%</strong></p>
          {app.reviewed_at && (
            <p><strong>Reviewed At:</strong> {formatDate(app.reviewed_at)}</p>
          )}
        </div>
      </div>

      <div className="status-section" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0 }}>Application Status & Decision</h3>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Current Status:</span>
          <StatusBadge status={app.status} />
        </div>
        
        <div className="update-status-form" style={{ background: '#f8f9fa', padding: '16px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>Reviewer Action</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: '500' }}>Change Status</label>
              <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="PENDING">PENDING</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: '500' }}>Remarks</label>
              <input 
                type="text"
                className="form-control" 
                placeholder="Remarks or reason for status update..." 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleStatusUpdate} 
            disabled={updating || (newStatus === app.status && remarks === (app.remarks || ''))}
          >
            {updating ? 'Saving Changes...' : 'Save Decision'}
          </button>
        </div>
      </div>

      <div className="audit-timeline-section" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ marginTop: 0 }}>Event Audit Trail</h3>
        {events.length === 0 ? (
          <p className="text-muted">No status events logged yet.</p>
        ) : (
          <div className="timeline-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map((ev, index) => (
              <div 
                key={ev.id || index} 
                style={{ 
                  borderLeft: '3px solid #1a237e', 
                  paddingLeft: '14px', 
                  paddingBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#1a237e' }}>{ev.event_type}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>{formatDate(ev.created_at)}</span>
                </div>
                {ev.old_status && ev.new_status ? (
                  <div style={{ fontSize: '0.9rem', margin: '4px 0' }}>
                    Status changed: <span style={{ textDecoration: 'line-through', color: '#888' }}>{ev.old_status}</span> &rarr; <strong>{ev.new_status}</strong>
                  </div>
                ) : ev.new_status ? (
                  <div style={{ fontSize: '0.9rem', margin: '4px 0' }}>
                    Initial status: <strong>{ev.new_status}</strong>
                  </div>
                ) : null}
                {ev.description && (
                  <div style={{ fontSize: '0.85rem', color: '#555', fontStyle: 'italic' }}>
                    {ev.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetail;
