import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { ProjectRepository } from '../repositories/project-repository';
import { ProjectModel } from '../models/project';
import { UserModel } from '../models/user';
import { 
  Project, 
  User, 
  FolderNode,
  ValidationError,
  NotFoundError,
  DatabaseError
} from '../index';

describe('ProjectRepository', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let projectRepository: ProjectRepository;
  let projectModel: ProjectModel;
  let userModel: UserModel;
  let testUser: User;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test-database');
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections
    await db.collection('projects').deleteMany({});
    await db.collection('users').deleteMany({});
    
    // Initialize models and repository
    projectModel = new ProjectModel(db);
    projectRepository = new ProjectRepository(projectModel);
    userModel = new UserModel(db);

    // Create test user
    testUser = await userModel.createUser({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      }
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await db.collection('projects').deleteMany({});
    await db.collection('users').deleteMany({});
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'A test project',
        settings: {
          isPublic: false,
          allowCollaboration: true
        }
      };

      const project = await projectRepository.createProject(testUser._id, projectData);

      expect(project).toBeDefined();
      expect(project.title).toBe('Test Project');
      expect(project.description).toBe('A test project');
      expect(project.userId).toEqual(testUser._id);
      expect(project.settings.isPublic).toBe(false);
      expect(project.settings.allowCollaboration).toBe(true);
    });

    it('should create project with string user ID', async () => {
      const projectData = {
        title: 'String ID Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      };

      const project = await projectRepository.createProject(testUser._id.toString(), projectData);

      expect(project.userId).toEqual(testUser._id);
    });

    it('should throw ValidationError for invalid data', async () => {
      const projectData = {
        title: '', // Empty title
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      };

      await expect(projectRepository.createProject(testUser._id, projectData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getProjectById', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await projectRepository.createProject(testUser._id, {
        title: 'Test Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    it('should get project by ObjectId', async () => {
      const project = await projectRepository.getProjectById(testProject._id);

      expect(project).toBeDefined();
      expect(project._id).toEqual(testProject._id);
      expect(project.title).toBe('Test Project');
    });

    it('should get project by string ID', async () => {
      const project = await projectRepository.getProjectById(testProject._id.toString());

      expect(project._id).toEqual(testProject._id);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      const nonExistentId = new ObjectId();

      await expect(projectRepository.getProjectById(nonExistentId))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid ID format', async () => {
      await expect(projectRepository.getProjectById('invalid-id'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getUserProjects', () => {
    beforeEach(async () => {
      // Create multiple projects
      for (let i = 1; i <= 5; i++) {
        await projectRepository.createProject(testUser._id, {
          title: `Project ${i}`,
          settings: { isPublic: false, allowCollaboration: false }
        });
      }
    });

    it('should get all user projects with default pagination', async () => {
      const result = await projectRepository.getUserProjects(testUser._id);

      expect(result.projects).toHaveLength(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(5);
    });

    it('should respect pagination options', async () => {
      const result = await projectRepository.getUserProjects(testUser._id, {
        page: 2,
        limit: 2
      });

      expect(result.projects).toHaveLength(2);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
    });

    it('should sort projects by title ascending', async () => {
      const result = await projectRepository.getUserProjects(testUser._id, {
        sortBy: 'title',
        sortOrder: 'asc'
      });

      expect(result.projects[0].title).toBe('Project 1');
      expect(result.projects[1].title).toBe('Project 2');
    });

    it('should work with string user ID', async () => {
      const result = await projectRepository.getUserProjects(testUser._id.toString());

      expect(result.projects).toHaveLength(5);
    });
  });

  describe('updateProject', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await projectRepository.createProject(testUser._id, {
        title: 'Original Title',
        description: 'Original description',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    it('should update project successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const updatedProject = await projectRepository.updateProject(testProject._id, updateData);

      expect(updatedProject.title).toBe('Updated Title');
      expect(updatedProject.description).toBe('Updated description');
    });

    it('should throw NotFoundError for non-existent project', async () => {
      const nonExistentId = new ObjectId();

      await expect(projectRepository.updateProject(nonExistentId, { title: 'New Title' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProject', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await projectRepository.createProject(testUser._id, {
        title: 'Project to Delete',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    it('should delete project successfully', async () => {
      await projectRepository.deleteProject(testProject._id);

      await expect(projectRepository.getProjectById(testProject._id))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      const nonExistentId = new ObjectId();

      await expect(projectRepository.deleteProject(nonExistentId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('searchUserProjects', () => {
    beforeEach(async () => {
      await projectRepository.createProject(testUser._id, {
        title: 'JavaScript Tutorial',
        description: 'Learn JavaScript basics',
        settings: { isPublic: false, allowCollaboration: false }
      });

      await projectRepository.createProject(testUser._id, {
        title: 'Python Guide',
        description: 'Python programming tutorial',
        settings: { isPublic: false, allowCollaboration: false }
      });
    });

    it('should search projects by text', async () => {
      const result = await projectRepository.searchUserProjects(testUser._id, 'JavaScript');

      expect(result.projects.length).toBeGreaterThan(0);
      expect(result.projects.some(p => p.title.includes('JavaScript'))).toBe(true);
    });

    it('should respect pagination in search', async () => {
      const result = await projectRepository.searchUserProjects(testUser._id, 'tutorial', {
        limit: 1
      });

      expect(result.projects).toHaveLength(1);
      expect(result.limit).toBe(1);
    });
  });

  describe('folder management', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await projectRepository.createProject(testUser._id, {
        title: 'Folder Test Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    describe('createFolder', () => {
      it('should create folder successfully', async () => {
        const folder = await projectRepository.createFolder(testProject._id, 'New Folder');

        expect(folder.name).toBe('New Folder');
        expect(folder.parentId).toBeUndefined();
        expect(folder.scriptCount).toBe(0);
      });

      it('should trim folder name', async () => {
        const folder = await projectRepository.createFolder(testProject._id, '  Trimmed Folder  ');

        expect(folder.name).toBe('Trimmed Folder');
      });

      it('should throw ValidationError for empty folder name', async () => {
        await expect(projectRepository.createFolder(testProject._id, ''))
          .rejects.toThrow(ValidationError);

        await expect(projectRepository.createFolder(testProject._id, '   '))
          .rejects.toThrow(ValidationError);
      });

      it('should create child folder', async () => {
        const parentFolder = testProject.folders[0];
        const childFolder = await projectRepository.createFolder(
          testProject._id,
          'Child Folder',
          parentFolder.id
        );

        expect(childFolder.parentId).toBe(parentFolder.id);
      });
    });

    describe('updateFolder', () => {
      it('should update folder name', async () => {
        const folderId = testProject.folders[0].id;
        const updatedFolder = await projectRepository.updateFolder(
          testProject._id,
          folderId,
          { name: 'Updated Folder' }
        );

        expect(updatedFolder.name).toBe('Updated Folder');
      });

      it('should trim updated folder name', async () => {
        const folderId = testProject.folders[0].id;
        const updatedFolder = await projectRepository.updateFolder(
          testProject._id,
          folderId,
          { name: '  Trimmed Update  ' }
        );

        expect(updatedFolder.name).toBe('Trimmed Update');
      });

      it('should throw ValidationError for empty name', async () => {
        const folderId = testProject.folders[0].id;

        await expect(projectRepository.updateFolder(
          testProject._id,
          folderId,
          { name: '' }
        )).rejects.toThrow(ValidationError);
      });
    });

    describe('deleteFolder', () => {
      it('should delete folder successfully', async () => {
        const folderId = testProject.folders[0].id;

        await projectRepository.deleteFolder(testProject._id, folderId);

        const updatedProject = await projectRepository.getProjectById(testProject._id);
        expect(updatedProject.folders).toHaveLength(0);
      });
    });

    describe('getProjectFolders', () => {
      it('should get project folders', async () => {
        const folders = await projectRepository.getProjectFolders(testProject._id);

        expect(folders).toHaveLength(1);
        expect(folders[0].name).toBe('Scripts');
      });
    });
  });

  describe('updateFolderScriptCount', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await projectRepository.createProject(testUser._id, {
        title: 'Script Count Test',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    it('should update folder script count', async () => {
      const folderId = testProject.folders[0].id;

      await projectRepository.updateFolderScriptCount(testProject._id, folderId, 3);

      const updatedProject = await projectRepository.getProjectById(testProject._id);
      const folder = updatedProject.folders.find(f => f.id === folderId);
      
      expect(folder!.scriptCount).toBe(3);
      expect(updatedProject.stats.totalScripts).toBe(3);
    });
  });

  describe('getProjectStats', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await projectRepository.createProject(testUser._id, {
        title: 'Stats Test Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    it('should get project statistics', async () => {
      const stats = await projectRepository.getProjectStats(testProject._id);

      expect(stats.totalScripts).toBe(0);
      expect(stats.totalFolders).toBe(1); // Default "Scripts" folder
      expect(stats.lastActivity).toBeInstanceOf(Date);
    });

    it('should count nested folders correctly', async () => {
      // Add a child folder
      await projectRepository.createFolder(
        testProject._id,
        'Child Folder',
        testProject.folders[0].id
      );

      const stats = await projectRepository.getProjectStats(testProject._id);

      expect(stats.totalFolders).toBe(2); // Parent + child
    });
  });

  describe('isProjectOwner', () => {
    let testProject: Project;
    let otherUser: User;

    beforeEach(async () => {
      testProject = await projectRepository.createProject(testUser._id, {
        title: 'Ownership Test',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });

      otherUser = await userModel.createUser({
        email: 'other@example.com',
        username: 'otheruser',
        password: 'password123'
      });
    });

    it('should return true for project owner', async () => {
      const isOwner = await projectRepository.isProjectOwner(testProject._id, testUser._id);

      expect(isOwner).toBe(true);
    });

    it('should return false for non-owner', async () => {
      const isOwner = await projectRepository.isProjectOwner(testProject._id, otherUser._id);

      expect(isOwner).toBe(false);
    });

    it('should return false for non-existent project', async () => {
      const nonExistentId = new ObjectId();
      const isOwner = await projectRepository.isProjectOwner(nonExistentId, testUser._id);

      expect(isOwner).toBe(false);
    });

    it('should work with string IDs', async () => {
      const isOwner = await projectRepository.isProjectOwner(
        testProject._id.toString(),
        testUser._id.toString()
      );

      expect(isOwner).toBe(true);
    });
  });

  describe('getRecentProjects', () => {
    beforeEach(async () => {
      // Create projects with slight delays to ensure different timestamps
      for (let i = 1; i <= 3; i++) {
        await projectRepository.createProject(testUser._id, {
          title: `Recent Project ${i}`,
          settings: { isPublic: false, allowCollaboration: false }
        });
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    });

    it('should get recent projects', async () => {
      const recentProjects = await projectRepository.getRecentProjects(testUser._id);

      expect(recentProjects).toHaveLength(3);
      
      // Should be sorted by updatedAt descending (most recent first)
      for (let i = 0; i < recentProjects.length - 1; i++) {
        expect(recentProjects[i].updatedAt.getTime())
          .toBeGreaterThanOrEqual(recentProjects[i + 1].updatedAt.getTime());
      }
    });

    it('should respect limit parameter', async () => {
      const recentProjects = await projectRepository.getRecentProjects(testUser._id, 2);

      expect(recentProjects).toHaveLength(2);
    });

    it('should work with string user ID', async () => {
      const recentProjects = await projectRepository.getRecentProjects(testUser._id.toString());

      expect(recentProjects).toHaveLength(3);
    });
  });
});