import { Request, Response } from 'express';
import { logger } from './logger';
import { getDatabase } from '../database/connection';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    database: ServiceHealth;
    memory: ServiceHealth;
    uptime: ServiceHealth;
  };
  metrics: SystemMetrics;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

export interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    total: number;
    errors: number;
    averageResponseTime: number;
  };
}

class MonitoringService {
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;
  private startTime = Date.now();

  recordRequest(duration: number, isError: boolean = false): void {
    this.requestCount++;
    this.totalResponseTime += duration;
    
    if (isError) {
      this.errorCount++;
    }
  }

  async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const db = await getDatabase();
      await db.admin().ping();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 100 ? 'healthy' : 'degraded',
        responseTime,
        message: responseTime > 100 ? 'Database response time is slow' : undefined
      };
    } catch (error) {
      logger.error('Database health check failed', {}, error as Error);
      
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: (error as Error).message
      };
    }
  }

  checkMemoryHealth(): ServiceHealth {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const percentage = (usedMemory / totalMemory) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message: string | undefined;

    if (percentage > 90) {
      status = 'unhealthy';
      message = 'Memory usage is critically high';
    } else if (percentage > 75) {
      status = 'degraded';
      message = 'Memory usage is high';
    }

    return {
      status,
      message
    };
  }

  checkUptimeHealth(): ServiceHealth {
    const uptime = Date.now() - this.startTime;
    
    return {
      status: 'healthy',
      responseTime: uptime
    };
  }

  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    
    return {
      uptime: Date.now() - this.startTime,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0
      }
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const [databaseHealth, memoryHealth, uptimeHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      Promise.resolve(this.checkMemoryHealth()),
      Promise.resolve(this.checkUptimeHealth())
    ]);

    const services = {
      database: databaseHealth,
      memory: memoryHealth,
      uptime: uptimeHealth
    };

    // Determine overall system status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const serviceStatuses = Object.values(services).map(s => s.status);
    
    if (serviceStatuses.includes('unhealthy')) {
      status = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      status = 'degraded';
    }

    const health: SystemHealth = {
      status,
      timestamp: new Date(),
      services,
      metrics: this.getSystemMetrics()
    };

    // Log health status
    if (status !== 'healthy') {
      logger.warn('System health check', {
        metadata: {
          status,
          services: Object.entries(services)
            .filter(([_, service]) => service.status !== 'healthy')
            .map(([name, service]) => `${name}: ${service.status}`)
        }
      });
    }

    return health;
  }

  // Middleware to track request metrics
  metricsMiddleware() {
    return (req: Request, res: Response, next: Function) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const isError = res.statusCode >= 400;
        
        this.recordRequest(duration, isError);
        
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
      });
      
      next();
    };
  }
}

export const monitoring = new MonitoringService();

// Health check endpoint handler
export const healthCheckHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await monitoring.getSystemHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { requestId: req.requestId }, error as Error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date(),
      message: 'Health check failed'
    });
  }
};