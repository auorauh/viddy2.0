import { MongoError } from 'mongodb';

export class DatabaseError extends Error {
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, code: string = 'DATABASE_ERROR', isOperational: boolean = true) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, DatabaseError);
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR');
    this.name = 'ConnectionError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class DuplicateKeyError extends DatabaseError {
  public readonly field: string;

  constructor(message: string, field: string) {
    super(message, 'DUPLICATE_KEY_ERROR');
    this.name = 'DuplicateKeyError';
    this.field = field;
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export const handleMongoError = (error: any): DatabaseError => {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (error instanceof MongoError) {
    switch (error.code) {
      case 11000: // Duplicate key error
        const field = extractDuplicateKeyField(error.message);
        return new DuplicateKeyError(
          `Duplicate value for field: ${field}`,
          field
        );
      
      case 121: // Document validation failure
        return new ValidationError('Document validation failed');
      
      case 50: // Exceeded time limit
        return new DatabaseError('Operation timed out', 'TIMEOUT_ERROR');
      
      default:
        return new DatabaseError(
          `MongoDB error: ${error.message}`,
          `MONGO_ERROR_${error.code}`
        );
    }
  }

  // Network/connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
    return new ConnectionError(`Database connection failed: ${error.message}`);
  }

  // Generic error fallback
  return new DatabaseError(
    error.message || 'Unknown database error',
    'UNKNOWN_ERROR',
    false
  );
};

const extractDuplicateKeyField = (errorMessage: string): string => {
  // Extract field name from MongoDB duplicate key error message
  const match = errorMessage.match(/index: (\w+)_/);
  return match ? match[1] : 'unknown';
};

export const isRetryableError = (error: any): boolean => {
  if (error instanceof MongoError) {
    // Retryable write errors
    return error.hasErrorLabel('RetryableWriteError') || 
           error.hasErrorLabel('RetryableReadError');
  }
  
  if (error instanceof ConnectionError) {
    return true;
  }
  
  return false;
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw handleMongoError(error);
      }
      
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw handleMongoError(lastError);
};