export const searchStudents = async (client, search, limit, offset) => {
  const query = `
    SELECT id, full_name, email, phone, city, state, created_at
    FROM students
    WHERE full_name ILIKE $1 OR email ILIKE $1 OR city ILIKE $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const res = await client.query(query, [`%${search}%`, limit, offset]);
  return res.rows;
};

export const countStudents = async (client, search) => {
  let query, params;
  if (search) {
    query = `
      SELECT COUNT(*) as count
      FROM students
      WHERE full_name ILIKE $1 OR email ILIKE $1 OR city ILIKE $1
    `;
    params = [`%${search}%`];
  } else {
    query = `SELECT COUNT(*) as count FROM students`;
    params = [];
  }
  const res = await client.query(query, params);
  return parseInt(res.rows[0].count, 10);
};

export const getAllStudents = async (client, limit, offset) => {
  const query = `
    SELECT id, full_name, email, phone, city, state, created_at
    FROM students
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const res = await client.query(query, [limit, offset]);
  return res.rows;
};

export const getStudentById = async (client, id) => {
  const res = await client.query('SELECT * FROM students WHERE id = $1', [id]);
  return res.rows[0];
};

export const getStudentApplications = async (client, id) => {
  const query = `
    SELECT a.*, c.name as course_name
    FROM applications a
    LEFT JOIN courses c ON a.course_id = c.id
    WHERE a.student_id = $1
    ORDER BY a.created_at DESC
  `;
  const res = await client.query(query, [id]);
  return res.rows;
};

export const createStudent = async (client, data) => {
  const { full_name, email, phone, date_of_birth, gender, address, city, state, pincode } = data;
  const query = `
    INSERT INTO students (full_name, email, phone, date_of_birth, gender, address, city, state, pincode)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const res = await client.query(query, [full_name, email, phone, date_of_birth, gender, address, city, state, pincode]);
  return res.rows[0];
};

export const updateStudent = async (client, id, data) => {
  const allowedFields = ['full_name', 'email', 'phone', 'date_of_birth', 'gender', 'address', 'city', 'state', 'pincode'];
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) return await getStudentById(client, id);

  values.push(id);
  const query = `
    UPDATE students
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *
  `;
  const res = await client.query(query, values);
  return res.rows[0];
};

export const deleteStudent = async (client, id) => {
  const res = await client.query('DELETE FROM students WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
};

export const getTotalCount = async (client) => {
  const res = await client.query('SELECT COUNT(*) as count FROM students');
  return parseInt(res.rows[0].count, 10);
};