import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/error.middleware';
import { loggingMiddleware } from '../../lib/logging';
import { ValidationError, DatabaseError, NotFoundError } from '../../lib/database/errors';

// Create test app
const createTestApp = () => {
  const app = express();
  
  app.use(express.json());
  app.use(loggingMiddleware);
  
  // Test routes that throw different types of errors
  app.get('/test/validation-error', (req, res, next) => {
    next(new ValidationError('Invalid input data'));
  });
  
  app.get('/test/database-error', (req, res, next) => {
    next(new DatabaseError('Database connection failed'));
  });
  
  app.get('/test/not-found-error', (req, res, next) => {
    next(new NotFoundError('User', 'user-123'));
  });
  
  app.get('/test/generic-error', (req, res, next) => {
    next(new Error('Something went wrong'));
  });
  
  app.get('/test/jwt-error', (req, res, next) => {
    const error = new Error('Invalid token');
    error.name = 'JsonWebTokenError';
    next(error);
  });
  
  app.get('/test/success', (req, res) => {
    res.json({ message: 'Success' });
  });
  
  // Error handling middleware
  app.use(errorHandler);
  
  return app;
};

describe('Error Handling Integration', () => {
  let app: express.Application;
  let consoleSpy: any;

  beforeAll(() => {
    app = createTestApp();
    // Mock console to capture error logs
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should handle validation errors with 400 status', async () => {
    const response = await request(app)
      .get('/test/validation-error')
      .expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data'
      },
      timestamp: expect.any(String),
      requestId: expect.any(String)
    });
  });

  it('should handle database errors with 500 status', async () => {
    const response = await request(app)
      .get('/test/database-error')
      .expect(500);

    expect(response.body).toMatchObject({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed'
      },
      timestamp: expect.any(String),
      requestId: expect.any(String)
    });
  });

  it('should handle not found errors with 404 status', async () => {
    const response = await request(app)
      .get('/test/not-found-error')
      .expect(404);

    expect(response.body).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: "User with identifier 'user-123' not found"
      },
      timestamp: expect.any(String),
      requestId: expect.any(String)
    });
  });

  it('should handle JWT errors with 401 status', async () => {
    const response = await request(app)
      .get('/test/jwt-error')
      .expect(401);

    expect(response.body).toMatchObject({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      },
      timestamp: expect.any(String),
      requestId: expect.any(String)
    });
  });

  it('should handle generic errors with 500 status', async () => {
    const response = await request(app)
      .get('/test/generic-error')
      .expect(500);

    expect(response.body).toMatchObject({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      },
      timestamp: expect.any(String),
      requestId: expect.any(String)
    });
  });

  it('should include request ID in error responses', async () => {
    const response = await request(app)
      .get('/test/validation-error')
      .set('x-request-id', 'test-request-123')
      .expect(400);

    expect(response.body.requestId).toBe('test-request-123');
  });

  it('should log errors with context', async () => {
    await request(app)
      .get('/test/database-error')
      .expect(500);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Request error occurred')
    );
  });

  it('should handle successful requests without errors', async () => {
    const response = await request(app)
      .get('/test/success')
      .expect(200);

    expect(response.body).toEqual({ message: 'Success' });
  });

  it('should include response headers for request tracking', async () => {
    const response = await request(app)
      .get('/test/success')
      .expect(200);

    expect(response.headers['x-request-id']).toBeDefined();
  });
});