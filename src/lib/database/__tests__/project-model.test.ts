import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { ProjectModel } from '../models/project';
import { UserModel } from '../models/user';
import { 
  Project, 
  User, 
  FolderNode, 
  ProjectInput,
  ProjectUpdateInput,
  ValidationError,
  NotFoundError,
  DatabaseError
} from '../index';

describe('ProjectModel', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
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
    
    // Initialize models
    projectModel = new ProjectModel(db);
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
    it('should create a project with default folder structure', async () => {
      const projectData = {
        userId: testUser._id,
        title: 'Test Project',
        description: 'A test project',
        settings: {
          isPublic: false,
          allowCollaboration: true
        }
      };

      const project = await projectModel.createProject(projectData);

      expect(project).toBeDefined();
      expect(project._id).toBeInstanceOf(ObjectId);
      expect(project.title).toBe('Test Project');
      expect(project.description).toBe('A test project');
      expect(project.userId).toEqual(testUser._id);
      expect(project.folders).toHaveLength(1);
      expect(project.folders[0].name).toBe('Scripts');
      expect(project.folders[0].scriptCount).toBe(0);
      expect(project.settings.isPublic).toBe(false);
      expect(project.settings.allowCollaboration).toBe(true);
      expect(project.stats.totalScripts).toBe(0);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a project with custom folder structure', async () => {
      const customFolders: FolderNode[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Main Scripts',
          scriptCount: 0,
          createdAt: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Draft Scripts',
          scriptCount: 0,
          createdAt: new Date()
        }
      ];

      const projectData = {
        userId: testUser._id,
        title: 'Custom Project',
        folders: customFolders,
        settings: {
          isPublic: true,
          allowCollaboration: false
        }
      };

      const project = await projectModel.createProject(projectData);

      expect(project.folders).toHaveLength(2);
      expect(project.folders[0].name).toBe('Main Scripts');
      expect(project.folders[1].name).toBe('Draft Scripts');
    });

    it('should trim whitespace from title and description', async () => {
      const projectData = {
        userId: testUser._id,
        title: '  Whitespace Project  ',
        description: '  Description with spaces  ',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      };

      const project = await projectModel.createProject(projectData);

      expect(project.title).toBe('Whitespace Project');
      expect(project.description).toBe('Description with spaces');
    });

    it('should throw ValidationError for invalid folder hierarchy', async () => {
      const invalidFolders: FolderNode[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Folder 1',
          scriptCount: 0,
          createdAt: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001', // Duplicate ID
          name: 'Folder 2',
          scriptCount: 0,
          createdAt: new Date()
        }
      ];

      const projectData = {
        userId: testUser._id,
        title: 'Invalid Project',
        folders: invalidFolders,
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      };

      await expect(projectModel.createProject(projectData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty title', async () => {
      const projectData = {
        userId: testUser._id,
        title: '',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      };

      await expect(projectModel.createProject(projectData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('findById', () => {
    it('should find project by ObjectId', async () => {
      const createdProject = await projectModel.createProject({
        userId: testUser._id,
        title: 'Find Test Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });

      const foundProject = await projectModel.findById(createdProject._id);

      expect(foundProject).toBeDefined();
      expect(foundProject!._id).toEqual(createdProject._id);
      expect(foundProject!.title).toBe('Find Test Project');
    });

    it('should find project by string ID', async () => {
      const createdProject = await projectModel.createProject({
        userId: testUser._id,
        title: 'Find Test Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });

      const foundProject = await projectModel.findById(createdProject._id.toString());

      expect(foundProject).toBeDefined();
      expect(foundProject!._id).toEqual(createdProject._id);
    });

    it('should return null for non-existent project', async () => {
      const nonExistentId = new ObjectId();
      const foundProject = await projectModel.findById(nonExistentId);

      expect(foundProject).toBeNull();
    });

    it('should throw ValidationError for invalid ID format', async () => {
      await expect(projectModel.findById('invalid-id'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('findByUserId', () => {
    beforeEach(async () => {
      // Create multiple projects for testing
      await projectModel.createProject({
        userId: testUser._id,
        title: 'Project 1',
        settings: { isPublic: false, allowCollaboration: false }
      });

      await projectModel.createProject({
        userId: testUser._id,
        title: 'Project 2',
        settings: { isPublic: false, allowCollaboration: false }
      });

      await projectModel.createProject({
        userId: testUser._id,
        title: 'Project 3',
        settings: { isPublic: false, allowCollaboration: false }
      });
    });

    it('should find all projects for a user', async () => {
      const projects = await projectModel.findByUserId(testUser._id);

      expect(projects).toHaveLength(3);
      expect(projects.every(p => p.userId.equals(testUser._id))).toBe(true);
    });

    it('should respect limit option', async () => {
      const projects = await projectModel.findByUserId(testUser._id, { limit: 2 });

      expect(projects).toHaveLength(2);
    });

    it('should respect skip option', async () => {
      const allProjects = await projectModel.findByUserId(testUser._id);
      const skippedProjects = await projectModel.findByUserId(testUser._id, { skip: 1 });

      expect(skippedProjects).toHaveLength(2);
      expect(skippedProjects[0]._id).toEqual(allProjects[1]._id);
    });

    it('should sort by updatedAt descending by default', async () => {
      const projects = await projectModel.findByUserId(testUser._id);

      for (let i = 0; i < projects.length - 1; i++) {
        expect(projects[i].updatedAt.getTime())
          .toBeGreaterThanOrEqual(projects[i + 1].updatedAt.getTime());
      }
    });

    it('should sort by title ascending when specified', async () => {
      const projects = await projectModel.findByUserId(testUser._id, {
        sortBy: 'title',
        sortOrder: 1
      });

      expect(projects[0].title).toBe('Project 1');
      expect(projects[1].title).toBe('Project 2');
      expect(projects[2].title).toBe('Project 3');
    });
  });

  describe('updateProject', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await projectModel.createProject({
        userId: testUser._id,
        title: 'Original Title',
        description: 'Original description',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    it('should update project title and description', async () => {
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updateData: ProjectUpdateInput = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const updatedProject = await projectModel.updateProject(testProject._id, updateData);

      expect(updatedProject.title).toBe('Updated Title');
      expect(updatedProject.description).toBe('Updated description');
      expect(updatedProject.updatedAt.getTime()).toBeGreaterThanOrEqual(testProject.updatedAt.getTime());
    });

    it('should update project settings', async () => {
      const updateData: ProjectUpdateInput = {
        settings: {
          isPublic: true,
          allowCollaboration: true
        }
      };

      const updatedProject = await projectModel.updateProject(testProject._id, updateData);

      expect(updatedProject.settings.isPublic).toBe(true);
      expect(updatedProject.settings.allowCollaboration).toBe(true);
    });

    it('should trim whitespace from updated title and description', async () => {
      const updateData: ProjectUpdateInput = {
        title: '  Trimmed Title  ',
        description: '  Trimmed description  '
      };

      const updatedProject = await projectModel.updateProject(testProject._id, updateData);

      expect(updatedProject.title).toBe('Trimmed Title');
      expect(updatedProject.description).toBe('Trimmed description');
    });

    it('should throw NotFoundError for non-existent project', async () => {
      const nonExistentId = new ObjectId();
      const updateData: ProjectUpdateInput = {
        title: 'New Title'
      };

      await expect(projectModel.updateProject(nonExistentId, updateData))
        .rejects.toThrow(NotFoundError);
    });

    it('should validate folder hierarchy when updating folders', async () => {
      const invalidFolders: FolderNode[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Folder 1',
          scriptCount: 0,
          createdAt: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001', // Duplicate ID
          name: 'Folder 2',
          scriptCount: 0,
          createdAt: new Date()
        }
      ];

      const updateData: ProjectUpdateInput = {
        folders: invalidFolders
      };

      await expect(projectModel.updateProject(testProject._id, updateData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteProject', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await projectModel.createProject({
        userId: testUser._id,
        title: 'Project to Delete',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    it('should delete existing project', async () => {
      await projectModel.deleteProject(testProject._id);

      const deletedProject = await projectModel.findById(testProject._id);
      expect(deletedProject).toBeNull();
    });

    it('should throw NotFoundError for non-existent project', async () => {
      const nonExistentId = new ObjectId();

      await expect(projectModel.deleteProject(nonExistentId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('folder management', () => {
    let testProject: Project;

    beforeEach(async () => {
      testProject = await projectModel.createProject({
        userId: testUser._id,
        title: 'Folder Test Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    describe('addFolder', () => {
      it('should add folder to root level', async () => {
        const newFolder = await projectModel.addFolder(testProject._id, 'New Folder');

        expect(newFolder.name).toBe('New Folder');
        expect(newFolder.parentId).toBeUndefined();
        expect(newFolder.scriptCount).toBe(0);
        expect(newFolder.id).toBeDefined();

        const updatedProject = await projectModel.findById(testProject._id);
        expect(updatedProject!.folders).toHaveLength(2); // Original + new
      });

      it('should add folder as child of existing folder', async () => {
        const parentFolder = testProject.folders[0];
        const childFolder = await projectModel.addFolder(
          testProject._id, 
          'Child Folder', 
          parentFolder.id
        );

        expect(childFolder.name).toBe('Child Folder');
        expect(childFolder.parentId).toBe(parentFolder.id);

        const updatedProject = await projectModel.findById(testProject._id);
        const updatedParent = updatedProject!.folders.find(f => f.id === parentFolder.id);
        expect(updatedParent!.children).toHaveLength(1);
        expect(updatedParent!.children![0].name).toBe('Child Folder');
      });

      it('should throw ValidationError for non-existent parent', async () => {
        await expect(projectModel.addFolder(testProject._id, 'Child Folder', 'non-existent'))
          .rejects.toThrow(ValidationError);
      });

      it('should throw NotFoundError for non-existent project', async () => {
        const nonExistentId = new ObjectId();

        await expect(projectModel.addFolder(nonExistentId, 'New Folder'))
          .rejects.toThrow(NotFoundError);
      });
    });

    describe('updateFolder', () => {
      it('should update folder name', async () => {
        const folderId = testProject.folders[0].id;
        const updatedFolder = await projectModel.updateFolder(
          testProject._id,
          folderId,
          { name: 'Updated Folder Name' }
        );

        expect(updatedFolder.name).toBe('Updated Folder Name');
        expect(updatedFolder.id).toBe(folderId);

        const updatedProject = await projectModel.findById(testProject._id);
        const folder = updatedProject!.folders.find(f => f.id === folderId);
        expect(folder!.name).toBe('Updated Folder Name');
      });

      it('should throw NotFoundError for non-existent folder', async () => {
        await expect(projectModel.updateFolder(
          testProject._id,
          'non-existent-folder',
          { name: 'New Name' }
        )).rejects.toThrow(NotFoundError);
      });

      it('should throw NotFoundError for non-existent project', async () => {
        const nonExistentId = new ObjectId();

        await expect(projectModel.updateFolder(
          nonExistentId,
          testProject.folders[0].id,
          { name: 'New Name' }
        )).rejects.toThrow(NotFoundError);
      });
    });

    describe('deleteFolder', () => {
      it('should delete folder and its children', async () => {
        // Add a child folder first
        const childFolder = await projectModel.addFolder(
          testProject._id,
          'Child Folder',
          testProject.folders[0].id
        );

        // Delete the parent folder
        await projectModel.deleteFolder(testProject._id, testProject.folders[0].id);

        const updatedProject = await projectModel.findById(testProject._id);
        expect(updatedProject!.folders).toHaveLength(0);
      });

      it('should throw NotFoundError for non-existent folder', async () => {
        await expect(projectModel.deleteFolder(testProject._id, 'non-existent-folder'))
          .rejects.toThrow(NotFoundError);
      });

      it('should throw NotFoundError for non-existent project', async () => {
        const nonExistentId = new ObjectId();

        await expect(projectModel.deleteFolder(nonExistentId, testProject.folders[0].id))
          .rejects.toThrow(NotFoundError);
      });
    });

    describe('updateFolderScriptCount', () => {
      it('should update script count and project stats', async () => {
        const folderId = testProject.folders[0].id;

        // Add a small delay to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 1));

        await projectModel.updateFolderScriptCount(testProject._id, folderId, 3);

        const updatedProject = await projectModel.findById(testProject._id);
        const folder = updatedProject!.folders.find(f => f.id === folderId);
        
        expect(folder!.scriptCount).toBe(3);
        expect(updatedProject!.stats.totalScripts).toBe(3);
        expect(updatedProject!.stats.lastActivity.getTime())
          .toBeGreaterThan(testProject.stats.lastActivity.getTime());
      });

      it('should handle negative deltas without going below zero', async () => {
        const folderId = testProject.folders[0].id;

        await projectModel.updateFolderScriptCount(testProject._id, folderId, -5);

        const updatedProject = await projectModel.findById(testProject._id);
        const folder = updatedProject!.folders.find(f => f.id === folderId);
        
        expect(folder!.scriptCount).toBe(0);
      });

      it('should throw NotFoundError for non-existent project', async () => {
        const nonExistentId = new ObjectId();

        await expect(projectModel.updateFolderScriptCount(
          nonExistentId,
          testProject.folders[0].id,
          1
        )).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('searchProjects', () => {
    beforeEach(async () => {
      await projectModel.createProject({
        userId: testUser._id,
        title: 'JavaScript Tutorial',
        description: 'Learn JavaScript basics',
        settings: { isPublic: false, allowCollaboration: false }
      });

      await projectModel.createProject({
        userId: testUser._id,
        title: 'Python Guide',
        description: 'Python programming tutorial',
        settings: { isPublic: false, allowCollaboration: false }
      });

      await projectModel.createProject({
        userId: testUser._id,
        title: 'Web Development',
        description: 'HTML, CSS, and JavaScript',
        settings: { isPublic: false, allowCollaboration: false }
      });
    });

    it('should search projects by title', async () => {
      const results = await projectModel.searchProjects(testUser._id, 'JavaScript');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.title.includes('JavaScript'))).toBe(true);
    });

    it('should search projects by description', async () => {
      const results = await projectModel.searchProjects(testUser._id, 'tutorial');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.description?.includes('tutorial'))).toBe(true);
    });

    it('should respect limit option', async () => {
      const results = await projectModel.searchProjects(testUser._id, 'tutorial', { limit: 1 });

      expect(results).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      const results = await projectModel.searchProjects(testUser._id, 'nonexistent');

      expect(results).toHaveLength(0);
    });
  });
});