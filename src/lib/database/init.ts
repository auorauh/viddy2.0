import { dbConnection } from './connection';
import { handleMongoError } from './errors';

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing database connection...');
    
    // Connect to database
    const db = await dbConnection.connect();
    
    // Perform health check
    const healthCheck = await dbConnection.healthCheck();
    console.log('Database health check:', healthCheck);
    
    // List existing collections (for debugging)
    const collections = await db.listCollections().toArray();
    console.log('Existing collections:', collections.map(c => c.name));
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    const dbError = handleMongoError(error);
    console.error('Database initialization failed:', dbError);
    throw dbError;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await dbConnection.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    const dbError = handleMongoError(error);
    console.error('Error closing database connection:', dbError);
    throw dbError;
  }
};

// Graceful shutdown handler
export const setupGracefulShutdown = (): void => {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    try {
      await closeDatabase();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
};