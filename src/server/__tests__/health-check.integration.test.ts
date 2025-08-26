import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { connectToDatabase, dbConnection } from '../../lib/database/connection';

describe('Health Check Integration', () => {
  beforeAll(async () => {
    // Connect to test database
    await connectToDatabase();
  });

  afterAll(async () => {
    // Clean up database connection
    await dbConnection.disconnect();
  });

  it('should return healthy status when all services are working', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: expect.stringMatching(/^(healthy|degraded)$/),
      timestamp: expect.any(String),
      services: {
        database: {
          status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
          responseTime: expect.any(Number)
        },
        memory: {
          status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/)
        },
        uptime: {
          status: 'healthy',
          responseTime: expect.any(Number)
        }
      },
      metrics: {
        uptime: expect.any(Number),
        memory: {
          used: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        },
        requests: {
          total: expect.any(Number),
          errors: expect.any(Number),
          averageResponseTime: expect.any(Number)
        }
      }
    });
  });

  it('should include request ID in health check response', async () => {
    const response = await request(app)
      .get('/health')
      .set('x-request-id', 'health-check-123')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('health-check-123');
  });

  it('should track health check requests in metrics', async () => {
    // Make a few requests to populate metrics
    await request(app).get('/health');
    await request(app).get('/health');
    
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.metrics.requests.total).toBeGreaterThan(0);
  });

  it('should have reasonable response times', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    const responseTime = Date.now() - startTime;
    
    // Health check should respond within 5 seconds
    expect(responseTime).toBeLessThan(5000);
    
    // Database response time should be reasonable
    expect(response.body.services.database.responseTime).toBeLessThan(1000);
  });

  it('should report memory usage within expected ranges', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    const memoryPercentage = response.body.metrics.memory.percentage;
    
    // Memory usage should be reasonable (less than 95%)
    expect(memoryPercentage).toBeLessThan(95);
    expect(memoryPercentage).toBeGreaterThan(0);
  });
});