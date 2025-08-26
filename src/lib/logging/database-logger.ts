import { logger, LogContext } from './logger';

export interface DatabaseOperationContext extends LogContext {
  collection: string;
  operation: string;
  query?: any;
  result?: any;
  error?: Error;
}

export class DatabaseLogger {
  static logOperation(
    collection: string,
    operation: string,
    context?: Partial<DatabaseOperationContext>
  ): void {
    const logContext: LogContext = {
      ...context,
      operation: `${collection}.${operation}`,
      metadata: {
        collection,
        operation,
        ...context?.metadata
      }
    };

    logger.dbOperation(operation, collection, logContext);
  }

  static logQuery(
    collection: string,
    operation: string,
    query: any,
    context?: Partial<DatabaseOperationContext>
  ): void {
    const logContext: LogContext = {
      ...context,
      operation: `${collection}.${operation}`,
      metadata: {
        collection,
        operation,
        query: JSON.stringify(query),
        ...context?.metadata
      }
    };

    logger.debug(`Database query: ${collection}.${operation}`, logContext);
  }

  static logResult(
    collection: string,
    operation: string,
    result: any,
    duration: number,
    context?: Partial<DatabaseOperationContext>
  ): void {
    const logContext: LogContext = {
      ...context,
      operation: `${collection}.${operation}`,
      duration,
      metadata: {
        collection,
        operation,
        resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
        ...context?.metadata
      }
    };

    logger.performance(`${collection}.${operation}`, duration, logContext);
  }

  static logError(
    collection: string,
    operation: string,
    error: Error,
    context?: Partial<DatabaseOperationContext>
  ): void {
    const logContext: LogContext = {
      ...context,
      operation: `${collection}.${operation}`,
      metadata: {
        collection,
        operation,
        ...context?.metadata
      }
    };

    logger.error(`Database operation failed: ${collection}.${operation}`, logContext, error);
  }

  // Wrapper function to automatically log database operations
  static async withLogging<T>(
    collection: string,
    operation: string,
    dbOperation: () => Promise<T>,
    context?: Partial<DatabaseOperationContext>
  ): Promise<T> {
    const startTime = Date.now();
    
    this.logOperation(collection, operation, context);
    
    try {
      const result = await dbOperation();
      const duration = Date.now() - startTime;
      
      this.logResult(collection, operation, result, duration, context);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logError(collection, operation, error as Error, {
        ...context,
        duration
      });
      
      throw error;
    }
  }
}

// Convenience function for wrapping repository methods
export function withDatabaseLogging<T extends any[], R>(
  collection: string,
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return DatabaseLogger.withLogging(
      collection,
      operation,
      () => fn(...args),
      {
        metadata: {
          args: args.length > 0 ? JSON.stringify(args[0]) : undefined
        }
      }
    );
  };
}