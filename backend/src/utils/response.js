export const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const errorResponse = (res, message, statusCode = 500, code = 'INTERNAL_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code
    }
  });
};

export const paginatedResponse = (res, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data: {
      ...data,
      pagination
    }
  });
};
