import { Request, Response, NextFunction } from 'express';
import { ValidationError, DatabaseError, DuplicateKeyError, NotFoundError } from '../../lib/database/errors';
import { logger } from '../../lib/logging/logger';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
  requestId: string;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.requestId || req.headers['x-request-id'] as string || 'unknown';
  
  // Log error with context
  logger.error('Request error occurred', {
    requestId,
    userId: (req as any).user?.id,
    metadata: {
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      body: req.method !== 'GET' ? req.body : undefined
    }
  }, error);

  const errorResponse: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    },
    timestamp: new Date(),
    requestId
  };

  // Handle specific error types
  if (error instanceof ValidationError) {
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.message = error.message;
    res.status(400).json(errorResponse);
    return;
  }

  if (error instanceof DuplicateKeyError) {
    errorResponse.error.code = 'DUPLICATE_KEY_ERROR';
    errorResponse.error.message = error.message;
    res.status(409).json(errorResponse);
    return;
  }

  if (error instanceof NotFoundError) {
    errorResponse.error.code = 'NOT_FOUND';
    errorResponse.error.message = error.message;
    
    // Add debugging information in development
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.error.details = {
        originalError: error.message,
        url: req.url,
        method: req.method,
        params: req.params,
        query: req.query
      };
    }
    
    res.status(404).json(errorResponse);
    return;
  }

  if (error instanceof DatabaseError) {
    errorResponse.error.code = 'DATABASE_ERROR';
    errorResponse.error.message = 'Database operation failed';
    res.status(500).json(errorResponse);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    errorResponse.error.code = 'INVALID_TOKEN';
    errorResponse.error.message = 'Invalid authentication token';
    res.status(401).json(errorResponse);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    errorResponse.error.code = 'TOKEN_EXPIRED';
    errorResponse.error.message = 'Authentication token has expired';
    res.status(401).json(errorResponse);
    return;
  }

  // Default error response
  res.status(500).json(errorResponse);
};