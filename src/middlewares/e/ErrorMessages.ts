import { ErrorCode } from './ErrorCode.js';

export const ErrorMessages: { [key in ErrorCode]: string } = {
  // General Errors
  [ErrorCode.UNKNOWN_ERROR]: "Unknown error occurred",
  [ErrorCode.NOT_FOUND]: "Resource not found",
  [ErrorCode.BAD_REQUEST]: "Bad request",
  [ErrorCode.VALIDATION_ERROR]: "Validation error",
  
  // Authentication & Authorization
  [ErrorCode.UNAUTHORIZED]: "Unauthorized access",
  [ErrorCode.FORBIDDEN]: "Access forbidden",
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials provided",
  [ErrorCode.TOKEN_EXPIRED]: "Authentication token has expired",
  [ErrorCode.TOKEN_INVALID]: "Invalid authentication token",
  [ErrorCode.TOKEN_MISSING]: "Authentication token is missing",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: "Insufficient permissions to access this resource",
  [ErrorCode.ACCOUNT_LOCKED]: "Account has been locked",
  [ErrorCode.ACCOUNT_DISABLED]: "Account has been disabled",
  [ErrorCode.PASSWORD_EXPIRED]: "Password has expired and needs to be reset",
  
  // User Related Errors
  [ErrorCode.USER_NOT_FOUND]: "User not found",
  [ErrorCode.USER_ALREADY_EXISTS]: "User already exists",
  [ErrorCode.USER_CREATION_FAILED]: "Failed to create user",
  [ErrorCode.USER_UPDATE_FAILED]: "Failed to update user",
  [ErrorCode.USER_DELETION_FAILED]: "Failed to delete user",
  [ErrorCode.INVALID_USER_DATA]: "Invalid user data provided",
  // Walrus Router Errors
  [ErrorCode.WALRUS_DATA_REQUIRED]: "Data is required for upload",
  [ErrorCode.WALRUS_UPLOAD_FAILED]: "Failed to upload data to Walrus",
  [ErrorCode.WALRUS_DOWNLOAD_FAILED]: "Failed to download data from Walrus",
  [ErrorCode.WALRUS_BLOB_NOT_FOUND]: "Blob not found in Walrus storage",
  [ErrorCode.WALRUS_INSUFFICIENT_BALANCE]: "Insufficient balance for Walrus operation",
  [ErrorCode.WALRUS_INVALID_BLOB_ID]: "Invalid blob ID format",
  [ErrorCode.WALRUS_CONNECTION_ERROR]: "Error connecting to Walrus service",
  [ErrorCode.WALRUS_TIMEOUT]: "Walrus operation timed out",
  [ErrorCode.WALRUS_INVALID_FORMAT]: "Invalid data format for Walrus",
  [ErrorCode.WALRUS_FILE_TOO_LARGE]: "File is too large for Walrus upload",
  [ErrorCode.WALRUS_BALANCE_CHECK_FAILED]: "Failed to check Walrus balance",

  
  // File Related Errors
  [ErrorCode.FILE_UPLOAD_ERROR]: "File upload error",
  [ErrorCode.FILE_TOO_LARGE]: "File is too large",
  [ErrorCode.INVALID_FILE_TYPE]: "Invalid file type",
  [ErrorCode.FILE_NOT_FOUND]: "File not found",
  [ErrorCode.FILE_PROCESSING_ERROR]: "Error processing file",
  [ErrorCode.FILE_STORAGE_ERROR]: "File storage error",
  [ErrorCode.FILE_DOWNLOAD_ERROR]: "File download error",
  [ErrorCode.FILE_PERMISSION_DENIED]: "Permission denied for file operation",
  [ErrorCode.FILE_CORRUPTED]: "File is corrupted",
  [ErrorCode.INTERNAL_SERVER_ERROR]: "Internal server error",

  // Database Errors
  [ErrorCode.DB_CONNECTION_ERROR]: "Database connection error",
  [ErrorCode.DB_QUERY_ERROR]: "Database query error",
  [ErrorCode.DB_TRANSACTION_ERROR]: "Database transaction error",
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: "Database constraint violation",
  [ErrorCode.DB_RECORD_NOT_FOUND]: "Database record not found",
  [ErrorCode.DB_DUPLICATE_ENTRY]: "Duplicate entry in database",
  [ErrorCode.DB_MIGRATION_ERROR]: "Database migration error",
  [ErrorCode.DB_TIMEOUT]: "Database operation timed out",
  [ErrorCode.DB_SCHEMA_ERROR]: "Database schema error",

  [ErrorCode.GROK_API_ERROR]: "GROK API error",
  
  // Achievement Errors
  [ErrorCode.ACHIEVEMENT_NOT_FOUND]: "Achievement not found",
  
  // Input Validation Errors
  [ErrorCode.INVALID_INPUT]: "Invalid input data provided",
};
