import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/app';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase, TestDatabase } from '../utils/test-setup';

describe('End-to-End User Workflows', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
  });

  beforeEach(async () => {
    await clearTestDatabase(testDb.db);
  });

  describe('Complete User Registration and Project Management Workflow', () => {
    it('should complete full user journey from registration to script management', async () => {
      // Step 1: User Registration
      const registrationData = {
        email: 'workflow@example.com',
        username: 'workflowuser',
        password: 'password123',
        profile: {
          firstName: 'Workflow',
          lastName: 'User',
          bio: 'Testing complete workflow'
        }
      };

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(registrationData)
        .expect(201);

      expect(registerResponse.body.user.email).toBe(registrationData.email);
      expect(registerResponse.body.token).toBeDefined();
      
      const authToken = registerResponse.body.token;
      const userId = registerResponse.body.user._id;

      // Step 2: User Profile Management
      const profileUpdate = {
        profile: {
          firstName: 'Updated',
          lastName: 'Workflow',
          bio: 'Updated bio for workflow testing'
        },
        preferences: {
          theme: 'dark',
          defaultProjectView: 'list'
        }
      };

      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileUpdate)
        .expect(200);

      // Step 3: Project Creation
      const projectData = {
        title: 'My First Project',
        description: 'A project for testing workflows',
        folders: [
          {
            id: 'main-folder',
            name: 'Main Scripts',
            scriptCount: 0,
            createdAt: new Date().toISOString()
          },
          {
            id: 'drafts-folder',
            name: 'Drafts',
            parentId: 'main-folder',
            scriptCount: 0,
            createdAt: new Date().toISOString()
          }
        ]
      };

      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(projectResponse.body.project.title).toBe(projectData.title);
      expect(projectResponse.body.project.folders).toHaveLength(2);
      
      const projectId = projectResponse.body.project._id;

      // Step 4: Folder Management
      const newFolder = {
        id: 'new-folder',
        name: 'New Folder',
        parentId: 'main-folder',
        scriptCount: 0,
        createdAt: new Date().toISOString()
      };

      await request(app)
        .post(`/api/projects/${projectId}/folders`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newFolder)
        .expect(200);

      // Step 5: Script Creation and Management
      const scriptData = {
        title: 'My First Script',
        content: 'This is a test script for TikTok. It should be engaging and fun!',
        folderId: 'main-folder',
        metadata: {
          contentType: 'tiktok',
          duration: 30,
          tags: ['test', 'workflow', 'tiktok'],
          status: 'draft'
        }
      };

      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...scriptData, projectId })
        .expect(201);

      expect(scriptResponse.body.script.title).toBe(scriptData.title);
      expect(scriptResponse.body.script.metadata.contentType).toBe('tiktok');
      
      const scriptId = scriptResponse.body.script._id;

      // Step 6: Script Updates and Versioning
      const scriptUpdate = {
        title: 'Updated Script Title',
        content: 'This is updated content for the script with more details and better flow.',
        metadata: {
          contentType: 'tiktok',
          duration: 45,
          tags: ['updated', 'workflow', 'tiktok'],
          status: 'review'
        }
      };

      await request(app)
        .put(`/api/scripts/${scriptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scriptUpdate)
        .expect(200);

      // Step 7: Search and Discovery
      const searchResponse = await request(app)
        .get('/api/scripts/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'updated', projectId })
        .expect(200);

      expect(searchResponse.body.scripts).toHaveLength(1);
      expect(searchResponse.body.scripts[0].title).toBe(scriptUpdate.title);

      // Step 8: Project Statistics and Analytics
      const statsResponse = await request(app)
        .get(`/api/projects/${projectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body.stats.totalScripts).toBe(1);
      expect(statsResponse.body.stats.folderCount).toBe(3); // main-folder, drafts-folder, new-folder

      // Step 9: User's Projects Overview
      const projectsResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(projectsResponse.body.projects).toHaveLength(1);
      expect(projectsResponse.body.projects[0].title).toBe(projectData.title);

      // Step 10: Script History and Versions
      const historyResponse = await request(app)
        .get(`/api/scripts/${scriptId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(historyResponse.body.versions).toHaveLength(2); // Original + update

      // Step 11: Cleanup - Delete Script
      await request(app)
        .delete(`/api/scripts/${scriptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 12: Cleanup - Delete Project
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify cleanup
      const finalProjectsResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalProjectsResponse.body.projects).toHaveLength(0);
    });
  });

  describe('Collaboration Workflow', () => {
    it('should handle project sharing and collaboration', async () => {
      // Create two users
      const user1Data = {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      };

      const user2Data = {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      };

      const user1Response = await request(app)
        .post('/api/users/register')
        .send(user1Data)
        .expect(201);

      const user2Response = await request(app)
        .post('/api/users/register')
        .send(user2Data)
        .expect(201);

      const user1Token = user1Response.body.token;
      const user2Token = user2Response.body.token;

      // User 1 creates a project
      const projectData = {
        title: 'Shared Project',
        description: 'A project for collaboration testing',
        settings: {
          isPublic: true,
          allowCollaboration: true
        },
        folders: [{
          id: 'shared-folder',
          name: 'Shared Scripts',
          scriptCount: 0,
          createdAt: new Date().toISOString()
        }]
      };

      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project._id;

      // User 1 creates a script
      const scriptData = {
        title: 'Collaborative Script',
        content: 'This script will be edited by multiple users',
        projectId,
        folderId: 'shared-folder',
        metadata: {
          contentType: 'youtube',
          duration: 60,
          tags: ['collaboration', 'test'],
          status: 'draft'
        }
      };

      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(scriptData)
        .expect(201);

      const scriptId = scriptResponse.body.script._id;

      // User 2 should be able to view public project
      const publicProjectResponse = await request(app)
        .get(`/api/projects/${projectId}/public`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(publicProjectResponse.body.project.title).toBe(projectData.title);

      // User 2 should be able to view scripts in public project
      const publicScriptsResponse = await request(app)
        .get('/api/scripts')
        .set('Authorization', `Bearer ${user2Token}`)
        .query({ projectId, public: true })
        .expect(200);

      expect(publicScriptsResponse.body.scripts).toHaveLength(1);
      expect(publicScriptsResponse.body.scripts[0].title).toBe(scriptData.title);
    });
  });

  describe('Content Creation Workflow by Type', () => {
    let authToken: string;
    let projectId: string;

    beforeEach(async () => {
      // Setup user and project for each test
      const userResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'content@example.com',
          username: 'contentcreator',
          password: 'password123'
        });

      authToken = userResponse.body.token;

      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Content Creation Project',
          folders: [{
            id: 'content-folder',
            name: 'Content',
            scriptCount: 0,
            createdAt: new Date().toISOString()
          }]
        });

      projectId = projectResponse.body.project._id;
    });

    it('should handle TikTok content creation workflow', async () => {
      const tiktokScript = {
        title: 'Viral TikTok Hook',
        content: 'POV: You just discovered the secret to viral content...',
        projectId,
        folderId: 'content-folder',
        metadata: {
          contentType: 'tiktok',
          duration: 15,
          tags: ['viral', 'hook', 'pov'],
          status: 'draft'
        }
      };

      const response = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tiktokScript)
        .expect(201);

      expect(response.body.script.metadata.contentType).toBe('tiktok');
      expect(response.body.script.metadata.duration).toBe(15);
    });

    it('should handle YouTube content creation workflow', async () => {
      const youtubeScript = {
        title: 'YouTube Tutorial Script',
        content: 'Welcome back to my channel! Today we\'re going to learn about...',
        projectId,
        folderId: 'content-folder',
        metadata: {
          contentType: 'youtube',
          duration: 600,
          tags: ['tutorial', 'educational', 'howto'],
          status: 'review'
        }
      };

      const response = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(youtubeScript)
        .expect(201);

      expect(response.body.script.metadata.contentType).toBe('youtube');
      expect(response.body.script.metadata.duration).toBe(600);
    });

    it('should handle Instagram content creation workflow', async () => {
      const instagramScript = {
        title: 'Instagram Reel Script',
        content: 'Quick tip for your morning routine that will change your life!',
        projectId,
        folderId: 'content-folder',
        metadata: {
          contentType: 'instagram',
          duration: 30,
          tags: ['lifestyle', 'tips', 'morning'],
          status: 'final'
        }
      };

      const response = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(instagramScript)
        .expect(201);

      expect(response.body.script.metadata.contentType).toBe('instagram');
      expect(response.body.script.metadata.status).toBe('final');
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle authentication errors gracefully', async () => {
      // Try to access protected endpoint without token
      await request(app)
        .get('/api/projects')
        .expect(401);

      // Try with invalid token
      await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle validation errors in complete workflow', async () => {
      // Register user with invalid data
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'invalid-email',
          username: 'ab', // too short
          password: '123' // too short
        })
        .expect(400);

      // Register valid user
      const userResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'valid@example.com',
          username: 'validuser',
          password: 'password123'
        })
        .expect(201);

      const authToken = userResponse.body.token;

      // Try to create project with invalid data
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // empty title
          folders: 'invalid' // should be array
        })
        .expect(400);

      // Create valid project
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Project',
          folders: [{
            id: 'folder-1',
            name: 'Folder 1',
            scriptCount: 0,
            createdAt: new Date().toISOString()
          }]
        })
        .expect(201);

      const projectId = projectResponse.body.project._id;

      // Try to create script with invalid data
      await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // empty title
          content: '', // empty content
          projectId: 'invalid-id', // invalid ObjectId
          folderId: 'non-existent-folder'
        })
        .expect(400);
    });
  });
});