import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { app } from '../app';
import { setDatabase } from '../../lib/database/connection';
import { ContentType, ScriptStatus } from '../../lib/database/types';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { beforeEach } from 'vitest';
import { afterAll } from 'vitest';
import { beforeAll } from 'vitest';
import { describe } from 'vitest';

describe('Script API Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let authToken: string;
  let userId: string;
  let projectId: string;
  let folderId: string;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test');
    
    // Set the database for the application
    setDatabase(db);
    
    // Set required environment variables
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }

    // Register and login to get auth token
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
    
    authToken = registerResponse.body.token;
    userId = registerResponse.body.user._id;

    // Create a test project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Project',
        description: 'A test project for scripts'
      });
    
    projectId = projectResponse.body.data._id;
    folderId = projectResponse.body.data.folders[0].id; // Default folder
  });

  describe('POST /api/scripts', () => {
    it('should create a new script successfully', async () => {
      const scriptData = {
        projectId,
        folderId,
        title: 'Test Script',
        content: 'This is a test script content',
        metadata: {
          contentType: ContentType.TIKTOK,
          duration: 30,
          tags: ['test', 'demo'],
          status: ScriptStatus.DRAFT
        }
      };

      const response = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scriptData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(scriptData.title);
      expect(response.body.data.content).toBe(scriptData.content);
      expect(response.body.data.metadata.contentType).toBe(scriptData.metadata.contentType);
      expect(response.body.data.versions).toHaveLength(1);
      expect(response.body.data.versions[0].version).toBe(1);
    });

    it('should return 400 for invalid project ID', async () => {
      const scriptData = {
        projectId: 'invalid-id',
        folderId,
        title: 'Test Script',
        content: 'Content',
        metadata: {
          contentType: ContentType.TIKTOK
        }
      };

      const response = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scriptData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing required fields', async () => {
      const scriptData = {
        projectId,
        folderId
        // Missing title and content
      };

      const response = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scriptData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without auth token', async () => {
      const scriptData = {
        projectId,
        folderId,
        title: 'Test Script',
        content: 'Content',
        metadata: {
          contentType: ContentType.TIKTOK
        }
      };

      const response = await request(app)
        .post('/api/scripts')
        .send(scriptData)
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/scripts/:id', () => {
    let scriptId: string;

    beforeEach(async () => {
      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          folderId,
          title: 'Test Script',
          content: 'Test content',
          metadata: {
            contentType: ContentType.YOUTUBE
          }
        });
      
      scriptId = scriptResponse.body.data._id;
    });

    it('should get script by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/scripts/${scriptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(scriptId);
      expect(response.body.data.title).toBe('Test Script');
    });

    it('should return 404 for non-existent script', async () => {
      const nonExistentId = new ObjectId().toString();
      
      const response = await request(app)
        .get(`/api/scripts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid script ID', async () => {
      const response = await request(app)
        .get('/api/scripts/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get(`/api/scripts/${scriptId}`)
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/scripts', () => {
    beforeEach(async () => {
      // Create multiple test scripts
      const scripts = [
        {
          title: 'Script 1',
          content: 'Content 1',
          metadata: { contentType: ContentType.TIKTOK, status: ScriptStatus.DRAFT }
        },
        {
          title: 'Script 2',
          content: 'Content 2',
          metadata: { contentType: ContentType.YOUTUBE, status: ScriptStatus.REVIEW }
        },
        {
          title: 'Script 3',
          content: 'Content 3',
          metadata: { contentType: ContentType.INSTAGRAM, status: ScriptStatus.FINAL }
        }
      ];

      for (const script of scripts) {
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId,
            folderId,
            ...script
          });
      }
    });

    it('should get user scripts successfully', async () => {
      const response = await request(app)
        .get('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter scripts by status', async () => {
      const response = await request(app)
        .get('/api/scripts?status=draft')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].metadata.status).toBe(ScriptStatus.DRAFT);
    });

    it('should filter scripts by content type', async () => {
      const response = await request(app)
        .get('/api/scripts?contentType=youtube')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].metadata.contentType).toBe(ContentType.YOUTUBE);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/scripts?limit=2&skip=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.skip).toBe(1);
    });

    it('should sort scripts', async () => {
      const response = await request(app)
        .get('/api/scripts?sortBy=title&sortOrder=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].title).toBe('Script 1');
      expect(response.body.data[1].title).toBe('Script 2');
    });
  });

  describe('PUT /api/scripts/:id', () => {
    let scriptId: string;

    beforeEach(async () => {
      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          folderId,
          title: 'Original Title',
          content: 'Original content',
          metadata: {
            contentType: ContentType.TIKTOK,
            status: ScriptStatus.DRAFT
          }
        });
      
      scriptId = scriptResponse.body.data._id;
    });

    it('should update script successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        metadata: {
          status: ScriptStatus.REVIEW,
          tags: ['updated', 'test']
        }
      };

      const response = await request(app)
        .put(`/api/scripts/${scriptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.metadata.status).toBe(ScriptStatus.REVIEW);
      expect(response.body.data.metadata.tags).toEqual(['updated', 'test']);
    });

    it('should return 404 for non-existent script', async () => {
      const nonExistentId = new ObjectId().toString();
      
      const response = await request(app)
        .put(`/api/scripts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/scripts/:id/content', () => {
    let scriptId: string;

    beforeEach(async () => {
      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          folderId,
          title: 'Test Script',
          content: 'Original content',
          metadata: {
            contentType: ContentType.TIKTOK
          }
        });
      
      scriptId = scriptResponse.body.data._id;
    });

    it('should update script content and create new version', async () => {
      const newContent = 'Updated content for version 2';
      
      const response = await request(app)
        .put(`/api/scripts/${scriptId}/content`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: newContent,
          metadata: {
            status: ScriptStatus.REVIEW
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(newContent);
      expect(response.body.data.versions).toHaveLength(2);
      expect(response.body.data.versions[1].version).toBe(2);
      expect(response.body.data.versions[1].content).toBe(newContent);
      expect(response.body.data.metadata.status).toBe(ScriptStatus.REVIEW);
    });

    it('should return 400 for empty content', async () => {
      const response = await request(app)
        .put(`/api/scripts/${scriptId}/content`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/scripts/:id/versions', () => {
    let scriptId: string;

    beforeEach(async () => {
      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          folderId,
          title: 'Test Script',
          content: 'Original content',
          metadata: {
            contentType: ContentType.TIKTOK
          }
        });
      
      scriptId = scriptResponse.body.data._id;

      // Create a second version
      await request(app)
        .put(`/api/scripts/${scriptId}/content`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated content' });
    });

    it('should get version history successfully', async () => {
      const response = await request(app)
        .get(`/api/scripts/${scriptId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].version).toBe(2); // Latest first
      expect(response.body.data[1].version).toBe(1);
    });
  });

  describe('POST /api/scripts/:id/revert', () => {
    let scriptId: string;

    beforeEach(async () => {
      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          folderId,
          title: 'Test Script',
          content: 'Original content',
          metadata: {
            contentType: ContentType.TIKTOK
          }
        });
      
      scriptId = scriptResponse.body.data._id;

      // Create a second version
      await request(app)
        .put(`/api/scripts/${scriptId}/content`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated content' });
    });

    it('should revert to previous version successfully', async () => {
      const response = await request(app)
        .post(`/api/scripts/${scriptId}/revert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ version: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Original content');
      expect(response.body.data.versions).toHaveLength(3); // Original + Update + Revert
      expect(response.body.data.versions.find(v => v.version === 3)).toBeDefined();
    });

    it('should return 400 for non-existent version', async () => {
      const response = await request(app)
        .post(`/api/scripts/${scriptId}/revert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ version: 99 })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/scripts/:id', () => {
    let scriptId: string;

    beforeEach(async () => {
      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          folderId,
          title: 'Test Script',
          content: 'Test content',
          metadata: {
            contentType: ContentType.TIKTOK
          }
        });
      
      scriptId = scriptResponse.body.data._id;
    });

    it('should delete script successfully', async () => {
      const response = await request(app)
        .delete(`/api/scripts/${scriptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Script deleted successfully');

      // Verify script is deleted
      await request(app)
        .get(`/api/scripts/${scriptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent script', async () => {
      const nonExistentId = new ObjectId().toString();
      
      const response = await request(app)
        .delete(`/api/scripts/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/scripts/:id/move', () => {
    let scriptId: string;
    let secondProjectId: string;
    let secondFolderId: string;

    beforeEach(async () => {
      // Create script in first project
      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          folderId,
          title: 'Test Script',
          content: 'Test content',
          metadata: {
            contentType: ContentType.TIKTOK
          }
        });
      
      scriptId = scriptResponse.body.data._id;

      // Create second project
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Second Project',
          description: 'Another test project'
        });
      
      secondProjectId = projectResponse.body.data._id;
      secondFolderId = projectResponse.body.data.folders[0].id;
    });

    it('should move script to different project/folder successfully', async () => {
      const response = await request(app)
        .post(`/api/scripts/${scriptId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: secondProjectId,
          folderId: secondFolderId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projectId).toBe(secondProjectId);
      expect(response.body.data.folderId).toBe(secondFolderId);
    });
  });

  describe('GET /api/scripts/search', () => {
    beforeEach(async () => {
      // Create scripts with searchable content
      const scripts = [
        {
          title: 'JavaScript Tutorial',
          content: 'Learn JavaScript programming basics',
          metadata: { contentType: ContentType.YOUTUBE }
        },
        {
          title: 'Python Guide',
          content: 'Python programming for beginners',
          metadata: { contentType: ContentType.TIKTOK }
        },
        {
          title: 'Web Development',
          content: 'HTML, CSS, and JavaScript fundamentals',
          metadata: { contentType: ContentType.INSTAGRAM }
        }
      ];

      for (const script of scripts) {
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId,
            folderId,
            ...script
          });
      }
    });

    it('should search scripts by title and content', async () => {
      const response = await request(app)
        .get('/api/scripts/search?q=JavaScript')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.query).toBe('JavaScript');
    });

    it('should return 400 for missing search query', async () => {
      const response = await request(app)
        .get('/api/scripts/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/scripts/bulk/status', () => {
    let scriptIds: string[];

    beforeEach(async () => {
      scriptIds = [];
      
      // Create multiple scripts
      for (let i = 0; i < 3; i++) {
        const scriptResponse = await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId,
            folderId,
            title: `Script ${i + 1}`,
            content: `Content ${i + 1}`,
            metadata: {
              contentType: ContentType.TIKTOK,
              status: ScriptStatus.DRAFT
            }
          });
        
        scriptIds.push(scriptResponse.body.data._id);
      }
    });

    it('should bulk update script status successfully', async () => {
      const response = await request(app)
        .post('/api/scripts/bulk/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scriptIds,
          status: ScriptStatus.REVIEW
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(3);
      expect(response.body.data.totalRequested).toBe(3);

      // Verify scripts were updated
      for (const scriptId of scriptIds) {
        const scriptResponse = await request(app)
          .get(`/api/scripts/${scriptId}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(scriptResponse.body.data.metadata.status).toBe(ScriptStatus.REVIEW);
      }
    });

    it('should return 400 for empty script IDs array', async () => {
      const response = await request(app)
        .post('/api/scripts/bulk/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scriptIds: [],
          status: ScriptStatus.REVIEW
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/scripts/stats', () => {
    beforeEach(async () => {
      // Create scripts with different statuses and content types
      const scripts = [
        { status: ScriptStatus.DRAFT, contentType: ContentType.TIKTOK },
        { status: ScriptStatus.DRAFT, contentType: ContentType.YOUTUBE },
        { status: ScriptStatus.REVIEW, contentType: ContentType.TIKTOK },
        { status: ScriptStatus.FINAL, contentType: ContentType.INSTAGRAM }
      ];

      for (const script of scripts) {
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId,
            folderId,
            title: 'Test Script',
            content: 'Test content',
            metadata: script
          });
      }
    });

    it('should get script statistics successfully', async () => {
      const response = await request(app)
        .get('/api/scripts/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalScripts).toBe(4);
      expect(response.body.data.scriptsByStatus.draft).toBe(2);
      expect(response.body.data.scriptsByStatus.review).toBe(1);
      expect(response.body.data.scriptsByStatus.final).toBe(1);
      expect(response.body.data.scriptsByContentType.tiktok).toBe(2);
      expect(response.body.data.scriptsByContentType.youtube).toBe(1);
      expect(response.body.data.scriptsByContentType.instagram).toBe(1);
    });
  });

  describe('GET /api/scripts/recent', () => {
    beforeEach(async () => {
      // Create multiple scripts with different timestamps
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId,
            folderId,
            title: `Script ${i + 1}`,
            content: `Content ${i + 1}`,
            metadata: {
              contentType: ContentType.TIKTOK
            }
          });
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    it('should get recent scripts successfully', async () => {
      const response = await request(app)
        .get('/api/scripts/recent?limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      // Should be sorted by most recent first
      expect(response.body.data[0].title).toBe('Script 5');
    });
  });

  describe('GET /api/scripts/project/:projectId', () => {
    beforeEach(async () => {
      // Create scripts in the project
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId,
            folderId,
            title: `Project Script ${i + 1}`,
            content: `Content ${i + 1}`,
            metadata: {
              contentType: ContentType.TIKTOK
            }
          });
      }
    });

    it('should get project scripts successfully', async () => {
      const response = await request(app)
        .get(`/api/scripts/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].projectId).toBe(projectId);
    });

    it('should return 400 for invalid project ID', async () => {
      const response = await request(app)
        .get('/api/scripts/project/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/scripts/project/:projectId/folder/:folderId', () => {
    beforeEach(async () => {
      // Create scripts in the specific folder
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId,
            folderId,
            title: `Folder Script ${i + 1}`,
            content: `Content ${i + 1}`,
            metadata: {
              contentType: ContentType.TIKTOK
            }
          });
      }
    });

    it('should get folder scripts successfully', async () => {
      const response = await request(app)
        .get(`/api/scripts/project/${projectId}/folder/${folderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].folderId).toBe(folderId);
    });
  });
});