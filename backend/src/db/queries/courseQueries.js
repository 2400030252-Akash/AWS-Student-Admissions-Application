export const getAllActiveCourses = async (client) => {
  const res = await client.query('SELECT * FROM courses WHERE is_active = true ORDER BY name ASC');
  return res.rows;
};
