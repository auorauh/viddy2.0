import { MongoClient, Db } from 'mongodb';
import { getDatabaseConfig } from './config';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.db) {
        return this.db;
      }
    }

    this.isConnecting = true;

    try {
      const config = getDatabaseConfig();
      
      console.log('Connecting to MongoDB...');
      this.client = new MongoClient(config.uri, config.options);
      
      await this.client.connect();
      this.db = this.client.db(config.dbName);
      
      // Test the connection
      await this.db.admin().ping();
      
      console.log('Successfully connected to MongoDB');
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      return this.db;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.client = null;
      this.db = null;
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      console.log('Disconnecting from MongoDB...');
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Disconnected from MongoDB');
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public isConnected(): boolean {
    return this.db !== null && this.client !== null;
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('connectionPoolCreated', () => {
      console.log('MongoDB connection pool created');
    });

    this.client.on('connectionPoolClosed', () => {
      console.log('MongoDB connection pool closed');
    });

    this.client.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    this.client.on('close', () => {
      console.log('MongoDB connection closed');
      this.db = null;
      this.client = null;
    });

    this.client.on('reconnect', () => {
      console.log('MongoDB reconnected');
    });
  }

  public async healthCheck(): Promise<{ status: string; timestamp: Date; details?: any }> {
    try {
      if (!this.db) {
        return {
          status: 'disconnected',
          timestamp: new Date(),
          details: 'No database connection'
        };
      }

      const pingResult = await this.db.admin().ping();
      const serverStatus = await this.db.admin().serverStatus();
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        details: {
          ping: pingResult,
          uptime: serverStatus.uptime,
          connections: serverStatus.connections
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

// Utility function for getting database instance
export const getDatabase = (): Db => {
  return dbConnection.getDb();
};

// Utility function for connecting to database
export const connectToDatabase = async (): Promise<Db> => {
  return await dbConnection.connect();
};

// Utility function for setting database (for testing)
export const setDatabase = (db: Db): void => {
  (dbConnection as any).db = db;
};