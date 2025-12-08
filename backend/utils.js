/**
 * Utility functions for validation, error handling, and API responses
 * Production-grade error handling and input validation
 */

// ==================== VALIDATION ====================

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * - Minimum 6 characters
 * - At least one letter
 * - At least one number (optional for initial version)
 */
const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter" };
  }
  return { valid: true };
};

/**
 * Validate full name
 */
const validateFullName = (name) => {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: "Full name must be at least 2 characters" };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: "Full name cannot exceed 100 characters" };
  }
  return { valid: true };
};

/**
 * Sanitize string input
 */
const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, 255); // Max 255 chars
};

// ==================== ERROR HANDLING ====================

/**
 * Standardized API error response
 */
const apiError = (res, statusCode, message, errorCode = null) => {
  console.error(`[ERROR ${statusCode}] ${errorCode || "UNKNOWN"}: ${message}`);
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode: errorCode || "INTERNAL_ERROR",
  });
};

/**
 * Standardized API success response
 */
const apiSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data }),
  });
};

// ==================== ERROR CODES ====================

const ERROR_CODES = {
  // Auth Errors
  INVALID_CREDENTIALS: { code: "INVALID_CREDENTIALS", status: 401 },
  EMAIL_ALREADY_EXISTS: { code: "EMAIL_ALREADY_EXISTS", status: 400 },
  USER_NOT_FOUND: { code: "USER_NOT_FOUND", status: 404 },
  INVALID_TOKEN: { code: "INVALID_TOKEN", status: 401 },
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401 },
  FORBIDDEN: { code: "FORBIDDEN", status: 403 },

  // Validation Errors
  INVALID_EMAIL: { code: "INVALID_EMAIL", status: 400 },
  WEAK_PASSWORD: { code: "WEAK_PASSWORD", status: 400 },
  MISSING_REQUIRED_FIELDS: { code: "MISSING_REQUIRED_FIELDS", status: 400 },
  INVALID_INPUT: { code: "INVALID_INPUT", status: 400 },

  // Database Errors
  DATABASE_ERROR: { code: "DATABASE_ERROR", status: 500 },
  QUERY_FAILED: { code: "QUERY_FAILED", status: 500 },

  // General Errors
  NOT_FOUND: { code: "NOT_FOUND", status: 404 },
  INTERNAL_SERVER_ERROR: { code: "INTERNAL_SERVER_ERROR", status: 500 },
};

/**
 * Handle database errors
 */
const handleDatabaseError = (res, err, operation = "database operation") => {
  console.error(`Database Error during ${operation}:`, err);
  return apiError(
    res,
    500,
    "A database error occurred. Please try again later.",
    "DATABASE_ERROR"
  );
};

// ==================== LOGGING ====================

/**
 * Log authentication event
 */
const logAuthEvent = (eventType, userId, email, ipAddress, success = true) => {
  const timestamp = new Date().toISOString();
  const status = success ? "SUCCESS" : "FAILED";
  console.log(`[AUTH] ${timestamp} | ${eventType} | User: ${email} (ID: ${userId}) | ${status} | IP: ${ipAddress}`);
};

/**
 * Log sensitive operations
 */
const logSensitiveOperation = (operation, userId, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[OPERATION] ${timestamp} | ${operation} | User ID: ${userId} | Details: ${JSON.stringify(details)}`);
};

module.exports = {
  // Validation functions
  validateEmail,
  validatePassword,
  validateFullName,
  sanitizeInput,

  // Response functions
  apiError,
  apiSuccess,

  // Error codes
  ERROR_CODES,
  handleDatabaseError,

  // Logging
  logAuthEvent,
  logSensitiveOperation,
};
