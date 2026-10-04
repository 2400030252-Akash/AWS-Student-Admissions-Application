export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Error') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database Error') {
    super(message, 500, 'DATABASE_ERROR');
  }
}
