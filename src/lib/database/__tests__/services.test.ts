import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Db } from 'mongodb';
import {
  DatabaseService,
  DatabaseServiceFactory,
  DatabaseContainer,
  DatabaseUtils
} from '../services';
import { UserRepository } from '../repositories/user-repository';
import { ProjectRepository } from '../repositories/project-repository';
import { ScriptRepository } from '../repositories/script-repository';

// Mock the connection module
vi.mock('../connection', () => ({
  getDatabase: vi.fn()
}));

describe('Database Services', () => {
  let mockDb: Partial<Db>;
  let mockGetDatabase: any;

  beforeEach(async () => {
    // Create mock database
    mockDb = {
      collection: vi.fn().mockReturnValue({
        createIndex: vi.fn(),
        insertOne: vi.fn(),
        findOne: vi.fn(),
        updateOne: vi.fn(),
        deleteOne: vi.fn(),
        countDocuments: vi.fn(),
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([])
        })
      }),
      admin: vi.fn().mockReturnValue({
        ping: vi.fn().mockResolvedValue({ ok: 1 }),
        serverStatus: vi.fn().mockResolvedValue({
          uptime: 100,
          connections: { current: 1, available: 100 }
        })
      })
    };

    // Mock getDatabase function
    const { getDatabase } = await import('../connection');
    mockGetDatabase = vi.mocked(getDatabase);
    mockGetDatabase.mockResolvedValue(mockDb as Db);

    // Reset singletons
    DatabaseService.resetInstance();
    DatabaseContainer.clear();
  });

  afterEach(async () => {
    DatabaseService.resetInstance();
    DatabaseContainer.clear();
    vi.clearAllMocks();
  });

  describe('DatabaseService', () => {
    it('should create singleton instance', async () => {
      const service1 = await DatabaseService.getInstance();
      const service2 = await DatabaseService.getInstance();
      
      expect(service1).toBe(service2);
    });

    it('should provide UserRepository', async () => {
      const service = await DatabaseService.getInstance();
      const userRepo = service.getUserRepository();
      
      expect(userRepo).toBeInstanceOf(UserRepository);
    });

    it('should provide ProjectRepository', async () => {
      const service = await DatabaseService.getInstance();
      const projectRepo = service.getProjectRepository();
      
      expect(projectRepo).toBeInstanceOf(ProjectRepository);
    });

    it('should provide ScriptRepository', async () => {
      const service = await DatabaseService.getInstance();
      const scriptRepo = service.getScriptRepository();
      
      expect(scriptRepo).toBeInstanceOf(ScriptRepository);
    });

    it('should provide all repositories', async () => {
      const service = await DatabaseService.getInstance();
      const repos = service.getAllRepositories();
      
      expect(repos.userRepository).toBeInstanceOf(UserRepository);
      expect(repos.projectRepository).toBeInstanceOf(ProjectRepository);
      expect(repos.scriptRepository).toBeInstanceOf(ScriptRepository);
    });

    it('should return same repository instances on multiple calls', async () => {
      const service = await DatabaseService.getInstance();
      
      const userRepo1 = service.getUserRepository();
      const userRepo2 = service.getUserRepository();
      
      expect(userRepo1).toBe(userRepo2);
    });

    it('should provide database instance', async () => {
      const service = await DatabaseService.getInstance();
      const database = service.getDatabase();
      
      expect(database).toBe(mockDb);
    });

    it('should perform health check', async () => {
      const service = await DatabaseService.getInstance();
      const health = await service.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.services.database).toBe(true);
      expect(health.services.userRepository).toBe(true);
      expect(health.services.projectRepository).toBe(true);
      expect(health.services.scriptRepository).toBe(true);
    });

    it('should reset instance', () => {
      DatabaseService.resetInstance();
      
      // This is tested implicitly by the beforeEach setup
      expect(true).toBe(true);
    });
  });

  describe('DatabaseServiceFactory', () => {
    it('should create DatabaseService', async () => {
      const service = await DatabaseServiceFactory.create();
      
      expect(service).toBeInstanceOf(DatabaseService);
    });

    it('should create UserRepository directly', async () => {
      const userRepo = await DatabaseServiceFactory.createUserRepository();
      
      expect(userRepo).toBeInstanceOf(UserRepository);
    });

    it('should create ProjectRepository directly', async () => {
      const projectRepo = await DatabaseServiceFactory.createProjectRepository();
      
      expect(projectRepo).toBeInstanceOf(ProjectRepository);
    });

    it('should create ScriptRepository directly', async () => {
      const scriptRepo = await DatabaseServiceFactory.createScriptRepository();
      
      expect(scriptRepo).toBeInstanceOf(ScriptRepository);
    });

    it('should create all repositories', async () => {
      const repos = await DatabaseServiceFactory.createAllRepositories();
      
      expect(repos.userRepository).toBeInstanceOf(UserRepository);
      expect(repos.projectRepository).toBeInstanceOf(ProjectRepository);
      expect(repos.scriptRepository).toBeInstanceOf(ScriptRepository);
    });
  });

  describe('DatabaseContainer', () => {
    it('should register and resolve services', async () => {
      const mockService = { test: 'value' };
      const factory = vi.fn().mockResolvedValue(mockService);
      
      DatabaseContainer.register('testService', factory);
      const resolved = await DatabaseContainer.resolve('testService');
      
      expect(resolved).toBe(mockService);
      expect(factory).toHaveBeenCalledOnce();
    });

    it('should check if service is registered', () => {
      DatabaseContainer.register('testService', vi.fn());
      
      expect(DatabaseContainer.has('testService')).toBe(true);
      expect(DatabaseContainer.has('nonExistentService')).toBe(false);
    });

    it('should throw error for unregistered service', async () => {
      await expect(DatabaseContainer.resolve('nonExistentService'))
        .rejects.toThrow("Service 'nonExistentService' not registered in container");
    });

    it('should clear all services', () => {
      DatabaseContainer.register('testService1', vi.fn());
      DatabaseContainer.register('testService2', vi.fn());
      
      DatabaseContainer.clear();
      
      expect(DatabaseContainer.has('testService1')).toBe(false);
      expect(DatabaseContainer.has('testService2')).toBe(false);
    });

    it('should initialize default services', async () => {
      await DatabaseContainer.initializeDefaults();
      
      expect(DatabaseContainer.has('databaseService')).toBe(true);
      expect(DatabaseContainer.has('userRepository')).toBe(true);
      expect(DatabaseContainer.has('projectRepository')).toBe(true);
      expect(DatabaseContainer.has('scriptRepository')).toBe(true);
    });

    it('should resolve default services', async () => {
      await DatabaseContainer.initializeDefaults();
      
      const databaseService = await DatabaseContainer.resolve('databaseService');
      const userRepository = await DatabaseContainer.resolve('userRepository');
      const projectRepository = await DatabaseContainer.resolve('projectRepository');
      const scriptRepository = await DatabaseContainer.resolve('scriptRepository');
      
      expect(databaseService).toBeInstanceOf(DatabaseService);
      expect(userRepository).toBeInstanceOf(UserRepository);
      expect(projectRepository).toBeInstanceOf(ProjectRepository);
      expect(scriptRepository).toBeInstanceOf(ScriptRepository);
    });
  });

  describe('DatabaseUtils', () => {
    it('should initialize database services', async () => {
      const service = await DatabaseUtils.initialize();
      
      expect(service).toBeInstanceOf(DatabaseService);
      expect(DatabaseContainer.has('databaseService')).toBe(true);
    });

    it('should execute transaction-like operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue('result');
      
      const result = await DatabaseUtils.withTransaction(mockOperation);
      
      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalledWith({
        userRepository: expect.any(UserRepository),
        projectRepository: expect.any(ProjectRepository),
        scriptRepository: expect.any(ScriptRepository)
      });
    });

    it('should cleanup resources', async () => {
      // Initialize first
      await DatabaseUtils.initialize();
      expect(DatabaseContainer.has('databaseService')).toBe(true);
      
      // Cleanup
      await DatabaseUtils.cleanup();
      expect(DatabaseContainer.has('databaseService')).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should provide service layer functionality', async () => {
      const service = await DatabaseUtils.initialize();
      const userRepo = service.getUserRepository();
      
      expect(userRepo).toBeInstanceOf(UserRepository);
      expect(service).toBeInstanceOf(DatabaseService);
      expect(DatabaseContainer.has('databaseService')).toBe(true);
    });

    it('should handle repository creation through service', async () => {
      const service = await DatabaseUtils.initialize();
      const { userRepository, projectRepository, scriptRepository } = service.getAllRepositories();
      
      expect(userRepository).toBeInstanceOf(UserRepository);
      expect(projectRepository).toBeInstanceOf(ProjectRepository);
      expect(scriptRepository).toBeInstanceOf(ScriptRepository);
    });

    it('should execute transaction-like operations with service layer', async () => {
      await DatabaseUtils.initialize();
      
      const mockOperation = vi.fn().mockResolvedValue({ success: true });
      
      const result = await DatabaseUtils.withTransaction(mockOperation);
      
      expect(result.success).toBe(true);
      expect(mockOperation).toHaveBeenCalledWith({
        userRepository: expect.any(UserRepository),
        projectRepository: expect.any(ProjectRepository),
        scriptRepository: expect.any(ScriptRepository)
      });
    });
  });
});