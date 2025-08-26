import { Db } from 'mongodb';
import { UserRepository } from './repositories/user-repository';
import { ProjectRepository } from './repositories/project-repository';
import { ScriptRepository } from './repositories/script-repository';
import { UserModel } from './models/user';
import { ProjectModel } from './models/project';
import { ScriptModel } from './models/script';
import { SearchService } from './search';
import { OptimizationService } from './optimization';
import { getDatabase } from './connection';

/**
 * Database service container that provides access to all repositories
 * Implements dependency injection pattern for database services
 */
export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: Db;
  private userRepository: UserRepository | null = null;
  private projectRepository: ProjectRepository | null = null;
  private scriptRepository: ScriptRepository | null = null;
  private searchService: SearchService | null = null;
  private optimizationService: OptimizationService | null = null;

  private constructor(db: Db) {
    this.db = db;
  }

  /**
   * Get singleton instance of DatabaseService
   */
  public static async getInstance(): Promise<DatabaseService> {
    if (!DatabaseService.instance) {
      const db = await getDatabase();
      DatabaseService.instance = new DatabaseService(db);
    }
    return DatabaseService.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    DatabaseService.instance = null;
  }

  /**
   * Get UserRepository instance with lazy initialization
   */
  public getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository(this.db);
    }
    return this.userRepository;
  }

  /**
   * Get ProjectRepository instance with lazy initialization
   */
  public getProjectRepository(): ProjectRepository {
    if (!this.projectRepository) {
      const projectModel = new ProjectModel(this.db);
      this.projectRepository = new ProjectRepository(projectModel);
    }
    return this.projectRepository;
  }

  /**
   * Get ScriptRepository instance with lazy initialization
   */
  public getScriptRepository(): ScriptRepository {
    if (!this.scriptRepository) {
      this.scriptRepository = new ScriptRepository(this.db);
    }
    return this.scriptRepository;
  }

  /**
   * Get SearchService instance with lazy initialization
   */
  public getSearchService(): SearchService {
    if (!this.searchService) {
      this.searchService = new SearchService(this.db);
    }
    return this.searchService;
  }

  /**
   * Get OptimizationService instance with lazy initialization
   */
  public getOptimizationService(): OptimizationService {
    if (!this.optimizationService) {
      this.optimizationService = new OptimizationService(this.db);
    }
    return this.optimizationService;
  }

  /**
   * Get all repositories as an object
   */
  public getAllRepositories(): {
    userRepository: UserRepository;
    projectRepository: ProjectRepository;
    scriptRepository: ScriptRepository;
  } {
    return {
      userRepository: this.getUserRepository(),
      projectRepository: this.getProjectRepository(),
      scriptRepository: this.getScriptRepository()
    };
  }

  /**
   * Get all services including search and optimization
   */
  public getAllServices(): {
    userRepository: UserRepository;
    projectRepository: ProjectRepository;
    scriptRepository: ScriptRepository;
    searchService: SearchService;
    optimizationService: OptimizationService;
  } {
    return {
      userRepository: this.getUserRepository(),
      projectRepository: this.getProjectRepository(),
      scriptRepository: this.getScriptRepository(),
      searchService: this.getSearchService(),
      optimizationService: this.getOptimizationService()
    };
  }

  /**
   * Get the underlying database instance
   */
  public getDatabase(): Db {
    return this.db;
  }

  /**
   * Health check for all database services
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    services: {
      database: boolean;
      userRepository: boolean;
      projectRepository: boolean;
      scriptRepository: boolean;
    };
    details?: any;
  }> {
    try {
      // Test database connection
      await this.db.admin().ping();

      // Test repository initialization
      const userRepo = this.getUserRepository();
      const projectRepo = this.getProjectRepository();
      const scriptRepo = this.getScriptRepository();
      const searchService = this.getSearchService();
      const optimizationService = this.getOptimizationService();

      return {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: true,
          userRepository: !!userRepo,
          projectRepository: !!projectRepo,
          scriptRepository: !!scriptRepo,
          searchService: !!searchService,
          optimizationService: !!optimizationService
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        services: {
          database: false,
          userRepository: false,
          projectRepository: false,
          scriptRepository: false,
          searchService: false,
          optimizationService: false
        },
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Service factory for creating database services
 */
