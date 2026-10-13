/**
 * Standard API Response Utilities
 */

const successResponse = (res, { statusCode = 200, message = "Success", data = null, meta = null, ...rest }) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
    ...rest,
  };
  return res.status(statusCode).json(response);
};

const errorResponse = (res, { statusCode = 500, message = "An error occurred", errors = null }) => {
  const response = {
    success: false,
    message,
    ...(errors !== null && { errors }),
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};
