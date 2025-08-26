import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { ScriptRepository } from '../repositories/script-repository';
import { UserModel } from '../models/user';
import { ProjectModel } from '../models/project';
import { ContentType, ScriptStatus, ProjectView, Theme } from '../types';
import { ValidationError, NotFoundError, DatabaseError } from '../errors';

describe('ScriptRepository', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let scriptRepository: ScriptRepository;
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
    db = client.db('test-script-repository-db');
    
    scriptRepository = new ScriptRepository(db);
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
    testFolderId = testProject.folders[0].id;
  });

  afterEach(async () => {
    // Clean up after each test
    await db.collection('scripts').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('projects').deleteMany({});
  });

  describe('create', () => {
    it('should create a script successfully', async () => {
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

      const script = await scriptRepository.create(scriptData);

      expect(script).toBeDefined();
      expect(script._id).toBeInstanceOf(ObjectId);
      expect(script.title).toBe('Test Script');
      expect(script.metadata.contentType).toBe(ContentType.TIKTOK);
      expect(script.versions).toHaveLength(1);
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: '', // Empty title
        content: 'Content',
        metadata: {
          contentType: ContentType.TIKTOK,
          tags: []
        }
      };

      await expect(scriptRepository.create(invalidData)).rejects.toThrow(ValidationError);
    });
  });

  describe('findById', () => {
    it('should find script by ID', async () => {
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

      const createdScript = await scriptRepository.create(scriptData);
      const foundScript = await scriptRepository.findById(createdScript._id);

      expect(foundScript).toBeDefined();
      expect(foundScript!._id.toString()).toBe(createdScript._id.toString());
    });

    it('should return null for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      const script = await scriptRepository.findById(nonExistentId);

      expect(script).toBeNull();
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(scriptRepository.findById('invalid-id')).rejects.toThrow(ValidationError);
    });
  });

  describe('findByUser', () => {
    beforeEach(async () => {
      // Create test scripts
      const scripts = [
        {
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
        },
        {
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
        }
      ];

      for (const script of scripts) {
        await scriptRepository.create(script);
      }
    });

    it('should find all scripts for a user', async () => {
      const scripts = await scriptRepository.findByUser(testUserId);

      expect(scripts).toHaveLength(2);
      expect(scripts.every(s => s.userId.toString() === testUserId.toString())).toBe(true);
    });

    it('should filter by status', async () => {
      const draftScripts = await scriptRepository.findByUser(testUserId, {
        status: ScriptStatus.DRAFT
      });

      expect(draftScripts).toHaveLength(1);
      expect(draftScripts[0].metadata.status).toBe(ScriptStatus.DRAFT);
    });

    it('should filter by content type', async () => {
      const tiktokScripts = await scriptRepository.findByUser(testUserId, {
        contentType: ContentType.TIKTOK
      });

      expect(tiktokScripts).toHaveLength(1);
      expect(tiktokScripts[0].metadata.contentType).toBe(ContentType.TIKTOK);
    });

    it('should respect pagination options', async () => {
      const scripts = await scriptRepository.findByUser(testUserId, {
        limit: 1,
        skip: 1
      });

      expect(scripts).toHaveLength(1);
    });
  });

  describe('findByProject', () => {
    let secondProjectId: ObjectId;

    beforeEach(async () => {
      // Create second project
      const secondProject = await projectModel.createProject({
        userId: testUserId,
        title: 'Second Project',
        settings: {
          isPublic: false,
          allowCollaboration: false
        }
      });
      secondProjectId = secondProject._id;

      // Create scripts in both projects
      await scriptRepository.create({
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Script in Project 1',
        content: 'Content',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: []
        }
      });

      await scriptRepository.create({
        userId: testUserId,
        projectId: secondProjectId,
        folderId: secondProject.folders[0].id,
        title: 'Script in Project 2',
        content: 'Content',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: []
        }
      });
    });

    it('should find scripts by project ID', async () => {
      const scripts = await scriptRepository.findByProject(testProjectId);

      expect(scripts).toHaveLength(1);
      expect(scripts[0].projectId.toString()).toBe(testProjectId.toString());
    });

    it('should filter by folder ID', async () => {
      const scripts = await scriptRepository.findByProject(testProjectId, {
        folderId: testFolderId
      });

      expect(scripts).toHaveLength(1);
      expect(scripts[0].folderId).toBe(testFolderId);
    });
  });

  describe('update', () => {
    let testScript: any;

    beforeEach(async () => {
      testScript = await scriptRepository.create({
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
      });
    });

    it('should update script successfully', async () => {
      const updatedScript = await scriptRepository.update(testScript._id, {
        title: 'Updated Title',
        metadata: {
          status: ScriptStatus.FINAL
        }
      });

      expect(updatedScript.title).toBe('Updated Title');
      expect(updatedScript.metadata.status).toBe(ScriptStatus.FINAL);
    });

    it('should throw NotFoundError for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(scriptRepository.update(nonExistentId, {
        title: 'New Title'
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateContent', () => {
    let testScript: any;

    beforeEach(async () => {
      testScript = await scriptRepository.create({
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'Original content',
        metadata: {
          contentType: ContentType.YOUTUBE,
          tags: []
        }
      });
    });

    it('should update content and create new version', async () => {
      const newContent = 'Updated content';
      const updatedScript = await scriptRepository.updateContent(testScript._id, newContent);

      expect(updatedScript.content).toBe(newContent);
      expect(updatedScript.versions).toHaveLength(2);
      expect(updatedScript.versions[1].content).toBe(newContent);
    });

    it('should update content and metadata', async () => {
      const newContent = 'Updated content';
      const updatedScript = await scriptRepository.updateContent(
        testScript._id,
        newContent,
        { status: ScriptStatus.REVIEW }
      );

      expect(updatedScript.content).toBe(newContent);
      expect(updatedScript.metadata.status).toBe(ScriptStatus.REVIEW);
    });
  });

  describe('revertToVersion', () => {
    let testScript: any;

    beforeEach(async () => {
      testScript = await scriptRepository.create({
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Test Script',
        content: 'Version 1 content',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: []
        }
      });

      // Create version 2
      await scriptRepository.updateContent(testScript._id, 'Version 2 content');
    });

    it('should revert to previous version', async () => {
      const revertedScript = await scriptRepository.revertToVersion(testScript._id, 1);

      expect(revertedScript.content).toBe('Version 1 content');
      expect(revertedScript.versions).toHaveLength(3);
    });

    it('should throw ValidationError for non-existent version', async () => {
      await expect(scriptRepository.revertToVersion(testScript._id, 99)).rejects.toThrow(ValidationError);
    });
  });

  describe('delete', () => {
    let testScript: any;

    beforeEach(async () => {
      testScript = await scriptRepository.create({
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Script to Delete',
        content: 'Content',
        metadata: {
          contentType: ContentType.INSTAGRAM,
          tags: []
        }
      });
    });

    it('should delete script successfully', async () => {
      await scriptRepository.delete(testScript._id);

      const deletedScript = await scriptRepository.findById(testScript._id);
      expect(deletedScript).toBeNull();
    });

    it('should throw NotFoundError for non-existent script', async () => {
      const nonExistentId = new ObjectId();
      
      await expect(scriptRepository.delete(nonExistentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('move', () => {
    let testScript: any;
    let secondProject: any;

    beforeEach(async () => {
      testScript = await scriptRepository.create({
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Script to Move',
        content: 'Content',
        metadata: {
          contentType: ContentType.TIKTOK,
          tags: []
        }
      });

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
      const movedScript = await scriptRepository.move(
        testScript._id,
        secondProject._id,
        newFolderId
      );

      expect(movedScript.projectId.toString()).toBe(secondProject._id.toString());
      expect(movedScript.folderId).toBe(newFolderId);
    });
  });

  describe('search', () => {
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
        await scriptRepository.create(script);
      }
    });

    it('should search scripts by text', async () => {
      const results = await scriptRepository.search(testUserId, 'JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Tutorial');
    });

    it('should filter search results by content type', async () => {
      const results = await scriptRepository.search(testUserId, 'programming', {
        contentType: ContentType.YOUTUBE
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata.contentType).toBe(ContentType.YOUTUBE);
    });
  });

  describe('getStats', () => {
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
        await scriptRepository.create(script);
      }
    });

    it('should return correct statistics', async () => {
      const stats = await scriptRepository.getStats(testUserId);

      expect(stats.totalScripts).toBe(2);
      expect(stats.scriptsByStatus[ScriptStatus.DRAFT]).toBe(1);
      expect(stats.scriptsByStatus[ScriptStatus.FINAL]).toBe(1);
      expect(stats.scriptsByContentType[ContentType.TIKTOK]).toBe(1);
      expect(stats.scriptsByContentType[ContentType.YOUTUBE]).toBe(1);
      expect(stats.recentActivity).toBeInstanceOf(Date);
    });
  });

  describe('getVersionHistory', () => {
    let testScript: any;

    beforeEach(async () => {
      testScript = await scriptRepository.create({
        userId: testUserId,
        projectId: testProjectId,
        folderId: testFolderId,
        title: 'Versioned Script',
        content: 'Version 1',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: []
        }
      });

      // Create additional versions
      await scriptRepository.updateContent(testScript._id, 'Version 2');
      await scriptRepository.updateContent(testScript._id, 'Version 3');
    });

    it('should return version history', async () => {
      const versions = await scriptRepository.getVersionHistory(testScript._id);

      expect(versions).toHaveLength(3);
      expect(versions[0].version).toBe(3); // Latest first
      expect(versions[2].version).toBe(1); // Oldest last
    });
  });

  describe('getRecent', () => {
    beforeEach(async () => {
      // Create scripts with different timestamps
      for (let i = 0; i < 3; i++) {
        await scriptRepository.create({
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

    it('should return recent scripts', async () => {
      const recentScripts = await scriptRepository.getRecent(testUserId, 2);

      expect(recentScripts).toHaveLength(2);
      // Should be sorted by updatedAt descending
      expect(recentScripts[0].updatedAt.getTime()).toBeGreaterThanOrEqual(
        recentScripts[1].updatedAt.getTime()
      );
    });
  });

  describe('getByStatus', () => {
    beforeEach(async () => {
      const scripts = [
        {
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: 'Draft Script 1',
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
          title: 'Draft Script 2',
          content: 'Content',
          metadata: {
            contentType: ContentType.YOUTUBE,
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
            contentType: ContentType.GENERAL,
            status: ScriptStatus.FINAL,
            tags: []
          }
        }
      ];

      for (const script of scripts) {
        await scriptRepository.create(script);
      }
    });

    it('should return scripts by status', async () => {
      const draftScripts = await scriptRepository.getByStatus(testUserId, ScriptStatus.DRAFT);

      expect(draftScripts).toHaveLength(2);
      expect(draftScripts.every(s => s.metadata.status === ScriptStatus.DRAFT)).toBe(true);
    });
  });

  describe('getByContentType', () => {
    beforeEach(async () => {
      const scripts = [
        {
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: 'TikTok Script 1',
          content: 'Content',
          metadata: {
            contentType: ContentType.TIKTOK,
            tags: []
          }
        },
        {
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: 'TikTok Script 2',
          content: 'Content',
          metadata: {
            contentType: ContentType.TIKTOK,
            tags: []
          }
        },
        {
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: 'YouTube Script',
          content: 'Content',
          metadata: {
            contentType: ContentType.YOUTUBE,
            tags: []
          }
        }
      ];

      for (const script of scripts) {
        await scriptRepository.create(script);
      }
    });

    it('should return scripts by content type', async () => {
      const tiktokScripts = await scriptRepository.getByContentType(testUserId, ContentType.TIKTOK);

      expect(tiktokScripts).toHaveLength(2);
      expect(tiktokScripts.every(s => s.metadata.contentType === ContentType.TIKTOK)).toBe(true);
    });
  });

  describe('bulkUpdateStatus', () => {
    let scriptIds: ObjectId[];

    beforeEach(async () => {
      scriptIds = [];
      
      for (let i = 0; i < 3; i++) {
        const script = await scriptRepository.create({
          userId: testUserId,
          projectId: testProjectId,
          folderId: testFolderId,
          title: `Script ${i + 1}`,
          content: `Content ${i + 1}`,
          metadata: {
            contentType: ContentType.GENERAL,
            status: ScriptStatus.DRAFT,
            tags: []
          }
        });
        scriptIds.push(script._id);
      }
    });

    it('should update status for multiple scripts', async () => {
      const updatedCount = await scriptRepository.bulkUpdateStatus(scriptIds, ScriptStatus.FINAL);

      expect(updatedCount).toBe(3);

      // Verify all scripts have been updated
      for (const id of scriptIds) {
        const script = await scriptRepository.findById(id);
        expect(script!.metadata.status).toBe(ScriptStatus.FINAL);
      }
    });

    it('should handle partial failures gracefully', async () => {
      // Add an invalid ID to the list
      const invalidIds = [...scriptIds, new ObjectId()];
      
      const updatedCount = await scriptRepository.bulkUpdateStatus(invalidIds, ScriptStatus.FINAL);

      // Should update the valid ones and skip the invalid one
      expect(updatedCount).toBe(3);
    });
  });

  describe('countInFolder', () => {
    beforeEach(async () => {
      // Create scripts in the test folder
      for (let i = 0; i < 2; i++) {
        await scriptRepository.create({
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

    it('should count scripts in folder', async () => {
      const count = await scriptRepository.countInFolder(testProjectId, testFolderId);

      expect(count).toBe(2);
    });
  });

  describe('deleteByProject', () => {
    beforeEach(async () => {
      // Create scripts in the test project
      for (let i = 0; i < 2; i++) {
        await scriptRepository.create({
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
      const deletedCount = await scriptRepository.deleteByProject(testProjectId);

      expect(deletedCount).toBe(2);

      const remainingScripts = await scriptRepository.findByProject(testProjectId);
      expect(remainingScripts).toHaveLength(0);
    });
  });

  describe('deleteByFolder', () => {
    let secondFolderId: string;

    beforeEach(async () => {
      // Add a second folder
      const secondFolder = await projectModel.addFolder(testProjectId, 'Second Folder');
      secondFolderId = secondFolder.id;

      // Create scripts in both folders
      await scriptRepository.create({
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

      await scriptRepository.create({
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
      const deletedCount = await scriptRepository.deleteByFolder(testProjectId, secondFolderId);

      expect(deletedCount).toBe(1);

      const remainingScripts = await scriptRepository.findByProject(testProjectId);
      expect(remainingScripts).toHaveLength(1);
      expect(remainingScripts[0].folderId).toBe(testFolderId);
    });
  });
});