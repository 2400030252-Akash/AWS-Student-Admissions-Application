import { errorResponse } from '../utils/response.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10,15}$/;

export const validateStudent = (req, res, next) => {
  const { full_name, email, phone, date_of_birth, gender, address, city, state, pincode } = req.body;
  const errors = [];

  if (!full_name || full_name.trim().length < 2) errors.push('full_name is required (minimum 2 characters)');
  if (!email || !emailRegex.test(email)) errors.push('Valid email is required');
  if (!phone || !phoneRegex.test(phone)) errors.push('Valid phone number is required (10-15 digits)');
  if (!date_of_birth || isNaN(Date.parse(date_of_birth))) errors.push('Valid date_of_birth is required (YYYY-MM-DD)');
  if (!gender || !['Male', 'Female', 'Other', 'Prefer not to say'].includes(gender)) {
    errors.push('gender is required (Male, Female, Other, Prefer not to say)');
  }
  if (!address || address.trim().length < 3) errors.push('address is required');
  if (!city || city.trim().length < 2) errors.push('city is required');
  if (!state || state.trim().length < 2) errors.push('state is required');
  if (!pincode || pincode.trim().length < 4) errors.push('pincode is required');

  if (errors.length > 0) {
    return errorResponse(res, errors.join('; '), 400, 'VALIDATION_ERROR');
  }
  next();
};

export const validateApplication = (req, res, next) => {
  const { student_id, course_id, academic_year, previous_qualification, percentage } = req.body;
  const errors = [];

  if (!student_id) errors.push('student_id is required');
  if (!course_id) errors.push('course_id is required');
  if (!academic_year || !/^\d{4}-\d{4}$/.test(academic_year)) {
    errors.push('academic_year is required (format: 2024-2025)');
  }
  if (!previous_qualification || previous_qualification.trim().length < 2) {
    errors.push('previous_qualification is required');
  }
  if (percentage === undefined || percentage === null || percentage === '') {
    errors.push('percentage is required');
  } else {
    const p = parseFloat(percentage);
    if (isNaN(p) || p < 0 || p > 100) errors.push('percentage must be between 0 and 100');
  }

  const validTypes = ['REGULAR', 'LATERAL', 'MANAGEMENT', 'NRI'];
  if (req.body.application_type && !validTypes.includes(req.body.application_type)) {
    errors.push(`application_type must be one of: ${validTypes.join(', ')}`);
  }

  if (errors.length > 0) {
    return errorResponse(res, errors.join('; '), 400, 'VALIDATION_ERROR');
  }
  next();
};