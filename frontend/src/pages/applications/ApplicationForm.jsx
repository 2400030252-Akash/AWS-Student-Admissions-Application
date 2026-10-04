import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApplication } from '../../api/applications';
import { getStudents } from '../../api/students';
import { getCourses } from '../../api/courses';
import { useToast } from '../../hooks/useToast';
import './ApplicationForm.css';

const ApplicationForm = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}-${currentYear + 1}`;

  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    academic_year: defaultAcademicYear,
    previous_qualification: '',
    percentage: '',
    application_type: 'REGULAR'
  });
  
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);
        const [sRes, cRes] = await Promise.all([
          getStudents('?limit=100'),
          getCourses()
        ]);
        const sData = sRes?.data?.students || sRes?.data || sRes || [];
        const cData = cRes?.data?.courses || cRes?.data || cRes || [];
        setStudents(Array.isArray(sData) ? sData : []);
        setCourses(Array.isArray(cData) ? cData : []);
      } catch (err) {
        addToast('Failed to load students or courses', 'error');
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.student_id) errs.student_id = 'Please select a student';
    if (!formData.course_id) errs.course_id = 'Please select a course';
    if (!formData.academic_year || !/^\d{4}-\d{4}$/.test(formData.academic_year)) {
      errs.academic_year = 'Format must be YYYY-YYYY (e.g. 2024-2025)';
    }
    if (!formData.previous_qualification.trim()) {
      errs.previous_qualification = 'Previous qualification is required (e.g. 12th Standard, Diploma)';
    }
    const p = parseFloat(formData.percentage);
    if (isNaN(p) || p < 0 || p > 100) {
      errs.percentage = 'Percentage must be between 0 and 100';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await createApplication({
        student_id: formData.student_id,
        course_id: formData.course_id,
        academic_year: formData.academic_year,
        previous_qualification: formData.previous_qualification,
        percentage: parseFloat(formData.percentage),
        application_type: formData.application_type
      });
      addToast('Application submitted successfully!', 'success');
      navigate('/applications');
    } catch (err) {
      addToast(err.message || 'Error submitting application', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading student and course lists...</div>;
  }

  return (
    <div className="form-container">
      <h2>Submit New Admission Application</h2>
      <p className="text-muted" style={{ marginBottom: '24px', color: '#666' }}>
        Select a registered student and enroll them in a university course.
      </p>

      {students.length === 0 && (
        <div className="alert alert-warning" style={{ background: '#fff3cd', padding: '12px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
          No registered students found. <button className="btn btn-secondary btn-sm" onClick={() => navigate('/students/new')}>Register a Student First</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-form">
        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Student *</label>
            <select 
              name="student_id" 
              value={formData.student_id} 
              onChange={handleChange} 
              className={`form-control ${errors.student_id ? 'error' : ''}`}
            >
              <option value="">-- Choose a Student --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.email}) - {s.city || 'No City'}
                </option>
              ))}
            </select>
            {errors.student_id && <span className="error-text">{errors.student_id}</span>}
          </div>

          <div className="form-group full-width">
            <label className="form-label">Course *</label>
            <select 
              name="course_id" 
              value={formData.course_id} 
              onChange={handleChange} 
              className={`form-control ${errors.course_id ? 'error' : ''}`}
            >
              <option value="">-- Choose an Academic Course --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) - {c.duration_years || 4} Years
                </option>
              ))}
            </select>
            {errors.course_id && <span className="error-text">{errors.course_id}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Academic Year *</label>
            <input 
              type="text" 
              name="academic_year" 
              value={formData.academic_year} 
              onChange={handleChange} 
              className={`form-control ${errors.academic_year ? 'error' : ''}`}
              placeholder="e.g. 2024-2025" 
            />
            {errors.academic_year && <span className="error-text">{errors.academic_year}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Application Type *</label>
            <select 
              name="application_type" 
              value={formData.application_type} 
              onChange={handleChange} 
              className="form-control"
            >
              <option value="REGULAR">Regular Admission</option>
              <option value="LATERAL">Lateral Entry</option>
              <option value="MANAGEMENT">Management Quota</option>
              <option value="NRI">NRI Quota</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Previous Qualification *</label>
            <input 
              type="text" 
              name="previous_qualification" 
              value={formData.previous_qualification} 
              onChange={handleChange} 
              className={`form-control ${errors.previous_qualification ? 'error' : ''}`}
              placeholder="e.g. 12th CBSE / Higher Secondary" 
            />
            {errors.previous_qualification && <span className="error-text">{errors.previous_qualification}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Percentage Obtained (%) *</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              max="100" 
              name="percentage" 
              value={formData.percentage} 
              onChange={handleChange} 
              className={`form-control ${errors.percentage ? 'error' : ''}`}
              placeholder="e.g. 88.5" 
            />
            {errors.percentage && <span className="error-text">{errors.percentage}</span>}
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/applications')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
