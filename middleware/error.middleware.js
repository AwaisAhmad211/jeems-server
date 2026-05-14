import AppError from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 🧨 Log error (dev-friendly)
  console.error("ERROR 💥", err);

  // ❌ Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = new AppError("Resource not found", 404);
  }

  // ❌ Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already exists`, 400);
  }

  // ❌ Validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new AppError(message, 400);
  }

  // ❌ JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired", 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    status: error.status || "error",
    message: error.message || "Server Error",
  });
};

export default errorHandler;
