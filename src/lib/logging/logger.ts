import { Request, Response } from 'express';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';
  private logLevel = process.env.LOG_LEVEL || (this.isDevelopment || this.isTest ? 'debug' : 'info');

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel as LogLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.isDevelopment || this.isTest) {
      // Pretty format for development
      const timestamp = entry.timestamp.toISOString();
      const level = entry.level.toUpperCase().padEnd(5);
      let message = `[${timestamp}] ${level} ${entry.message}`;
      
      if (entry.context) {
        const contextStr = Object.entries(entry.context)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join(' ');
        if (contextStr) {
          message += ` | ${contextStr}`;
        }
      }
      
      if (entry.error) {
        message += `\nError: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack && this.logLevel === 'debug') {
          message += `\nStack: ${entry.error.stack}`;
        }
      }
      
      return message;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      };
    }

    const formattedMessage = this.formatLogEntry(entry);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Database operation logging
  dbOperation(operation: string, collection: string, context?: LogContext): void {
    this.debug(`Database operation: ${operation}`, {
      ...context,
      operation: `${collection}.${operation}`
    });
  }

  // HTTP request logging
  httpRequest(req: Request, res: Response, duration: number): void {
    const context: LogContext = {
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.id,
      duration,
      metadata: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress
      }
    };

    const level = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `HTTP ${req.method} ${req.url} - ${res.statusCode}`, context);
  }

  // Performance monitoring
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      operation,
      duration
    });
  }
}

export const logger = new Logger();