import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { getStudents, deleteStudent } from '../../api/students';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import './StudentList.css';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search ? { search } : {})
      }).toString();

      const res = await getStudents(`?${queryParams}`);
      const data = res?.data || res;
      setStudents(data?.students || []);
      if (data?.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchStudents]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this student? All their applications will also be deleted.')) {
      return;
    }
    try {
      await deleteStudent(id);
      addToast('Student deleted successfully', 'success');
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Failed to delete student', 'error');
    }
  };

  const columns = [
    { header: 'Full Name', accessor: 'full_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'City', accessor: 'city' },
    { header: 'State', accessor: 'state' },
    { header: 'Registered On', render: (row) => formatDate(row.created_at) },
    { 
      header: 'Actions', 
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={(e) => { e.stopPropagation(); navigate(`/students/${row.id}`); }}
          >
            Edit
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
    <div className="students-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Students</h1>
          <p className="text-muted" style={{ margin: '4px 0 0 0', color: '#666' }}>
            Total Registered: {totalCount}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/students/new')}>
          + Register Student
        </button>
      </div>
      
      <div className="filters-bar" style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search by name, email, or city..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: '350px' }}
        />
      </div>

      {loading && students.length === 0 ? (
        <LoadingSpinner />
      ) : error && students.length === 0 ? (
        <ErrorState message={error} onRetry={fetchStudents} />
      ) : students.length === 0 ? (
        <EmptyState 
          message={search ? `No students found matching "${search}"` : "No students registered yet"} 
          action={<button className="btn btn-primary" onClick={() => navigate('/students/new')}>Register First Student</button>} 
        />
      ) : (
        <>
          <DataTable columns={columns} data={students} onRowClick={(row) => navigate(`/students/${row.id}`)} />
          
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

export default StudentList;
