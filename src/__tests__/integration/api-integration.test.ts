import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/app';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase, TestDatabase } from '../utils/test-setup';

describe('API Integration Tests with Real Database', () => {
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

  describe('User API Integration', () => {
    describe('User Registration and Authentication Flow', () => {
      it('should handle complete registration and login flow', async () => {
        const userData = {
          email: 'integration@example.com',
          username: 'integrationuser',
          password: 'password123',
          profile: {
            firstName: 'Integration',
            lastName: 'Test',
            bio: 'Testing integration'
          }
        };

        // Test registration
        const registerResponse = await request(app)
          .post('/api/users/register')
          .send(userData)
          .expect(201);

        expect(registerResponse.body.user.email).toBe(userData.email);
        expect(registerResponse.body.token).toBeDefined();

        // Test login with email
        const loginEmailResponse = await request(app)
          .post('/api/users/login')
          .send({
            identifier: userData.email,
            password: userData.password
          })
          .expect(200);

        expect(loginEmailResponse.body.token).toBeDefined();

        // Test login with username
        const loginUsernameResponse = await request(app)
          .post('/api/users/login')
          .send({
            identifier: userData.username,
            password: userData.password
          })
          .expect(200);

        expect(loginUsernameResponse.body.token).toBeDefined();

        // Test profile access with token
        const profileResponse = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${loginEmailResponse.body.token}`)
          .expect(200);

        expect(profileResponse.body.user.email).toBe(userData.email);
        expect(profileResponse.body.user.profile.firstName).toBe(userData.profile.firstName);
      });

      it('should handle user profile updates correctly', async () => {
        // Register user
        const registerResponse = await request(app)
          .post('/api/users/register')
          .send({
            email: 'update@example.com',
            username: 'updateuser',
            password: 'password123'
          });

        const token = registerResponse.body.token;

        // Update profile
        const updateData = {
          profile: {
            firstName: 'Updated',
            lastName: 'User',
            bio: 'Updated bio',
            avatar: 'https://example.com/avatar.jpg'
          },
          preferences: {
            theme: 'dark',
            defaultProjectView: 'list'
          }
        };

        const updateResponse = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .send(updateData)
          .expect(200);

        expect(updateResponse.body.user.profile.firstName).toBe('Updated');
        expect(updateResponse.body.user.preferences.theme).toBe('dark');

        // Verify persistence
        const profileResponse = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(profileResponse.body.user.profile.firstName).toBe('Updated');
        expect(profileResponse.body.user.preferences.theme).toBe('dark');
      });

      it('should handle password changes correctly', async () => {
        const userData = {
          email: 'password@example.com',
          username: 'passworduser',
          password: 'oldpassword123'
        };

        // Register user
        const registerResponse = await request(app)
          .post('/api/users/register')
          .send(userData);

        const token = registerResponse.body.token;

        // Change password
        await request(app)
          .put('/api/users/password')
          .set('Authorization', `Bearer ${token}`)
          .send({
            currentPassword: 'oldpassword123',
            newPassword: 'newpassword123'
          })
          .expect(200);

        // Test old password no longer works
        await request(app)
          .post('/api/users/login')
          .send({
            identifier: userData.email,
            password: 'oldpassword123'
          })
          .expect(401);

        // Test new password works
        await request(app)
          .post('/api/users/login')
          .send({
            identifier: userData.email,
            password: 'newpassword123'
          })
          .expect(200);
      });
    });

    describe('User Validation and Error Handling', () => {
      it('should validate user input correctly', async () => {
        // Test invalid email
        await request(app)
          .post('/api/users/register')
          .send({
            email: 'invalid-email',
            username: 'testuser',
            password: 'password123'
          })
          .expect(400);

        // Test short username
        await request(app)
          .post('/api/users/register')
          .send({
            email: 'test@example.com',
            username: 'ab',
            password: 'password123'
          })
          .expect(400);

        // Test weak password
        await request(app)
          .post('/api/users/register')
          .send({
            email: 'test@example.com',
            username: 'testuser',
            password: '123'
          })
          .expect(400);
      });

      it('should handle duplicate user registration', async () => {
        const userData = {
          email: 'duplicate@example.com',
          username: 'duplicateuser',
          password: 'password123'
        };

        // Register first user
        await request(app)
          .post('/api/users/register')
          .send(userData)
          .expect(201);

        // Try to register with same email
        await request(app)
          .post('/api/users/register')
          .send({
            ...userData,
            username: 'differentuser'
          })
          .expect(409);

        // Try to register with same username
        await request(app)
          .post('/api/users/register')
          .send({
            ...userData,
            email: 'different@example.com'
          })
          .expect(409);
      });
    });
  });

  describe('Project API Integration', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const userResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'project@example.com',
          username: 'projectuser',
          password: 'password123'
        });

      authToken = userResponse.body.token;
      userId = userResponse.body.user._id;
    });

    describe('Project CRUD Operations', () => {
      it('should handle complete project lifecycle', async () => {
        const projectData = {
          title: 'Integration Test Project',
          description: 'A project for integration testing',
          folders: [
            {
              id: 'main-folder',
              name: 'Main Folder',
              scriptCount: 0,
              createdAt: new Date().toISOString()
            },
            {
              id: 'sub-folder',
              name: 'Sub Folder',
              parentId: 'main-folder',
              scriptCount: 0,
              createdAt: new Date().toISOString()
            }
          ],
          settings: {
            isPublic: false,
            allowCollaboration: true
          }
        };

        // Create project
        const createResponse = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .send(projectData)
          .expect(201);

        const projectId = createResponse.body.project._id;
        expect(createResponse.body.project.title).toBe(projectData.title);
        expect(createResponse.body.project.folders).toHaveLength(2);

        // Get project
        const getResponse = await request(app)
          .get(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(getResponse.body.project.title).toBe(projectData.title);

        // Update project
        const updateData = {
          title: 'Updated Project Title',
          description: 'Updated description',
          settings: {
            isPublic: true,
            allowCollaboration: false
          }
        };

        const updateResponse = await request(app)
          .put(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(updateResponse.body.project.title).toBe(updateData.title);
        expect(updateResponse.body.project.settings.isPublic).toBe(true);

        // List user projects
        const listResponse = await request(app)
          .get('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(listResponse.body.projects).toHaveLength(1);
        expect(listResponse.body.projects[0].title).toBe(updateData.title);

        // Delete project
        await request(app)
          .delete(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify deletion
        const finalListResponse = await request(app)
          .get('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(finalListResponse.body.projects).toHaveLength(0);
      });

      it('should handle folder management within projects', async () => {
        // Create project
        const projectResponse = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Folder Test Project',
            folders: [{
              id: 'root-folder',
              name: 'Root Folder',
              scriptCount: 0,
              createdAt: new Date().toISOString()
            }]
          });

        const projectId = projectResponse.body.project._id;

        // Add folder
        const newFolder = {
          id: 'new-folder',
          name: 'New Folder',
          parentId: 'root-folder',
          scriptCount: 0,
          createdAt: new Date().toISOString()
        };

        await request(app)
          .post(`/api/projects/${projectId}/folders`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(newFolder)
          .expect(200);

        // Update folder
        const updatedFolder = {
          ...newFolder,
          name: 'Updated Folder Name'
        };

        await request(app)
          .put(`/api/projects/${projectId}/folders/${newFolder.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updatedFolder)
          .expect(200);

        // Verify folder updates
        const projectResponse2 = await request(app)
          .get(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const updatedFolderInProject = projectResponse2.body.project.folders.find(
          (f: any) => f.id === newFolder.id
        );
        expect(updatedFolderInProject.name).toBe('Updated Folder Name');

        // Delete folder
        await request(app)
          .delete(`/api/projects/${projectId}/folders/${newFolder.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify folder deletion
        const projectResponse3 = await request(app)
          .get(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(projectResponse3.body.project.folders).toHaveLength(1); // Only root folder remains
      });
    });

    describe('Project Statistics and Analytics', () => {
      it('should provide accurate project statistics', async () => {
        // Create project with folders
        const projectResponse = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Stats Test Project',
            folders: [
              {
                id: 'folder-1',
                name: 'Folder 1',
                scriptCount: 0,
                createdAt: new Date().toISOString()
              },
              {
                id: 'folder-2',
                name: 'Folder 2',
                scriptCount: 0,
                createdAt: new Date().toISOString()
              }
            ]
          });

        const projectId = projectResponse.body.project._id;

        // Create scripts in different folders
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Script 1',
            content: 'Content 1',
            projectId,
            folderId: 'folder-1',
            metadata: {
              contentType: 'tiktok',
              duration: 30,
              tags: ['test'],
              status: 'draft'
            }
          });

        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Script 2',
            content: 'Content 2',
            projectId,
            folderId: 'folder-2',
            metadata: {
              contentType: 'youtube',
              duration: 60,
              tags: ['test'],
              status: 'final'
            }
          });

        // Get project statistics
        const statsResponse = await request(app)
          .get(`/api/projects/${projectId}/stats`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(statsResponse.body.stats.totalScripts).toBe(2);
        expect(statsResponse.body.stats.folderCount).toBe(2);
        expect(statsResponse.body.stats.contentTypeDistribution).toBeDefined();
        expect(statsResponse.body.stats.statusDistribution).toBeDefined();
      });
    });
  });

  describe('Script API Integration', () => {
    let authToken: string;
    let projectId: string;

    beforeEach(async () => {
      const userResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'script@example.com',
          username: 'scriptuser',
          password: 'password123'
        });

      authToken = userResponse.body.token;

      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Script Test Project',
          folders: [{
            id: 'script-folder',
            name: 'Script Folder',
            scriptCount: 0,
            createdAt: new Date().toISOString()
          }]
        });

      projectId = projectResponse.body.project._id;
    });

    describe('Script CRUD Operations', () => {
      it('should handle complete script lifecycle with versioning', async () => {
        const scriptData = {
          title: 'Integration Test Script',
          content: 'Original script content for integration testing',
          projectId,
          folderId: 'script-folder',
          metadata: {
            contentType: 'tiktok',
            duration: 30,
            tags: ['integration', 'test', 'tiktok'],
            status: 'draft'
          }
        };

        // Create script
        const createResponse = await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(scriptData)
          .expect(201);

        const scriptId = createResponse.body.script._id;
        expect(createResponse.body.script.title).toBe(scriptData.title);
        expect(createResponse.body.script.versions).toHaveLength(1);

        // Get script
        const getResponse = await request(app)
          .get(`/api/scripts/${scriptId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(getResponse.body.script.title).toBe(scriptData.title);

        // Update script (creates new version)
        const updateData = {
          title: 'Updated Script Title',
          content: 'Updated script content with more details and better flow',
          metadata: {
            contentType: 'tiktok',
            duration: 45,
            tags: ['updated', 'integration', 'test'],
            status: 'review'
          }
        };

        const updateResponse = await request(app)
          .put(`/api/scripts/${scriptId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(updateResponse.body.script.title).toBe(updateData.title);
        expect(updateResponse.body.script.versions).toHaveLength(2);

        // Get script history
        const historyResponse = await request(app)
          .get(`/api/scripts/${scriptId}/history`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(historyResponse.body.versions).toHaveLength(2);
        expect(historyResponse.body.versions[0].content).toBe(scriptData.content);
        expect(historyResponse.body.versions[1].content).toBe(updateData.content);

        // List user scripts
        const listResponse = await request(app)
          .get('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(listResponse.body.scripts).toHaveLength(1);
        expect(listResponse.body.scripts[0].title).toBe(updateData.title);

        // Delete script
        await request(app)
          .delete(`/api/scripts/${scriptId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify deletion
        const finalListResponse = await request(app)
          .get('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(finalListResponse.body.scripts).toHaveLength(0);
      });

      it('should handle script search and filtering', async () => {
        // Create multiple scripts with different properties
        const scripts = [
          {
            title: 'TikTok Dance Video',
            content: 'Dance tutorial for TikTok trending dance',
            projectId,
            folderId: 'script-folder',
            metadata: {
              contentType: 'tiktok',
              duration: 30,
              tags: ['dance', 'tutorial', 'trending'],
              status: 'final'
            }
          },
          {
            title: 'YouTube Cooking Tutorial',
            content: 'How to make the perfect pasta recipe',
            projectId,
            folderId: 'script-folder',
            metadata: {
              contentType: 'youtube',
              duration: 600,
              tags: ['cooking', 'tutorial', 'recipe'],
              status: 'draft'
            }
          },
          {
            title: 'Instagram Fashion Reel',
            content: 'Outfit of the day fashion inspiration',
            projectId,
            folderId: 'script-folder',
            metadata: {
              contentType: 'instagram',
              duration: 30,
              tags: ['fashion', 'ootd', 'style'],
              status: 'review'
            }
          }
        ];

        // Create all scripts
        for (const script of scripts) {
          await request(app)
            .post('/api/scripts')
            .set('Authorization', `Bearer ${authToken}`)
            .send(script)
            .expect(201);
        }

        // Test text search
        const searchResponse = await request(app)
          .get('/api/scripts/search')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ q: 'tutorial' })
          .expect(200);

        expect(searchResponse.body.scripts).toHaveLength(2);

        // Test content type filter
        const tiktokResponse = await request(app)
          .get('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ contentType: 'tiktok' })
          .expect(200);

        expect(tiktokResponse.body.scripts).toHaveLength(1);
        expect(tiktokResponse.body.scripts[0].metadata.contentType).toBe('tiktok');

        // Test status filter
        const draftResponse = await request(app)
          .get('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ status: 'draft' })
          .expect(200);

        expect(draftResponse.body.scripts).toHaveLength(1);
        expect(draftResponse.body.scripts[0].metadata.status).toBe('draft');

        // Test project filter
        const projectResponse = await request(app)
          .get('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ projectId })
          .expect(200);

        expect(projectResponse.body.scripts).toHaveLength(3);

        // Test combined filters
        const combinedResponse = await request(app)
          .get('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ 
            contentType: 'tiktok',
            status: 'final',
            projectId 
          })
          .expect(200);

        expect(combinedResponse.body.scripts).toHaveLength(1);
      });
    });

    describe('Script Validation and Error Handling', () => {
      it('should validate script input correctly', async () => {
        // Test empty title
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: '',
            content: 'Valid content',
            projectId,
            folderId: 'script-folder',
            metadata: {
              contentType: 'tiktok',
              duration: 30,
              tags: ['test'],
              status: 'draft'
            }
          })
          .expect(400);

        // Test invalid project ID
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Valid Title',
            content: 'Valid content',
            projectId: 'invalid-id',
            folderId: 'script-folder',
            metadata: {
              contentType: 'tiktok',
              duration: 30,
              tags: ['test'],
              status: 'draft'
            }
          })
          .expect(400);

        // Test invalid content type
        await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Valid Title',
            content: 'Valid content',
            projectId,
            folderId: 'script-folder',
            metadata: {
              contentType: 'invalid-type',
              duration: 30,
              tags: ['test'],
              status: 'draft'
            }
          })
          .expect(400);
      });

      it('should handle authorization correctly', async () => {
        // Create script with valid user
        const scriptResponse = await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Auth Test Script',
            content: 'Content for auth testing',
            projectId,
            folderId: 'script-folder',
            metadata: {
              contentType: 'tiktok',
              duration: 30,
              tags: ['auth', 'test'],
              status: 'draft'
            }
          })
          .expect(201);

        const scriptId = scriptResponse.body.script._id;

        // Create another user
        const otherUserResponse = await request(app)
          .post('/api/users/register')
          .send({
            email: 'other@example.com',
            username: 'otheruser',
            password: 'password123'
          });

        const otherToken = otherUserResponse.body.token;

        // Other user should not be able to access the script
        await request(app)
          .get(`/api/scripts/${scriptId}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(404); // Should return 404 to prevent information disclosure

        // Other user should not be able to update the script
        await request(app)
          .put(`/api/scripts/${scriptId}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .send({
            title: 'Unauthorized Update',
            content: 'This should not work'
          })
          .expect(404);

        // Other user should not be able to delete the script
        await request(app)
          .delete(`/api/scripts/${scriptId}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(404);
      });
    });
  });

  describe('Cross-Entity Integration', () => {
    it('should maintain data consistency across user, project, and script operations', async () => {
      // Register user
      const userResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'consistency@example.com',
          username: 'consistencyuser',
          password: 'password123'
        });

      const authToken = userResponse.body.token;
      const userId = userResponse.body.user._id;

      // Create project
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Consistency Test Project',
          folders: [{
            id: 'consistency-folder',
            name: 'Consistency Folder',
            scriptCount: 0,
            createdAt: new Date().toISOString()
          }]
        });

      const projectId = projectResponse.body.project._id;

      // Create script
      const scriptResponse = await request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Consistency Test Script',
          content: 'Testing data consistency',
          projectId,
          folderId: 'consistency-folder',
          metadata: {
            contentType: 'tiktok',
            duration: 30,
            tags: ['consistency'],
            status: 'draft'
          }
        });

      const scriptId = scriptResponse.body.script._id;

      // Verify relationships in database
      const userDoc = await testDb.models.user.findById(userId);
      const projectDoc = await testDb.models.project.findById(projectId);
      const scriptDoc = await testDb.models.script.findById(scriptId);

      expect(userDoc).toBeTruthy();
      expect(projectDoc).toBeTruthy();
      expect(scriptDoc).toBeTruthy();

      expect(projectDoc?.userId.toString()).toBe(userId);
      expect(scriptDoc?.userId.toString()).toBe(userId);
      expect(scriptDoc?.projectId.toString()).toBe(projectId);

      // Delete project should cascade to scripts
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify script is also deleted
      const remainingScript = await testDb.models.script.findById(scriptId);
      expect(remainingScript).toBeNull();

      // User should still exist
      const remainingUser = await testDb.models.user.findById(userId);
      expect(remainingUser).toBeTruthy();
    });
  });
});