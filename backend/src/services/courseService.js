import * as queries from '../db/queries/courseQueries.js';
import { pool } from '../config/database.js';

export const getAllActiveCourses = async () => {
  return await queries.getAllActiveCourses(pool);
};
