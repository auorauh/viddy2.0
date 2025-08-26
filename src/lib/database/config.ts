import { MongoClientOptions } from 'mongodb';

export interface DatabaseConfig {
  uri: string;
  dbName: string;
  options: MongoClientOptions;
}

export const getDatabaseConfig = (): DatabaseConfig => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-content-creator';
  const dbName = process.env.MONGODB_DB_NAME || 'video-content-creator';

  const options: MongoClientOptions = {
    // Connection pool settings
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2,  // Minimum number of connections in the pool
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    
    // Connection timeout settings
    serverSelectionTimeoutMS: 5000, // How long to try selecting a server
    socketTimeoutMS: 45000, // How long a send or receive on a socket can take
    connectTimeoutMS: 10000, // How long to wait for a connection to be established
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
    
    // Monitoring
    monitorCommands: process.env.NODE_ENV === 'development',
  };

  return {
    uri,
    dbName,
    options,
  };
};