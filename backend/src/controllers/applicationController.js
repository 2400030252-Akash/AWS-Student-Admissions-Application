import * as applicationService from '../services/applicationService.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

export const getApplications = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const status = req.query.status;
    const course_id = req.query.course_id;
    
    const { applications, total } = await applicationService.findApplications({ status, course_id, limit, offset });
    
    return paginatedResponse(res, { applications }, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (req, res, next) => {
  try {
    const application = await applicationService.getApplicationById(req.params.id);
    if (!application) return errorResponse(res, 'Application not found', 404, 'NOT_FOUND');
    return successResponse(res, { application });
  } catch (error) {
    next(error);
  }
};

export const createApplication = async (req, res, next) => {
  try {
    const application = await applicationService.createApplication(req.body);
    return successResponse(res, { application }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (req, res, next) => {
  try {
    const application = await applicationService.updateApplication(req.params.id, req.body);
    if (!application) return errorResponse(res, 'Application not found', 404, 'NOT_FOUND');
    return successResponse(res, { application });
  } catch (error) {
    next(error);
  }
};

export const deleteApplication = async (req, res, next) => {
  try {
    const success = await applicationService.deleteApplication(req.params.id);
    if (!success) return errorResponse(res, 'Application not found', 404, 'NOT_FOUND');
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getApplicationStats = async (req, res, next) => {
  try {
    const stats = await applicationService.getStats();
    return successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};
