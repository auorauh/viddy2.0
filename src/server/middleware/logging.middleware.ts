import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logging/logger';

// Extend Request interface to include timing and request ID
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate or use existing request ID
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  
  // Set request ID in response headers for tracing
  res.setHeader('x-request-id', req.requestId);
  
  next();
};

export const requestTimingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();
  next();
};

export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Log incoming request
  logger.info('Incoming request', {
    requestId: req.requestId,
    metadata: {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      contentLength: req.headers['content-length']
    }
  });

  // Capture original res.end to log response
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - req.startTime;
    
    // Log response
    logger.httpRequest(req, res, duration);
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        duration,
        metadata: {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode
        }
      });
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

export const responseLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Log response body for debugging (only in development and for errors)
  if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
    const originalJson = res.json;
    
    res.json = function(body: any) {
      logger.debug('Response body', {
        requestId: req.requestId,
        metadata: {
          statusCode: res.statusCode,
          body: typeof body === 'object' ? JSON.stringify(body) : body
        }
      });
      
      return originalJson.call(this, body);
    };
  }
  
  next();
};

// Combined logging middleware
export const loggingMiddleware = [
  requestIdMiddleware,
  requestTimingMiddleware,
  requestLoggingMiddleware,
  responseLoggingMiddleware
];