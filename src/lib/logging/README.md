# Logging and Error Handling Infrastructure

This module provides comprehensive logging, error handling, and monitoring capabilities for the application.

## Features

### 1. Structured Logging (`logger.ts`)

- **Multi-level logging**: ERROR, WARN, INFO, DEBUG
- **Contextual logging**: Request ID, user ID, operation metadata
- **Environment-aware**: Pretty format for development, JSON for production
- **Performance tracking**: Automatic duration logging for operations

#### Usage

```typescript
import { logger } from '../lib/logging';

// Basic logging
logger.info('User logged in', { userId: 'user-123' });
logger.error('Database error', { requestId: 'req-456' }, error);

// Performance logging
logger.performance('database-query', 250, { collection: 'users' });

// HTTP request logging (automatic via middleware)
logger.httpRequest(req, res, duration);
```

### 2. Database Operation Logging (`database-logger.ts`)

- **Automatic operation tracking**: Query logging with performance metrics
- **Error context**: Detailed error information with operation context
- **Wrapper functions**: Easy integration with existing repository methods

#### Usage

```typescript
import { DatabaseLogger, withDatabaseLogging } from '../lib/logging';

// Manual logging
DatabaseLogger.logOperation('users', 'findById', { userId: 'user-123' });

// Automatic wrapper
const result = await DatabaseLogger.withLogging(
  'users',
  'create',
  () => userModel.create(userData),
  { requestId: 'req-123' }
);

// Repository method wrapper
const findUser = withDatabaseLogging('users', 'findById', userModel.findById);
```

### 3. Request/Response Logging (`logging.middleware.ts`)

- **Request ID generation**: Automatic UUID generation for request tracking
- **Request timing**: Automatic duration measurement
- **Slow request detection**: Warnings for requests > 1000ms
- **Response body logging**: Debug logging for development and errors

#### Middleware Stack

```typescript
app.use(loggingMiddleware); // Includes all logging middleware
// OR individual middleware
app.use(requestIdMiddleware);
app.use(requestTimingMiddleware);
app.use(requestLoggingMiddleware);
app.use(responseLoggingMiddleware);
```

### 4. Error Handling (`error.middleware.ts`)

- **Centralized error handling**: Consistent error response format
- **Error type mapping**: Specific handling for database, validation, and JWT errors
- **Contextual error logging**: Request context with error details
- **Graceful error responses**: User-friendly error messages

#### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2025-08-20T20:49:04.035Z",
  "requestId": "b8156b6f-1ac2-4526-a7d7-a4ec0bc83d8a"
}
```

### 5. System Monitoring (`monitoring.ts`)

- **Health checks**: Database, memory, and uptime monitoring
- **Performance metrics**: Request counts, error rates, response times
- **System status**: Overall health assessment with service breakdown
- **Automatic alerting**: Warnings for degraded performance

#### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-08-20T20:49:04.035Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "memory": {
      "status": "healthy"
    },
    "uptime": {
      "status": "healthy",
      "responseTime": 12345
    }
  },
  "metrics": {
    "uptime": 12345,
    "memory": {
      "used": 50000000,
      "total": 100000000,
      "percentage": 50
    },
    "requests": {
      "total": 150,
      "errors": 5,
      "averageResponseTime": 200
    }
  }
}
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Set logging level (error, warn, info, debug)
- `NODE_ENV`: Environment mode (development, production, test)

### Log Levels

- **ERROR**: Critical errors that need immediate attention
- **WARN**: Warning conditions (slow requests, degraded performance)
- **INFO**: General information (HTTP requests, user actions)
- **DEBUG**: Detailed debugging information (database queries, internal operations)

## Integration

### Express App Setup

```typescript
import { loggingMiddleware, monitoring, healthCheckHandler } from '../lib/logging';
import { errorHandler } from './middleware/error.middleware';

// Add logging middleware
app.use(loggingMiddleware);
app.use(monitoring.metricsMiddleware());

// Add health check endpoint
app.get('/health', healthCheckHandler);

// Add error handling (must be last)
app.use(errorHandler);
```

### Repository Integration

```typescript
import { DatabaseLogger } from '../lib/logging/database-logger';

export class UserRepository {
  async create(userData: UserInput): Promise<User> {
    return DatabaseLogger.withLogging(
      'users',
      'create',
      () => this.userModel.createUser(userData),
      { metadata: { email: userData.email } }
    );
  }
}
```

## Testing

The logging infrastructure includes comprehensive tests:

- **Unit tests**: Logger functionality, database logging, monitoring
- **Integration tests**: Error handling middleware, health checks
- **Performance tests**: Response time validation, memory usage

Run tests:

```bash
npm test src/lib/logging/__tests__/
npm test src/server/__tests__/error-handling.integration.test.ts
npm test src/server/__tests__/health-check.integration.test.ts
```

## Best Practices

1. **Always include request ID**: Use `req.requestId` for request correlation
2. **Log at appropriate levels**: Use DEBUG for detailed info, ERROR for critical issues
3. **Include context**: Add relevant metadata (user ID, operation, etc.)
4. **Monitor performance**: Log slow operations and database queries
5. **Handle errors gracefully**: Provide user-friendly error messages
6. **Use structured logging**: Include consistent metadata for log analysis

## Monitoring and Alerting

The system provides built-in monitoring for:

- **Database connectivity**: Connection health and response times
- **Memory usage**: Heap usage and memory pressure
- **Request performance**: Response times and error rates
- **System uptime**: Application availability

Health checks are available at `/health` endpoint and can be integrated with monitoring systems like Prometheus, DataDog, or New Relic.