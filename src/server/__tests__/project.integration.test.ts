import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { app } from '../app';
import { setDatabase } from '../../lib/database/connection';
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
import { describe } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { it } from 'vitest';
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
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { it } from 'vitest';
import { it } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
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

describe('Project API Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let authToken: string;
  let userId: string;

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

    // Register and login a test user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
    
    authToken = registerResponse.body.token;
    userId = registerResponse.body.user._id;
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'A test project for video content',
        settings: {
          isPublic: false,
          allowCollaboration: true
        }
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project created successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(projectData.title);
      expect(response.body.data.description).toBe(projectData.description);
      expect(response.body.data.settings.isPublic).toBe(false);
      expect(response.body.data.settings.allowCollaboration).toBe(true);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should create project with minimal data', async () => {
      const projectData = {
        title: 'Minimal Project'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.data.title).toBe(projectData.title);
      expect(response.body.data.settings.isPublic).toBe(false);
      expect(response.body.data.settings.allowCollaboration).toBe(false);
    });

    it('should return 400 for invalid project data', async () => {
      const projectData = {
        title: '', // Empty title should fail
        description: 'Test description'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without auth token', async () => {
      const projectData = {
        title: 'Test Project'
      };

      await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create test projects
      const projects = [
        { title: 'Project 1', description: 'First project' },
        { title: 'Project 2', description: 'Second project' },
        { title: 'Project 3', description: 'Third project' }
      ];

      for (const project of projects) {
        await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .send(project);
      }
    });

    it('should get user projects successfully', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.page).toBe(1);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.projects).toHaveLength(2);
      expect(response.body.data.limit).toBe(2);
      expect(response.body.data.page).toBe(1);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/projects?sortBy=title&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const titles = response.body.data.projects.map((p: any) => p.title);
      expect(titles).toEqual(['Project 1', 'Project 2', 'Project 3']);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/projects?search=First')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].description).toBe('First project');
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });
  });

  describe('GET /api/projects/recent', () => {
    beforeEach(async () => {
      // Create test projects with delays to ensure different timestamps
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Old Project' });

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Recent Project' });
    });

    it('should get recent projects successfully', async () => {
      const response = await request(app)
        .get('/api/projects/recent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // Most recent should be first
      expect(response.body.data[0].title).toBe('Recent Project');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/projects/recent?limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Recent Project');
    });
  });

  describe('GET /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Project', description: 'Test description' });
      
      projectId = response.body.data._id;
    });

    it('should get project by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(projectId);
      expect(response.body.data.title).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .get(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for project owned by another user', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'other@example.com',
          username: 'otheruser',
          password: 'password123'
        });

      const otherToken = otherUserResponse.body.token;

      // Try to access the project with the other user's token
      await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should return 400 for invalid project ID format', async () => {
      await request(app)
        .get('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Original Title', description: 'Original description' });
      
      projectId = response.body.data._id;
    });

    it('should update project successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        settings: {
          isPublic: true,
          allowCollaboration: false
        }
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.description).toBe('Updated description');
      expect(response.body.data.settings.isPublic).toBe(true);
    });

    it('should update partial data', async () => {
      const updateData = {
        title: 'Partially Updated Title'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.title).toBe('Partially Updated Title');
      expect(response.body.data.description).toBe('Original description');
    });

    it('should return 403 for project owned by another user', async () => {
      const otherUserResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'other@example.com',
          username: 'otheruser',
          password: 'password123'
        });

      const otherToken = otherUserResponse.body.token;

      await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Project to Delete' });
      
      projectId = response.body.data._id;
    });

    it('should delete project successfully', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');

      // Verify project is deleted
      await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for project owned by another user', async () => {
      const otherUserResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'other@example.com',
          username: 'otheruser',
          password: 'password123'
        });

      const otherToken = otherUserResponse.body.token;

      await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('Folder Management', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Project with Folders' });
      
      projectId = response.body.data._id;
    });

    describe('POST /api/projects/:id/folders', () => {
      it('should create a root folder successfully', async () => {
        const folderData = {
          name: 'Root Folder'
        };

        const response = await request(app)
          .post(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(folderData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Root Folder');
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.parentId).toBeUndefined();
      });

      it('should create a nested folder successfully', async () => {
        // First create a parent folder
        const parentResponse = await request(app)
          .post(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Parent Folder' });

        const parentId = parentResponse.body.data.id;

        // Then create a child folder
        const childData = {
          name: 'Child Folder',
          parentId: parentId
        };

        const response = await request(app)
          .post(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(childData)
          .expect(201);

        expect(response.body.data.name).toBe('Child Folder');
        expect(response.body.data.parentId).toBe(parentId);
      });

      it('should return 400 for empty folder name', async () => {
        await request(app)
          .post(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: '' })
          .expect(400);
      });
    });

    describe('GET /api/projects/:id/folders', () => {
      beforeEach(async () => {
        // Create test folders
        await request(app)
          .post(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Folder 1' });

        await request(app)
          .post(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Folder 2' });
      });

      it('should get project folders successfully', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(3); // Default "Scripts" folder + 2 test folders
        
        // Find the test folders (ignore the default "Scripts" folder)
        const testFolders = response.body.data.filter((f: any) => f.name !== 'Scripts');
        expect(testFolders).toHaveLength(2);
        expect(testFolders[0].name).toBe('Folder 1');
        expect(testFolders[1].name).toBe('Folder 2');
      });
    });

    describe('PUT /api/projects/:id/folders/:folderId', () => {
      let folderId: string;

      beforeEach(async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Original Folder Name' });
        
        folderId = response.body.data.id;
      });

      it('should update folder name successfully', async () => {
        const updateData = {
          name: 'Updated Folder Name'
        };

        const response = await request(app)
          .put(`/api/projects/${projectId}/folders/${folderId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Folder Name');
      });

      it('should return 400 for empty folder name', async () => {
        await request(app)
          .put(`/api/projects/${projectId}/folders/${folderId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: '' })
          .expect(400);
      });
    });

    describe('DELETE /api/projects/:id/folders/:folderId', () => {
      let folderId: string;

      beforeEach(async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Folder to Delete' });
        
        folderId = response.body.data.id;
      });

      it('should delete folder successfully', async () => {
        const response = await request(app)
          .delete(`/api/projects/${projectId}/folders/${folderId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Folder deleted successfully');

        // Verify folder is removed from project (should only have default "Scripts" folder left)
        const projectResponse = await request(app)
          .get(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(projectResponse.body.data).toHaveLength(1);
        expect(projectResponse.body.data[0].name).toBe('Scripts');
      });
    });
  });

  describe('Project Sharing and Collaboration', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Shareable Project' });
      
      projectId = response.body.data._id;
    });

    describe('POST /api/projects/:id/share', () => {
      it('should share project successfully', async () => {
        const shareData = {
          userEmail: 'collaborator@example.com',
          permission: 'read'
        };

        const response = await request(app)
          .post(`/api/projects/${projectId}/share`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(shareData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.userEmail).toBe('collaborator@example.com');
        expect(response.body.data.permission).toBe('read');
        expect(response.body.data.status).toBe('pending');
      });

      it('should return 400 for invalid email', async () => {
        const shareData = {
          userEmail: 'invalid-email',
          permission: 'read'
        };

        await request(app)
          .post(`/api/projects/${projectId}/share`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(shareData)
          .expect(400);
      });
    });

    describe('PUT /api/projects/:id/collaboration', () => {
      it('should update collaboration settings successfully', async () => {
        const settingsData = {
          allowCollaboration: true,
          isPublic: false
        };

        const response = await request(app)
          .put(`/api/projects/${projectId}/collaboration`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(settingsData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.settings.allowCollaboration).toBe(true);
        expect(response.body.data.settings.isPublic).toBe(false);
      });
    });
  });

  describe('GET /api/projects/:id/stats', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Stats Project' });
      
      projectId = response.body.data._id;

      // Create some folders
      await request(app)
        .post(`/api/projects/${projectId}/folders`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Folder 1' });

      await request(app)
        .post(`/api/projects/${projectId}/folders`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Folder 2' });
    });

    it('should get project statistics successfully', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalScripts).toBe(0);
      expect(response.body.data.totalFolders).toBe(3); // Default "Scripts" folder + 2 test folders
      expect(response.body.data.lastActivity).toBeDefined();
    });
  });
});