export class DatabaseServiceFactory {
  /**
   * Create a new DatabaseService instance
   */
  public static async create(): Promise<DatabaseService> {
    return DatabaseService.getInstance();
  }

  /**
   * Create UserRepository directly
   */
  public static async createUserRepository(): Promise<UserRepository> {
    const db = await getDatabase();
    return new UserRepository(db);
  }

  /**
   * Create ProjectRepository directly
   */
  public static async createProjectRepository(): Promise<ProjectRepository> {
    const db = await getDatabase();
    const projectModel = new ProjectModel(db);
    return new ProjectRepository(projectModel);
  }

  /**
   * Create ScriptRepository directly
   */
  public static async createScriptRepository(): Promise<ScriptRepository> {
    const db = await getDatabase();
    return new ScriptRepository(db);
  }

  /**
   * Create all repositories at once
   */
  public static async createAllRepositories(): Promise<{
    userRepository: UserRepository;
    projectRepository: ProjectRepository;
    scriptRepository: ScriptRepository;
  }> {
    const service = await DatabaseService.getInstance();
    return service.getAllRepositories();
  }
}

/**
 * Dependency injection container for database services
 */
export class DatabaseContainer {
  private static services: Map<string, any> = new Map();

  /**
   * Register a service in the container
   */
  public static register<T>(key: string, factory: () => Promise<T>): void {
    DatabaseContainer.services.set(key, factory);
  }

  /**
   * Resolve a service from the container
   */
  public static async resolve<T>(key: string): Promise<T> {
    const factory = DatabaseContainer.services.get(key);
    if (!factory) {
      throw new Error(`Service '${key}' not registered in container`);
    }
    return await factory();
  }

  /**
   * Check if a service is registered
   */
  public static has(key: string): boolean {
    return DatabaseContainer.services.has(key);
  }

  /**
   * Clear all registered services
   */
  public static clear(): void {
    DatabaseContainer.services.clear();
  }

  /**
   * Initialize default services
   */
  public static async initializeDefaults(): Promise<void> {
    // Register default services
    DatabaseContainer.register('databaseService', () => DatabaseService.getInstance());
    DatabaseContainer.register('userRepository', () => DatabaseServiceFactory.createUserRepository());
    DatabaseContainer.register('projectRepository', () => DatabaseServiceFactory.createProjectRepository());
    DatabaseContainer.register('scriptRepository', () => DatabaseServiceFactory.createScriptRepository());
  }
}

/**
 * Utility functions for common database operations
 */
export class DatabaseUtils {
  /**
   * Initialize all database services and ensure indexes
   */
  public static async initialize(): Promise<DatabaseService> {
    const service = await DatabaseService.getInstance();
    
    // Initialize repositories to ensure indexes are created
    service.getUserRepository();
    service.getProjectRepository();
    service.getScriptRepository();
    
    // Initialize dependency injection container
    await DatabaseContainer.initializeDefaults();
    
    return service;
  }

  /**
   * Perform a transaction across multiple repositories
   */
  public static async withTransaction<T>(
    operation: (repositories: {
      userRepository: UserRepository;
      projectRepository: ProjectRepository;
      scriptRepository: ScriptRepository;
    }) => Promise<T>
  ): Promise<T> {
    const service = await DatabaseService.getInstance();
    const repositories = service.getAllRepositories();
    
    // Note: MongoDB transactions require replica sets or sharded clusters
    // For now, we'll execute the operation without a transaction
    // In production, you would wrap this in a MongoDB session transaction
    
    return await operation(repositories);
  }

  /**
   * Clean up resources
   */
  public static async cleanup(): Promise<void> {
    DatabaseService.resetInstance();
    DatabaseContainer.clear();
  }
}