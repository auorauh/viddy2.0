import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { ScriptModel } from '../models/script';
import { UserModel } from '../models/user';
import { ProjectModel } from '../models/project';
import { ContentType, ScriptStatus, ProjectView, Theme } from '../types';
import { ValidationError, NotFoundError, DatabaseError } from '../errors';

describe('ScriptModel', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let scriptModel: ScriptModel;
  let userModel: UserModel;
  let projectModel: ProjectModel;
  
  // Test data
  let testUserId: ObjectId;
  let testProjectId: ObjectId;
  let testFolderId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test-script-db');
    
    scriptModel = new ScriptModel(db);
    userModel = new UserModel(db);
    projectModel = new ProjectModel(db);
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections
    await db.collection('scripts').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('projects').deleteMany({});
    
    // Create test user
    const testUser = await userModel.createUser({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'User'
      },
      preferences: {
        defaultProjectView: ProjectView.GRID,
        theme: Theme.LIGHT
      }
    });
    testUserId = testUser._id;

    // Create test project
    const testProject = await projectModel.createProject({
      userId: testUserId,
      title: 'Test Project',
      description: 'A test project',
      settings: {
        isPublic: false,
        allowCollaboration: false
      }
    });
    testProjectId = testProject._id;
    testFolderId = testProject.folders[0].id; // Use default folder
  });

  afterEach(async () => {
    // Clean up after each test
    await db.collection('scripts').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('projects').deleteMany({});
  });

  describe('createScript', () => {
    it('should create a script with valid data', async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'This is a test script content',
        metadata: {
          contentType: ContentType.TIKTOK,
          duration: 30,
          tags: ['test', 'video'],
          status: ScriptStatus.DRAFT
        }
      };

      const script = await scriptModel.createScript(scriptData);

      expect(script).toBeDefined();
      expect(script._id).toBeInstanceOf(ObjectId);
      expect(script.title).toBe('Test Script');
      expect(script.content).toBe('This is a test script content');
      expect(script.metadata.contentType).toBe(ContentType.TIKTOK);
      expect(script.metadata.status).toBe(ScriptStatus.DRAFT);
      expect(script.versions).toHaveLength(1);
      expect(script.versions[0].version).toBe(1);
      expect(script.versions[0].content).toBe(scriptData.content);
      expect(script.createdAt).toBeInstanceOf(Date);
      expect(script.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a script with default status when not provided', async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'This is a test script content',
        metadata: {
          contentType: ContentType.YOUTUBE,
          tags: []
        }
      };

      const script = await scriptModel.createScript(scriptData);

      expect(script.metadata.status).toBe(ScriptStatus.DRAFT);
    });

    it('should trim title when creating script', async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: '  Test Script  ',
        content: 'Content',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: []
        }
      };

      const script = await scriptModel.createScript(scriptData);

      expect(script.title).toBe('Test Script');
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: '', // Empty title should fail
        content: 'Content',
        metadata: {
          contentType: ContentType.TIKTOK,
          tags: []
        }
      };

      await expect(scriptModel.createScript(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid ObjectId', async () => {
      const invalidData = {
        userId: 'invalid-id' as any,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'Content',
        metadata: {
          contentType: ContentType.TIKTOK,
          tags: []
        }
      };

      await expect(scriptModel.createScript(invalidData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find script by valid ObjectId', async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'Content',
        metadata: {
          contentType: ContentType.INSTAGRAM,
          tags: ['test']
        }
      };

      const createdScript = await scriptModel.createScript(scriptData);
      const foundScript = await scriptModel.findById(createdScript._id);

      expect(foundScript).toBeDefined();
      expect(foundScript!._id.toString()).toBe(createdScript._id.toString());
      expect(foundScript!.title).toBe('Test Script');
    });

    it('should find script by string ID', async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'Content',
        metadata: {
          contentType: ContentType.YOUTUBE,
          tags: []
        }
      };

      const createdScript = await scriptModel.createScript(scriptData);
      const foundScript = await scriptModel.findById(createdScript._id.toString());

      expect(foundScript).toBeDefined();
      expect(foundScript!._id.toString()).toBe(createdScript._id.toString());
    });

    it('should return null for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      const script = await scriptModel.findById(nonExistentId);

      expect(script).toBeNull();
    });

    it('should throw ValidationError for invalid ID format', async () => {
      await expect(scriptModel.findById('invalid-id')).rejects.toThrow(ValidationError);
    });
  });

  describe('findByUserId', () => {
    beforeEach(async () => {
      // Create multiple test scripts
      const scriptData1 = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Script 1',
        content: 'Content 1',
        metadata: {
          contentType: ContentType.TIKTOK,
          status: ScriptStatus.DRAFT,
          tags: ['tag1']
        }
      };

      const scriptData2 = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Script 2',
        content: 'Content 2',
        metadata: {
          contentType: ContentType.YOUTUBE,
          status: ScriptStatus.FINAL,
          tags: ['tag2']
        }
      };

      await scriptModel.createScript(scriptData1);
      await scriptModel.createScript(scriptData2);
    });

    it('should find all scripts for a user', async () => {
      const scripts = await scriptModel.findByUserId(testUserId);

      expect(scripts).toHaveLength(2);
      expect(scripts.every(s => s.userId.toString() === testUserId.toString())).toBe(true);
    });

    it('should filter scripts by status', async () => {
      const draftScripts = await scriptModel.findByUserId(testUserId, {
        status: ScriptStatus.DRAFT
      });

      expect(draftScripts).toHaveLength(1);
      expect(draftScripts[0].metadata.status).toBe(ScriptStatus.DRAFT);
    });

    it('should filter scripts by content type', async () => {
      const tiktokScripts = await scriptModel.findByUserId(testUserId, {
        contentType: ContentType.TIKTOK
      });

      expect(tiktokScripts).toHaveLength(1);
      expect(tiktokScripts[0].metadata.contentType).toBe(ContentType.TIKTOK);
    });

    it('should respect limit and skip options', async () => {
      const scripts = await scriptModel.findByUserId(testUserId, {
        limit: 1,
        skip: 1
      });

      expect(scripts).toHaveLength(1);
    });

    it('should sort scripts correctly', async () => {
      const scripts = await scriptModel.findByUserId(testUserId, {
        sortBy: 'title',
        sortOrder: 1
      });

      expect(scripts[0].title).toBe('Script 1');
      expect(scripts[1].title).toBe('Script 2');
    });
  });

  describe('updateScript', () => {
    let testScript: any;

    beforeEach(async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Original Title',
        content: 'Original content',
        metadata: {
          contentType: ContentType.TIKTOK,
          status: ScriptStatus.DRAFT,
          tags: ['original']
        }
      };

      testScript = await scriptModel.createScript(scriptData);
    });

    it('should update script title', async () => {
      // Add a small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updatedScript = await scriptModel.updateScript(testScript._id, {
        title: 'Updated Title'
      });

      expect(updatedScript.title).toBe('Updated Title');
      expect(updatedScript.updatedAt.getTime()).toBeGreaterThan(testScript.updatedAt.getTime());
    });

    it('should update script metadata', async () => {
      const updatedScript = await scriptModel.updateScript(testScript._id, {
        metadata: {
          status: ScriptStatus.FINAL,
          tags: ['updated', 'final']
        }
      });

      expect(updatedScript.metadata.status).toBe(ScriptStatus.FINAL);
      expect(updatedScript.metadata.tags).toEqual(['updated', 'final']);
    });

    it('should trim title when updating', async () => {
      const updatedScript = await scriptModel.updateScript(testScript._id, {
        title: '  Updated Title  '
      });

      expect(updatedScript.title).toBe('Updated Title');
    });

    it('should throw NotFoundError for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(scriptModel.updateScript(nonExistentId, {
        title: 'New Title'
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateScriptContent', () => {
    let testScript: any;

    beforeEach(async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'Original content',
        metadata: {
          contentType: ContentType.YOUTUBE,
          status: ScriptStatus.DRAFT,
          tags: []
        }
      };

      testScript = await scriptModel.createScript(scriptData);
    });

    it('should update content and create new version', async () => {
      const newContent = 'Updated content';
      const updatedScript = await scriptModel.updateScriptContent(testScript._id, newContent);

      expect(updatedScript.content).toBe(newContent);
      expect(updatedScript.versions).toHaveLength(2);
      expect(updatedScript.versions[1].version).toBe(2);
      expect(updatedScript.versions[1].content).toBe(newContent);
    });

    it('should update content and metadata', async () => {
      const newContent = 'Updated content';
      const updatedScript = await scriptModel.updateScriptContent(
        testScript._id, 
        newContent,
        { status: ScriptStatus.REVIEW }
      );

      expect(updatedScript.content).toBe(newContent);
      expect(updatedScript.metadata.status).toBe(ScriptStatus.REVIEW);
    });

    it('should throw NotFoundError for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(scriptModel.updateScriptContent(
        nonExistentId, 
        'New content'
      )).rejects.toThrow(NotFoundError);
    });
  });

  describe('revertToVersion', () => {
    let testScript: any;

    beforeEach(async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'Version 1 content',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: []
        }
      };

      testScript = await scriptModel.createScript(scriptData);
      
      // Create version 2
      await scriptModel.updateScriptContent(testScript._id, 'Version 2 content');
    });

    it('should revert to previous version', async () => {
      const revertedScript = await scriptModel.revertToVersion(testScript._id, 1);

      expect(revertedScript.content).toBe('Version 1 content');
      expect(revertedScript.versions).toHaveLength(3); // Original + update + revert
      expect(revertedScript.versions[2].version).toBe(3);
      expect(revertedScript.versions[2].content).toBe('Version 1 content');
    });

    it('should throw ValidationError for non-existent version', async () => {
      await expect(scriptModel.revertToVersion(testScript._id, 99)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(scriptModel.revertToVersion(nonExistentId, 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteScript', () => {
    let testScript: any;

    beforeEach(async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'Content to delete',
        metadata: {
          contentType: ContentType.INSTAGRAM,
          tags: []
        }
      };

      testScript = await scriptModel.createScript(scriptData);
    });

    it('should delete existing script', async () => {
      await scriptModel.deleteScript(testScript._id);

      const deletedScript = await scriptModel.findById(testScript._id);
      expect(deletedScript).toBeNull();
    });

    it('should throw NotFoundError for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(scriptModel.deleteScript(nonExistentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('moveScript', () => {
    let testScript: any;
    let secondProject: any;

    beforeEach(async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Script to Move',
        content: 'Content',
        metadata: {
          contentType: ContentType.TIKTOK,
          tags: []
        }
      };

      testScript = await scriptModel.createScript(scriptData);

      // Create second project
      secondProject = await projectModel.createProject({
        userId: testUserId,
        title: 'Second Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
    });

    it('should move script to different project and folder', async () => {
      const newFolderId = secondProject.folders[0].id;
      const movedScript = await scriptModel.moveScript(
        testScript._id,
        secondProject._id,
        newFolderId
      );

      expect(movedScript.projectId.toString()).toBe(secondProject._id.toString());
      expect(movedScript.folderId).toBe(newFolderId);
    });

    it('should throw NotFoundError for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(scriptModel.moveScript(
        nonExistentId,
        secondProject._id,
        secondProject.folders[0].id
      )).rejects.toThrow(NotFoundError);
    });
  });

  describe('searchScripts', () => {
    beforeEach(async () => {
      const scripts = [
        {
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: 'JavaScript Tutorial',
          content: 'Learn JavaScript programming',
          metadata: {
            contentType: ContentType.YOUTUBE,
            tags: ['javascript', 'programming']
          }
        },
        {
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: 'Python Basics',
          content: 'Introduction to Python',
          metadata: {
            contentType: ContentType.TIKTOK,
            tags: ['python', 'programming']
          }
        }
      ];

      for (const script of scripts) {
        await scriptModel.createScript(script);
      }
    });

    it('should search scripts by title', async () => {
      const results = await scriptModel.searchScripts(testUserId, 'JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Tutorial');
    });

    it('should search scripts by content', async () => {
      const results = await scriptModel.searchScripts(testUserId, 'programming');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter search results by content type', async () => {
      const results = await scriptModel.searchScripts(testUserId, 'programming', {
        contentType: ContentType.YOUTUBE
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata.contentType).toBe(ContentType.YOUTUBE);
    });
  });

  describe('getScriptStats', () => {
    beforeEach(async () => {
      const scripts = [
        {
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: 'Draft Script',
          content: 'Content',
          metadata: {
            contentType: ContentType.TIKTOK,
            status: ScriptStatus.DRAFT,
            tags: []
          }
        },
        {
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: 'Final Script',
          content: 'Content',
          metadata: {
            contentType: ContentType.YOUTUBE,
            status: ScriptStatus.FINAL,
            tags: []
          }
        }
      ];

      for (const script of scripts) {
        await scriptModel.createScript(script);
      }
    });

    it('should return correct script statistics', async () => {
      const stats = await scriptModel.getScriptStats(testUserId);

      expect(stats.totalScripts).toBe(2);
      expect(stats.scriptsByStatus[ScriptStatus.DRAFT]).toBe(1);
      expect(stats.scriptsByStatus[ScriptStatus.FINAL]).toBe(1);
      expect(stats.scriptsByContentType[ContentType.TIKTOK]).toBe(1);
      expect(stats.scriptsByContentType[ContentType.YOUTUBE]).toBe(1);
      expect(stats.recentActivity).toBeInstanceOf(Date);
    });

    it('should return empty stats for user with no scripts', async () => {
      const newUser = await userModel.createUser({
        email: 'empty@example.com',
        username: 'emptyuser',
        password: 'password123',
        profile: {},
        preferences: {
          defaultProjectView: ProjectView.GRID,
          theme: Theme.LIGHT
        }
      });

      const stats = await scriptModel.getScriptStats(newUser._id);

      expect(stats.totalScripts).toBe(0);
      expect(stats.recentActivity).toBeNull();
    });
  });

  describe('getVersionHistory', () => {
    let testScript: any;

    beforeEach(async () => {
      const scriptData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Versioned Script',
        content: 'Version 1',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: []
        }
      };

      testScript = await scriptModel.createScript(scriptData);
      
      // Create additional versions
      await scriptModel.updateScriptContent(testScript._id, 'Version 2');
      await scriptModel.updateScriptContent(testScript._id, 'Version 3');
    });

    it('should return version history sorted by version descending', async () => {
      const versions = await scriptModel.getVersionHistory(testScript._id);

      expect(versions).toHaveLength(3);
      expect(versions[0].version).toBe(3);
      expect(versions[1].version).toBe(2);
      expect(versions[2].version).toBe(1);
    });

    it('should throw NotFoundError for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(scriptModel.getVersionHistory(nonExistentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('countScriptsInFolder', () => {
    beforeEach(async () => {
      // Create scripts in the test folder
      for (let i = 0; i < 3; i++) {
        await scriptModel.createScript({
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: `Script ${i + 1}`,
          content: `Content ${i + 1}`,
          metadata: {
            contentType: ContentType.GENERAL,
            tags: []
          }
        });
      }
    });

    it('should count scripts in folder correctly', async () => {
      const count = await scriptModel.countScriptsInFolder(testProjectId, testFolderId);

      expect(count).toBe(3);
    });

    it('should return 0 for empty folder', async () => {
      // Add a new folder to the project
      const newFolder = await projectModel.addFolder(testProjectId, 'Empty Folder');
      const count = await scriptModel.countScriptsInFolder(testProjectId, newFolder.id);

      expect(count).toBe(0);
    });
  });

  describe('deleteScriptsByProjectId', () => {
    beforeEach(async () => {
      // Create scripts in the test project
      for (let i = 0; i < 2; i++) {
        await scriptModel.createScript({
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: `Script ${i + 1}`,
          content: `Content ${i + 1}`,
          metadata: {
            contentType: ContentType.GENERAL,
            tags: []
          }
        });
      }
    });

    it('should delete all scripts in project', async () => {
      const deletedCount = await scriptModel.deleteScriptsByProjectId(testProjectId);

      expect(deletedCount).toBe(2);

      const remainingScripts = await scriptModel.findByProjectId(testProjectId);
      expect(remainingScripts).toHaveLength(0);
    });

    it('should return 0 for project with no scripts', async () => {
      const emptyProject = await projectModel.createProject({
        userId: testUserId,
        title: 'Empty Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });

      const deletedCount = await scriptModel.deleteScriptsByProjectId(emptyProject._id);

      expect(deletedCount).toBe(0);
    });
  });

  describe('deleteScriptsByFolderId', () => {
    let secondFolderId: string;

    beforeEach(async () => {
      // Add a second folder
      const secondFolder = await projectModel.addFolder(testProjectId, 'Second Folder');
      secondFolderId = secondFolder.id;

      // Create scripts in both folders
      await scriptModel.createScript({
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Script in Folder 1',
        content: 'Content',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: []
        }
      });

      await scriptModel.createScript({
        userId: testUserId,
        projectId: testProjectId,
        folderId: secondFolderId,
        title: 'Script in Folder 2',
        content: 'Content',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: []
        }
      });
    });

    it('should delete scripts only in specified folder', async () => {
      const deletedCount = await scriptModel.deleteScriptsByFolderId(testProjectId, secondFolderId);

      expect(deletedCount).toBe(1);

      const remainingScripts = await scriptModel.findByProjectId(testProjectId);
      expect(remainingScripts).toHaveLength(1);
      expect(remainingScripts[0].folderId).toBe(testFolderId);
    });

    it('should return 0 for empty folder', async () => {
      const emptyFolder = await projectModel.addFolder(testProjectId, 'Empty Folder');
      const deletedCount = await scriptModel.deleteScriptsByFolderId(testProjectId, emptyFolder.id);

      expect(deletedCount).toBe(0);
    });
  });
});