export const findApplications = async (client, { status, course_id, limit, offset }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`a.status = $${idx++}`);
    params.push(status);
  }
  if (course_id) {
    conditions.push(`a.course_id = $${idx++}`);
    params.push(course_id);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(limit, offset);

  const query = `
    SELECT a.*, s.full_name as student_name, s.email as student_email, c.name as course_name
    FROM applications a
    LEFT JOIN students s ON a.student_id = s.id
    LEFT JOIN courses c ON a.course_id = c.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const res = await client.query(query, params);
  return res.rows;
};

export const countApplications = async (client, { status, course_id }) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (course_id) {
    conditions.push(`course_id = $${idx++}`);
    params.push(course_id);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const query = `SELECT COUNT(*) as count FROM applications ${whereClause}`;

  const res = await client.query(query, params);
  return parseInt(res.rows[0].count, 10);
};

export const getApplicationById = async (client, id) => {
  const query = `
    SELECT a.*, s.full_name as student_name, s.email as student_email, s.phone as student_phone,
           c.name as course_name, c.code as course_code
    FROM applications a
    LEFT JOIN students s ON a.student_id = s.id
    LEFT JOIN courses c ON a.course_id = c.id
    WHERE a.id = $1
  `;
  const res = await client.query(query, [id]);
  return res.rows[0];
};

export const getApplicationEvents = async (client, application_id) => {
  const res = await client.query(
    'SELECT * FROM application_events WHERE application_id = $1 ORDER BY created_at ASC',
    [application_id]
  );
  return res.rows;
};

export const createApplication = async (client, data) => {
  const {
    student_id, course_id, application_number, academic_year,
    previous_qualification, percentage, application_type
  } = data;
  const query = `
    INSERT INTO applications (
      student_id, course_id, application_number, academic_year,
      previous_qualification, percentage, application_type, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
    RETURNING *
  `;
  const res = await client.query(query, [
    student_id, course_id, application_number, academic_year,
    previous_qualification, percentage, application_type || 'REGULAR'
  ]);
  return res.rows[0];
};

export const createApplicationEvent = async (client, data) => {
  const { application_id, event_type, old_status, new_status, description } = data;
  const query = `
    INSERT INTO application_events (application_id, event_type, old_status, new_status, description)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const res = await client.query(query, [
    application_id, event_type, old_status || null, new_status || null, description || null
  ]);
  return res.rows[0];
};

export const updateApplication = async (client, id, data) => {
  const allowedFields = ['status', 'remarks', 'percentage', 'previous_qualification', 'application_type'];
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

  // If status is changing to APPROVED or REJECTED, set reviewed_at
  if (data.status && ['APPROVED', 'REJECTED'].includes(data.status)) {
    fields.push(`reviewed_at = NOW()`);
  }

  if (fields.length === 0) return await getApplicationById(client, id);

  values.push(id);
  const query = `
    UPDATE applications
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *
  `;
  const res = await client.query(query, values);
  return res.rows[0];
};

export const deleteApplication = async (client, id) => {
  const res = await client.query('DELETE FROM applications WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
};

export const getStatsOverview = async (client) => {
  const query = `
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'UNDER_REVIEW' THEN 1 END) as under_review,
      COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
      COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected,
      COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today,
      COUNT(CASE WHEN created_at >= date_trunc('week', CURRENT_DATE) THEN 1 END) as this_week,
      COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as this_month
    FROM applications
  `;
  const res = await client.query(query);
  const row = res.rows[0];
  return {
    total: parseInt(row.total),
    pending: parseInt(row.pending),
    underReview: parseInt(row.under_review),
    approved: parseInt(row.approved),
    rejected: parseInt(row.rejected),
    today: parseInt(row.today),
    thisWeek: parseInt(row.this_week),
    thisMonth: parseInt(row.this_month)
  };
};

export const getStatsByCourse = async (client) => {
  const query = `
    SELECT c.name as "courseName", COUNT(a.id) as count
    FROM courses c
    LEFT JOIN applications a ON c.id = a.course_id
    WHERE c.is_active = true
    GROUP BY c.id, c.name
    ORDER BY count DESC
  `;
  const res = await client.query(query);
  return res.rows.map(row => ({ ...row, count: parseInt(row.count) }));
};

export const getStatsByStatus = async (client) => {
  const query = `
    SELECT status, COUNT(*) as count
    FROM applications
    GROUP BY status
    ORDER BY count DESC
  `;
  const res = await client.query(query);
  return res.rows.map(row => ({ ...row, count: parseInt(row.count) }));
};

export const getRecentApplications = async (client, limit) => {
  const query = `
    SELECT a.id, a.application_number, a.status, a.created_at,
           s.full_name as student_name, c.name as course_name
    FROM applications a
    JOIN students s ON a.student_id = s.id
    JOIN courses c ON a.course_id = c.id
    ORDER BY a.created_at DESC
    LIMIT $1
  `;
  const res = await client.query(query, [limit]);
  return res.rows;
};