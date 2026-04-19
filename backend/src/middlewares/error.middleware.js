import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  const responseError = {
    statusCode,
    message: err.message || "Internal Server Error",
    success: false,
    errors: err.errors || [],
  };

  if (process.env.NODE_ENV !== "production") {
    responseError.stack = err.stack;
  }

  if (!(err instanceof ApiError) && statusCode === 500) {
    responseError.message = "Internal Server Error";
  }

  return res.status(statusCode).json(responseError);
};

export { errorHandler };
