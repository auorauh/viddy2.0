# Database Configuration

This directory contains the MongoDB connection and configuration utilities for the video content creation application.

## Setup

1. **Install Dependencies**
   ```bash
   npm install mongodb mongoose dotenv
   npm install --save-dev @types/mongodb ts-node
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and configure your MongoDB connection:
   ```bash
   cp .env.example .env
   ```

3. **MongoDB Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in `.env` with your connection string
   - Update `MONGODB_DB_NAME` with your preferred database name

## Files

- `config.ts` - Database configuration with connection pool settings
- `connection.ts` - Singleton connection manager with error handling
- `errors.ts` - Custom error classes and MongoDB error handling
- `init.ts` - Database initialization and graceful shutdown utilities
- `index.ts` - Main exports for the database module
- `test-connection.ts` - Connection testing utility

## Usage

### Basic Connection
```typescript
import { getDatabase } from '@/lib/database';

const db = await getDatabase();
const collection = db.collection('users');
```

### With Error Handling
```typescript
import { getDatabase, handleMongoError, withRetry } from '@/lib/database';

try {
  const result = await withRetry(async () => {
    const db = await getDatabase();
    return await db.collection('users').findOne({ email: 'user@example.com' });
  });
} catch (error) {
  const dbError = handleMongoError(error);
  console.error('Database operation failed:', dbError);
}
```

### Health Check
```typescript
import { dbConnection } from '@/lib/database';

const health = await dbConnection.healthCheck();
console.log('Database status:', health.status);
```

## Testing

Test the database connection:
```bash
npm run test:db
```

## Features

- **Connection Pooling**: Configured with optimal pool settings
- **Error Handling**: Custom error classes with retry logic
- **Health Monitoring**: Built-in health check functionality
- **Graceful Shutdown**: Proper connection cleanup on app termination
- **Environment Configuration**: Flexible configuration via environment variables
- **TypeScript Support**: Full type safety with MongoDB operations

## Connection Pool Settings

- **maxPoolSize**: 10 connections
- **minPoolSize**: 2 connections
- **maxIdleTimeMS**: 30 seconds
- **serverSelectionTimeoutMS**: 5 seconds
- **socketTimeoutMS**: 45 seconds
- **connectTimeoutMS**: 10 seconds

## Error Types

- `DatabaseError` - Base database error class
- `ConnectionError` - Connection-related errors
- `ValidationError` - Data validation errors
- `DuplicateKeyError` - Unique constraint violations
- `NotFoundError` - Resource not found errors