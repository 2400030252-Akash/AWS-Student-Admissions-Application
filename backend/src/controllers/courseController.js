import * as courseService from '../services/courseService.js';
import { successResponse } from '../utils/response.js';

export const getCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getAllActiveCourses();
    return successResponse(res, { courses });
  } catch (error) {
    next(error);
  }
};
