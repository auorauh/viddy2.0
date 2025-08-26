import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase, TestDatabase, measurePerformance, createBulkTestData } from '../utils/test-setup';
import { ObjectId } from 'mongodb';

describe('Database Performance Tests', () => {
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

  describe('User Operations Performance', () => {
    it('should handle bulk user creation efficiently', async () => {
      const userCount = 100;
      const users = [];

      const { duration } = await measurePerformance(async () => {
        for (let i = 0; i < userCount; i++) {
          const user = await testDb.models.user.createUser({
            email: `user${i}@example.com`,
            username: `user${i}`,
            password: 'password123',
            profile: {
              firstName: `User${i}`,
              lastName: 'Test'
            }
          });
          users.push(user);
        }
      }, `Creating ${userCount} users`);

      expect(users).toHaveLength(userCount);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent user authentication efficiently', async () => {
      // Create test users
      const userCount = 50;
      const users = [];

      for (let i = 0; i < userCount; i++) {
        const user = await testDb.models.user.createUser({
          email: `auth${i}@example.com`,
          username: `auth${i}`,
          password: 'password123'
        });
        users.push(user);
      }

      // Test concurrent authentication
      const { duration } = await measurePerformance(async () => {
        const authPromises = users.map(user => 
          testDb.models.user.authenticate(user.email, 'password123')
        );
        const results = await Promise.all(authPromises);
        return results;
      }, `Authenticating ${userCount} users concurrently`);

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle user lookup operations efficiently', async () => {
      // Create test users
      const userCount = 100;
      const users = [];

      for (let i = 0; i < userCount; i++) {
        const user = await testDb.models.user.createUser({
          email: `lookup${i}@example.com`,
          username: `lookup${i}`,
          password: 'password123'
        });
        users.push(user);
      }

      // Test email lookups
      const { duration: emailDuration } = await measurePerformance(async () => {
        const lookupPromises = users.map(user => 
          testDb.models.user.findByEmail(user.email)
        );
        return await Promise.all(lookupPromises);
      }, `Looking up ${userCount} users by email`);

      // Test username lookups
      const { duration: usernameDuration } = await measurePerformance(async () => {
        const lookupPromises = users.map(user => 
          testDb.models.user.findByUsername(user.username)
        );
        return await Promise.all(lookupPromises);
      }, `Looking up ${userCount} users by username`);

      // Test ID lookups
      const { duration: idDuration } = await measurePerformance(async () => {
        const lookupPromises = users.map(user => 
          testDb.models.user.findById(user._id)
        );
        return await Promise.all(lookupPromises);
      }, `Looking up ${userCount} users by ID`);

      expect(emailDuration).toBeLessThan(3000);
      expect(usernameDuration).toBeLessThan(3000);
      expect(idDuration).toBeLessThan(2000); // ID lookups should be fastest
    });
  });

  describe('Project Operations Performance', () => {
    it('should handle bulk project creation with complex folder structures', async () => {
      // Create a test user
      const user = await testDb.models.user.createUser({
        email: 'projecttest@example.com',
        username: 'projecttest',
        password: 'password123'
      });

      const projectCount = 50;
      const projects = [];

      const { duration } = await measurePerformance(async () => {
        for (let i = 0; i < projectCount; i++) {
          const project = await testDb.models.project.createProject({
            userId: user._id,
            title: `Performance Test Project ${i}`,
            description: `Project ${i} for performance testing`,
            folders: [
              {
                id: `folder-${i}-1`,
                name: `Main Folder ${i}`,
                scriptCount: 0,
                createdAt: new Date()
              },
              {
                id: `folder-${i}-2`,
                name: `Subfolder ${i}`,
                parentId: `folder-${i}-1`,
                scriptCount: 0,
                createdAt: new Date()
              },
              {
                id: `folder-${i}-3`,
                name: `Deep Subfolder ${i}`,
                parentId: `folder-${i}-2`,
                scriptCount: 0,
                createdAt: new Date()
              }
            ]
          });
          projects.push(project);
        }
      }, `Creating ${projectCount} projects with nested folders`);

      expect(projects).toHaveLength(projectCount);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should efficiently retrieve user projects with folder statistics', async () => {
      // Create test data
      const { users, projects } = await createBulkTestData(testDb.models, {
        users: 10,
        projects: 5,
        scripts: 3
      });

      // Test retrieving all projects for each user
      const { duration } = await measurePerformance(async () => {
        const retrievalPromises = users.map(user => 
          testDb.models.project.findByUserId(user._id)
        );
        return await Promise.all(retrievalPromises);
      }, 'Retrieving projects for 10 users (50 projects total)');

      expect(duration).toBeLessThan(5000);
    });

    it('should handle folder operations efficiently', async () => {
      const user = await testDb.models.user.createUser({
        email: 'foldertest@example.com',
        username: 'foldertest',
        password: 'password123'
      });

      const project = await testDb.models.project.createProject({
        userId: user._id,
        title: 'Folder Performance Test',
        folders: []
      });

      const folderCount = 100;

      // Test adding many folders
      const { duration } = await measurePerformance(async () => {
        for (let i = 0; i < folderCount; i++) {
          await testDb.models.project.addFolder(project._id, {
            id: `perf-folder-${i}`,
            name: `Performance Folder ${i}`,
            parentId: i > 0 ? `perf-folder-${Math.floor(i / 2)}` : undefined,
            scriptCount: 0,
            createdAt: new Date()
          });
        }
      }, `Adding ${folderCount} folders to project`);

      expect(duration).toBeLessThan(10000);

      // Verify folder structure
      const updatedProject = await testDb.models.project.findById(project._id);
      expect(updatedProject?.folders).toHaveLength(folderCount);
    });
  });

  describe('Script Operations Performance', () => {
    it('should handle bulk script creation efficiently', async () => {
      // Setup test data
      const user = await testDb.models.user.createUser({
        email: 'scripttest@example.com',
        username: 'scripttest',
        password: 'password123'
      });

      const project = await testDb.models.project.createProject({
        userId: user._id,
        title: 'Script Performance Test',
        folders: [{
          id: 'perf-folder',
          name: 'Performance Folder',
          scriptCount: 0,
          createdAt: new Date()
        }]
      });

      const scriptCount = 200;
      const scripts = [];

      const { duration } = await measurePerformance(async () => {
        for (let i = 0; i < scriptCount; i++) {
          const script = await testDb.models.script.createScript({
            userId: user._id,
            projectId: project._id,
            folderId: 'perf-folder',
            title: `Performance Script ${i}`,
            content: `This is performance test script ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
            metadata: {
              contentType: i % 2 === 0 ? 'tiktok' : 'youtube',
              duration: 30 + (i % 120),
              tags: [`tag${i}`, 'performance', 'test'],
              status: i % 3 === 0 ? 'draft' : i % 3 === 1 ? 'review' : 'final'
            }
          });
          scripts.push(script);
        }
      }, `Creating ${scriptCount} scripts`);

      expect(scripts).toHaveLength(scriptCount);
      expect(duration).toBeLessThan(20000); // Should complete within 20 seconds
    });

    it('should handle script search operations efficiently', async () => {
      // Create test data with searchable content
      const { users, projects, scripts } = await createBulkTestData(testDb.models, {
        users: 5,
        projects: 3,
        scripts: 20
      });

      const testUser = users[0];

      // Test text search performance
      const { duration: searchDuration } = await measurePerformance(async () => {
        return await testDb.models.script.searchScripts(testUser._id, 'test', {
          limit: 50
        });
      }, 'Searching scripts with text query');

      // Test filtered search performance
      const { duration: filterDuration } = await measurePerformance(async () => {
        return await testDb.models.script.findByUserId(testUser._id, {
          contentType: 'tiktok',
          status: 'draft',
          limit: 50
        });
      }, 'Searching scripts with filters');

      expect(searchDuration).toBeLessThan(3000);
      expect(filterDuration).toBeLessThan(2000);
    });

    it('should handle script updates and versioning efficiently', async () => {
      // Create test script
      const user = await testDb.models.user.createUser({
        email: 'versiontest@example.com',
        username: 'versiontest',
        password: 'password123'
      });

      const project = await testDb.models.project.createProject({
        userId: user._id,
        title: 'Version Test Project',
        folders: [{
          id: 'version-folder',
          name: 'Version Folder',
          scriptCount: 0,
          createdAt: new Date()
        }]
      });

      const script = await testDb.models.script.createScript({
        userId: user._id,
        projectId: project._id,
        folderId: 'version-folder',
        title: 'Version Test Script',
        content: 'Original content',
        metadata: {
          contentType: 'tiktok',
          duration: 30,
          tags: ['version', 'test'],
          status: 'draft'
        }
      });

      const updateCount = 50;

      // Test multiple updates (versioning)
      const { duration } = await measurePerformance(async () => {
        for (let i = 0; i < updateCount; i++) {
          await testDb.models.script.updateScript(script._id, {
            content: `Updated content version ${i}`,
            metadata: {
              ...script.metadata,
              status: i % 2 === 0 ? 'draft' : 'review'
            }
          });
        }
      }, `Updating script ${updateCount} times (versioning)`);

      expect(duration).toBeLessThan(8000);

      // Verify version history
      const updatedScript = await testDb.models.script.findById(script._id);
      expect(updatedScript?.versions).toHaveLength(updateCount + 1); // Original + updates
    });
  });

  describe('Complex Query Performance', () => {
    it('should handle aggregation queries efficiently', async () => {
      // Create substantial test data
      const { users, projects, scripts } = await createBulkTestData(testDb.models, {
        users: 10,
        projects: 5,
        scripts: 10
      });

      const testUser = users[0];

      // Test user statistics aggregation
      const { duration: statsDuration } = await measurePerformance(async () => {
        return await testDb.db.collection('projects').aggregate([
          { $match: { userId: testUser._id } },
          {
            $lookup: {
              from: 'scripts',
              localField: '_id',
              foreignField: 'projectId',
              as: 'scripts'
            }
          },
          {
            $group: {
              _id: '$userId',
              totalProjects: { $sum: 1 },
              totalScripts: { $sum: { $size: '$scripts' } },
              avgScriptsPerProject: { $avg: { $size: '$scripts' } }
            }
          }
        ]).toArray();
      }, 'User statistics aggregation');

      // Test content type distribution
      const { duration: distributionDuration } = await measurePerformance(async () => {
        return await testDb.db.collection('scripts').aggregate([
          { $match: { userId: testUser._id } },
          {
            $group: {
              _id: '$metadata.contentType',
              count: { $sum: 1 },
              avgDuration: { $avg: '$metadata.duration' }
            }
          }
        ]).toArray();
      }, 'Content type distribution aggregation');

      expect(statsDuration).toBeLessThan(3000);
      expect(distributionDuration).toBeLessThan(2000);
    });

    it('should handle concurrent database operations', async () => {
      const user = await testDb.models.user.createUser({
        email: 'concurrent@example.com',
        username: 'concurrent',
        password: 'password123'
      });

      const concurrentOperations = 20;

      // Test concurrent project creation
      const { duration } = await measurePerformance(async () => {
        const projectPromises = Array.from({ length: concurrentOperations }, (_, i) =>
          testDb.models.project.createProject({
            userId: user._id,
            title: `Concurrent Project ${i}`,
            folders: [{
              id: `concurrent-folder-${i}`,
              name: `Folder ${i}`,
              scriptCount: 0,
              createdAt: new Date()
            }]
          })
        );

        return await Promise.all(projectPromises);
      }, `${concurrentOperations} concurrent project creations`);

      expect(duration).toBeLessThan(8000);

      // Verify all projects were created
      const projects = await testDb.models.project.findByUserId(user._id);
      expect(projects).toHaveLength(concurrentOperations);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle large document operations efficiently', async () => {
      const user = await testDb.models.user.createUser({
        email: 'large@example.com',
        username: 'large',
        password: 'password123'
      });

      // Create project with many folders
      const folderCount = 500;
      const folders = Array.from({ length: folderCount }, (_, i) => ({
        id: `large-folder-${i}`,
        name: `Large Folder ${i}`,
        parentId: i > 0 ? `large-folder-${Math.floor(i / 10)}` : undefined,
        scriptCount: 0,
        createdAt: new Date()
      }));

      const { duration: createDuration } = await measurePerformance(async () => {
        return await testDb.models.project.createProject({
          userId: user._id,
          title: 'Large Project',
          description: 'Project with many folders for testing large document handling',
          folders
        });
      }, `Creating project with ${folderCount} folders`);

      expect(createDuration).toBeLessThan(5000);

      // Test retrieval of large document
      const { duration: retrievalDuration } = await measurePerformance(async () => {
        return await testDb.models.project.findByUserId(user._id);
      }, 'Retrieving large project document');

      expect(retrievalDuration).toBeLessThan(2000);
    });

    it('should handle batch operations efficiently', async () => {
      const user = await testDb.models.user.createUser({
        email: 'batch@example.com',
        username: 'batch',
        password: 'password123'
      });

      const project = await testDb.models.project.createProject({
        userId: user._id,
        title: 'Batch Test Project',
        folders: [{
          id: 'batch-folder',
          name: 'Batch Folder',
          scriptCount: 0,
          createdAt: new Date()
        }]
      });

      const batchSize = 100;
      const scriptData = Array.from({ length: batchSize }, (_, i) => ({
        userId: user._id,
        projectId: project._id,
        folderId: 'batch-folder',
        title: `Batch Script ${i}`,
        content: `Batch script content ${i}`,
        metadata: {
          contentType: 'tiktok' as const,
          duration: 30,
          tags: [`batch${i}`, 'test'],
          status: 'draft' as const
        },
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Test batch insert
      const { duration } = await measurePerformance(async () => {
        return await testDb.db.collection('scripts').insertMany(scriptData);
      }, `Batch inserting ${batchSize} scripts`);

      expect(duration).toBeLessThan(3000);

      // Verify batch insert
      const scripts = await testDb.models.script.findByProjectId(project._id);
      expect(scripts).toHaveLength(batchSize);
    });
  });
});