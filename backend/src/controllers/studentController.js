import * as studentService from '../services/studentService.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

export const getStudents = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = req.query.search || '';
    
    const { students, total } = await studentService.findStudents(search, limit, offset);
    
    return paginatedResponse(res, { students }, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getStudent = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (!student) return errorResponse(res, 'Student not found', 404, 'NOT_FOUND');
    return successResponse(res, { student });
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const student = await studentService.createStudent(req.body);
    return successResponse(res, { student }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body);
    if (!student) return errorResponse(res, 'Student not found', 404, 'NOT_FOUND');
    return successResponse(res, { student });
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const success = await studentService.deleteStudent(req.params.id);
    if (!success) return errorResponse(res, 'Student not found', 404, 'NOT_FOUND');
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
