export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
export const VUS = parseInt(__ENV.VUS) || 10;
export const DURATION = __ENV.DURATION || '30s';
export const TARGET_RPS = parseInt(__ENV.TARGET_RPS) || 50;

export function generateStudent() {
  const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Saanvi', 'Aanya', 'Aadhya', 'Isha', 'Myra', 'Navya', 'Priya', 'Riya'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Gupta', 'Joshi', 'Malhotra', 'Iyer', 'Rao', 'Mehta', 'Shah', 'Chopra'];
  const cities = [
    { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    { city: 'Delhi', state: 'Delhi', pincode: '110001' },
    { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
    { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
    { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
    { city: 'Pune', state: 'Maharashtra', pincode: '411001' }
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const loc = cities[Math.floor(Math.random() * cities.length)];
  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  
  return {
    full_name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}@example.com`,
    phone: `9${Math.floor(Math.random() * 900000000) + 100000000}`,
    date_of_birth: `2004-05-${String(Math.floor(Math.random() * 25) + 1).padStart(2, '0')}`,
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    address: `${Math.floor(Math.random() * 100) + 1}, University Road, Block B`,
    city: loc.city,
    state: loc.state,
    pincode: loc.pincode
  };
}

export function generateApplication(studentId, courseIds) {
  const courseId = (courseIds && courseIds.length > 0)
    ? courseIds[Math.floor(Math.random() * courseIds.length)]
    : '00000000-0000-0000-0000-000000000000';

  const types = ['REGULAR', 'LATERAL', 'MANAGEMENT', 'NRI'];
  const quals = ['12th CBSE Science', '12th State Board', '12th ICSE', 'Higher Secondary'];

  return {
    student_id: studentId,
    course_id: courseId,
    academic_year: '2024-2025',
    previous_qualification: quals[Math.floor(Math.random() * quals.length)],
    percentage: Math.round((Math.random() * 35 + 63) * 100) / 100,
    application_type: types[Math.floor(Math.random() * types.length)]
  };
}

export function extractCourses(res) {
  try {
    const json = JSON.parse(res.body);
    const courses = json?.data?.courses || json?.data || json;
    if (Array.isArray(courses) && courses.length > 0) {
      return courses.map(c => c.id);
    }
  } catch (e) {}
  return [];
}

export function extractStudentId(res) {
  try {
    const json = JSON.parse(res.body);
    return json?.data?.student?.id || json?.data?.id || json?.id || null;
  } catch (e) {
    return null;
  }
}
