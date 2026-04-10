class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class BadRequestError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  ValidationError,
  NotFoundError,
};
