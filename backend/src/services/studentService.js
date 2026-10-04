import * as queries from '../db/queries/studentQueries.js';
import { pool } from '../config/database.js';
import { metrics } from '../middleware/metrics.js';

export const findStudents = async (search, limit, offset) => {
  const start = Date.now();
  try {
    let students;
    if (search) {
      students = await queries.searchStudents(pool, search, limit, offset);
    } else {
      students = await queries.getAllStudents(pool, limit, offset);
    }
    const total = await queries.countStudents(pool, search);
    metrics.recordDbQuery(Date.now() - start);
    return { students, total };
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};

export const getStudentById = async (id) => {
  const start = Date.now();
  try {
    const student = await queries.getStudentById(pool, id);
    if (!student) return null;
    const applications = await queries.getStudentApplications(pool, id);
    student.applications = applications;
    metrics.recordDbQuery(Date.now() - start);
    return student;
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};

export const createStudent = async (data) => {
  const start = Date.now();
  try {
    const student = await queries.createStudent(pool, data);
    metrics.recordDbQuery(Date.now() - start);
    return student;
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};

export const updateStudent = async (id, data) => {
  const start = Date.now();
  try {
    const student = await queries.updateStudent(pool, id, data);
    metrics.recordDbQuery(Date.now() - start);
    return student;
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};

export const deleteStudent = async (id) => {
  const start = Date.now();
  try {
    const result = await queries.deleteStudent(pool, id);
    metrics.recordDbQuery(Date.now() - start);
    return result;
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};

export const getTotalCount = async () => {
  try {
    return await queries.getTotalCount(pool);
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};