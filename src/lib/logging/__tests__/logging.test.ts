import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from '../logger';
import { DatabaseLogger } from '../database-logger';
import { monitoring } from '../monitoring';

// Mock console methods
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    vi.spyOn(console, 'info').mockImplementation(mockConsole.info);
    vi.spyOn(console, 'debug').mockImplementation(mockConsole.debug);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockConsole.error.mockClear();
    mockConsole.warn.mockClear();
    mockConsole.info.mockClear();
    mockConsole.debug.mockClear();
  });

  it('should log error messages', () => {
    const error = new Error('Test error');
    logger.error('Test error message', { requestId: 'test-123' }, error);

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Test error message')
    );
  });

  it('should log info messages with context', () => {
    logger.info('Test info message', {
      requestId: 'test-123',
      userId: 'user-456',
      metadata: { action: 'test' }
    });

    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('Test info message')
    );
  });

  it('should log debug messages in development', () => {
    process.env.NODE_ENV = 'development';
    logger.debug('Debug message', { requestId: 'test-123' });

    expect(mockConsole.debug).toHaveBeenCalled();
  });

  it('should log HTTP requests', () => {
    const mockReq = {
      method: 'GET',
      url: '/api/test',
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1'
    } as any;

    const mockRes = {
      statusCode: 200
    } as any;

    logger.httpRequest(mockReq, mockRes, 150);

    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('HTTP GET /api/test - 200')
    );
  });

  it('should log performance metrics', () => {
    logger.performance('database-query', 250, {
      requestId: 'test-123',
      metadata: { collection: 'users' }
    });

    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringContaining('Performance: database-query took 250ms')
    );
  });

  it('should warn on slow performance', () => {
    logger.performance('slow-operation', 1500, {
      requestId: 'test-123'
    });

    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('Performance: slow-operation took 1500ms')
    );
  });
});

describe('DatabaseLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    vi.spyOn(console, 'info').mockImplementation(mockConsole.info);
    vi.spyOn(console, 'debug').mockImplementation(mockConsole.debug);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockConsole.error.mockClear();
    mockConsole.warn.mockClear();
    mockConsole.info.mockClear();
    mockConsole.debug.mockClear();
  });

  it('should log database operations', () => {
    DatabaseLogger.logOperation('users', 'findById', {
      requestId: 'test-123',
      metadata: { userId: 'user-456' }
    });

    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringContaining('Database operation: findById')
    );
  });

  it('should log database queries', () => {
    const query = { _id: 'user-123' };
    DatabaseLogger.logQuery('users', 'findOne', query, {
      requestId: 'test-123'
    });

    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringContaining('Database query: users.findOne')
    );
  });

  it('should log database results with performance', () => {
    const result = [{ _id: '1' }, { _id: '2' }];
    DatabaseLogger.logResult('users', 'find', result, 150, {
      requestId: 'test-123'
    });

    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringContaining('Performance: users.find took 150ms')
    );
  });

  it('should log database errors', () => {
    const error = new Error('Database connection failed');
    DatabaseLogger.logError('users', 'findById', error, {
      requestId: 'test-123'
    });

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Database operation failed: users.findById')
    );
  });

  it('should wrap database operations with logging', async () => {
    const mockOperation = vi.fn().mockResolvedValue({ _id: 'test-result' });
    
    const result = await DatabaseLogger.withLogging(
      'users',
      'create',
      mockOperation,
      { requestId: 'test-123' }
    );

    expect(result).toEqual({ _id: 'test-result' });
    expect(mockOperation).toHaveBeenCalled();
    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringContaining('Database operation: create')
    );
  });

  it('should handle database operation errors', async () => {
    const error = new Error('Operation failed');
    const mockOperation = vi.fn().mockRejectedValue(error);
    
    await expect(
      DatabaseLogger.withLogging('users', 'create', mockOperation, {
        requestId: 'test-123'
      })
    ).rejects.toThrow('Operation failed');

    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('Database operation failed: users.create')
    );
  });
});

describe('Monitoring', () => {
  it('should record request metrics', () => {
    monitoring.recordRequest(150, false);
    monitoring.recordRequest(250, true);

    const metrics = monitoring.getSystemMetrics();
    
    expect(metrics.requests.total).toBe(2);
    expect(metrics.requests.errors).toBe(1);
    expect(metrics.requests.averageResponseTime).toBe(200);
  });

  it('should check memory health', () => {
    const health = monitoring.checkMemoryHealth();
    
    expect(health).toHaveProperty('status');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
  });

  it('should check uptime health', () => {
    const health = monitoring.checkUptimeHealth();
    
    expect(health.status).toBe('healthy');
    expect(health.responseTime).toBeGreaterThan(0);
  });

  it('should get system metrics', () => {
    const metrics = monitoring.getSystemMetrics();
    
    expect(metrics).toHaveProperty('uptime');
    expect(metrics).toHaveProperty('memory');
    expect(metrics).toHaveProperty('requests');
    expect(metrics.memory).toHaveProperty('used');
    expect(metrics.memory).toHaveProperty('total');
    expect(metrics.memory).toHaveProperty('percentage');
  });
});