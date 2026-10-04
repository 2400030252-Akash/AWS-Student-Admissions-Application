import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createStudent, getStudent, updateStudent } from '../../api/students';
import { useToast } from '../../hooks/useToast';
import './StudentForm.css';

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', date_of_birth: '',
    gender: 'Male', address: '', city: '', state: '', pincode: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchStudent = async () => {
        try {
          const res = await getStudent(id);
          const s = res?.data?.student || res?.student || res;
          if (s) {
            setFormData({
              full_name: s.full_name || '',
              email: s.email || '',
              phone: s.phone || '',
              date_of_birth: s.date_of_birth ? s.date_of_birth.split('T')[0] : '',
              gender: s.gender || 'Male',
              address: s.address || '',
              city: s.city || '',
              state: s.state || '',
              pincode: s.pincode || ''
            });
          }
        } catch (err) {
          addToast('Failed to load student', 'error');
        }
      };
      fetchStudent();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim() || !/^[0-9]{10,15}$/.test(formData.phone)) newErrors.phone = 'Valid phone (10-15 digits) is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await updateStudent(id, formData);
        addToast('Student updated successfully', 'success');
      } else {
        await createStudent(formData);
        addToast('Student registered successfully', 'success');
      }
      navigate('/students');
    } catch (err) {
      addToast(err.message || 'Error saving student', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>{isEdit ? 'Edit Student' : 'Register New Student'}</h2>
      <form onSubmit={handleSubmit} className="card-form">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={`form-control ${errors.full_name ? 'error' : ''}`} placeholder="Enter full name" />
            {errors.full_name && <span className="error-text">{errors.full_name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={`form-control ${errors.email ? 'error' : ''}`} placeholder="student@example.com" />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`form-control ${errors.phone ? 'error' : ''}`} placeholder="9876543210" />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth *</label>
            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={`form-control ${errors.date_of_birth ? 'error' : ''}`} />
            {errors.date_of_birth && <span className="error-text">{errors.date_of_birth}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Gender *</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="form-control">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Address *</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className={`form-control ${errors.address ? 'error' : ''}`} placeholder="Full address" />
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">City *</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className={`form-control ${errors.city ? 'error' : ''}`} placeholder="City" />
            {errors.city && <span className="error-text">{errors.city}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">State *</label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} className={`form-control ${errors.state ? 'error' : ''}`} placeholder="State" />
            {errors.state && <span className="error-text">{errors.state}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Pincode *</label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={`form-control ${errors.pincode ? 'error' : ''}`} placeholder="400001" />
            {errors.pincode && <span className="error-text">{errors.pincode}</span>}
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/students')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : (isEdit ? 'Update Student' : 'Register Student')}</button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;
