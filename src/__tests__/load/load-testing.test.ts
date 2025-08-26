import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/app';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase, TestDatabase, measurePerformance } from '../utils/test-setup';
import { getTestConfig, TestReporter } from '../test-suite.config';
import { performance } from '../utils/test-helpers';

describe('Load Testing Suite', () => {
  let testDb: TestDatabase;
  let testConfig: ReturnType<typeof getTestConfig>;
  let reporter: TestReporter;

  beforeAll(async () => {
    testDb = await setupTestDatabase();
    testConfig = getTestConfig();
    reporter = new TestReporter();
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
    
    // Generate load test report
    const report = reporter.generateReport();
    console.log('\n=== LOAD TEST REPORT ===');
    console.log('Summary:', report.summary);
    console.log('Performance Metrics:', report.performanceMetrics);
    console.log('Recommendations:', report.recommendations);
  });

  beforeEach(async () => {
    await clearTestDatabase(testDb.db);
  });

  describe('User Registration Load Test', () => {
    it('should handle concurrent user registrations', async () => {
      const concurrentUsers = testConfig.loadTest.concurrentRequests;
      const userRegistrations = Array.from({ length: concurrentUsers }, (_, i) => ({
        email: `loadtest${i}@example.com`,
        username: `loaduser${i}`,
        password: 'password123',
        profile: {
          firstName: `Load${i}`,
          lastName: 'Test'
        }
      }));

      const { results, totalDuration, avgDuration } = await performance.measureBatch(
        userRegistrations.map(userData => () =>
          request(app)
            .post('/api/users/register')
            .send(userData)
            .expect(201)
        ),
        `Concurrent user registration (${concurrentUsers} users)`
      );

      // Verify all registrations succeeded
      expect(results).toHaveLength(concurrentUsers);
      results.forEach(response => {
        expect(response.body.user).toBeDefined();
        expect(response.body.token).toBeDefined();
      });

      // Performance assertions
      expect(totalDuration).toBeLessThan(testConfig.performance.concurrentOperations.maxDuration);
      expect(avgDuration).toBeLessThan(1000); // Average should be under 1 second per registration

      reporter.addResult({
        suite: 'load',
        name: 'concurrent user registration',
        status: 'passed',
        duration: totalDuration,
        metrics: {
          apiCalls: concurrentUsers
        }
      });
    });

    it('should handle user authentication under load', async () => {
      // First, create users
      const userCount = testConfig.loadTest.concurrentRequests;
      const users = [];

      for (let i = 0; i < userCount; i++) {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            email: `authload${i}@example.com`,
            username: `authload${i}`,
            password: 'password123'
          });
        users.push({
          email: `authload${i}@example.com`,
          password: 'password123'
        });
      }

      // Test concurrent authentication
      const { results, totalDuration } = await performance.measureBatch(
        users.map(user => () =>
          request(app)
            .post('/api/users/login')
            .send({
              identifier: user.email,
              password: user.password
            })
            .expect(200)
        ),
        `Concurrent user authentication (${userCount} users)`
      );

      expect(results).toHaveLength(userCount);
      expect(totalDuration).toBeLessThan(testConfig.performance.concurrentOperations.maxDuration);

      reporter.addResult({
        suite: 'load',
        name: 'concurrent user authentication',
        status: 'passed',
        duration: totalDuration,
        metrics: {
          apiCalls: userCount
        }
      });
    });
  });

  describe('Project Operations Load Test', () => {
    let authTokens: string[];
    let userIds: string[];

    beforeEach(async () => {
      // Create test users
      const userCount = testConfig.loadTest.users;
      authTokens = [];
      userIds = [];

      for (let i = 0; i < userCount; i++) {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            email: `projectload${i}@example.com`,
            username: `projectload${i}`,
            password: 'password123'
          });
        
        authTokens.push(response.body.token);
        userIds.push(response.body.user._id);
      }
    });

    it('should handle concurrent project creation', async () => {
      const projectsPerUser = testConfig.loadTest.projectsPerUser;
      const totalProjects = authTokens.length * projectsPerUser;

      const projectCreations = [];
      for (let userIndex = 0; userIndex < authTokens.length; userIndex++) {
        for (let projectIndex = 0; projectIndex < projectsPerUser; projectIndex++) {
          projectCreations.push(() =>
            request(app)
              .post('/api/projects')
              .set('Authorization', `Bearer ${authTokens[userIndex]}`)
              .send({
                title: `Load Test Project ${projectIndex} for User ${userIndex}`,
                description: `Project ${projectIndex} for load testing`,
                folders: [
                  {
                    id: `folder-${userIndex}-${projectIndex}`,
                    name: `Folder ${projectIndex}`,
                    scriptCount: 0,
                    createdAt: new Date().toISOString()
                  }
                ]
              })
              .expect(201)
          );
        }
      }

      const { results, totalDuration } = await performance.measureBatch(
        projectCreations,
        `Concurrent project creation (${totalProjects} projects)`
      );

      expect(results).toHaveLength(totalProjects);
      expect(totalDuration).toBeLessThan(testConfig.performance.projectOperations.maxDuration * 2);

      reporter.addResult({
        suite: 'load',
        name: 'concurrent project creation',
        status: 'passed',
        duration: totalDuration,
        metrics: {
          apiCalls: totalProjects
        }
      });
    });

    it('should handle concurrent project retrieval', async () => {
      // First create projects for each user
      const projectIds: string[] = [];
      
      for (let userIndex = 0; userIndex < authTokens.length; userIndex++) {
        const response = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${authTokens[userIndex]}`)
          .send({
            title: `Retrieval Test Project for User ${userIndex}`,
            folders: [{
              id: `retrieval-folder-${userIndex}`,
              name: 'Retrieval Folder',
              scriptCount: 0,
              createdAt: new Date().toISOString()
            }]
          });
        
        projectIds.push(response.body.project._id);
      }

      // Test concurrent retrieval
      const retrievalOperations = authTokens.map((token, index) => () =>
        request(app)
          .get('/api/projects')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
      );

      const { results, totalDuration } = await performance.measureBatch(
        retrievalOperations,
        `Concurrent project retrieval (${authTokens.length} users)`
      );

      expect(results).toHaveLength(authTokens.length);
      expect(totalDuration).toBeLessThan(5000);

      reporter.addResult({
        suite: 'load',
        name: 'concurrent project retrieval',
        status: 'passed',
        duration: totalDuration,
        metrics: {
          apiCalls: authTokens.length
        }
      });
    });
  });

  describe('Script Operations Load Test', () => {
    let testSetup: {
      authTokens: string[];
      projectIds: string[];
      folderIds: string[];
    };

    beforeEach(async () => {
      // Create comprehensive test setup
      const userCount = Math.min(testConfig.loadTest.users, 5); // Limit for performance
      const authTokens = [];
      const projectIds = [];
      const folderIds = [];

      for (let i = 0; i < userCount; i++) {
        // Create user
        const userResponse = await request(app)
          .post('/api/users/register')
          .send({
            email: `scriptload${i}@example.com`,
            username: `scriptload${i}`,
            password: 'password123'
          });
        
        authTokens.push(userResponse.body.token);

        // Create project
        const projectResponse = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${userResponse.body.token}`)
          .send({
            title: `Script Load Test Project ${i}`,
            folders: [{
              id: `script-folder-${i}`,
              name: `Script Folder ${i}`,
              scriptCount: 0,
              createdAt: new Date().toISOString()
            }]
          });

        projectIds.push(projectResponse.body.project._id);
        folderIds.push(`script-folder-${i}`);
      }

      testSetup = { authTokens, projectIds, folderIds };
    });

    it('should handle concurrent script creation', async () => {
      const scriptsPerProject = testConfig.loadTest.scriptsPerProject;
      const totalScripts = testSetup.authTokens.length * scriptsPerProject;

      const scriptCreations = [];
      for (let userIndex = 0; userIndex < testSetup.authTokens.length; userIndex++) {
        for (let scriptIndex = 0; scriptIndex < scriptsPerProject; scriptIndex++) {
          scriptCreations.push(() =>
            request(app)
              .post('/api/scripts')
              .set('Authorization', `Bearer ${testSetup.authTokens[userIndex]}`)
              .send({
                title: `Load Test Script ${scriptIndex} for User ${userIndex}`,
                content: `This is load test script content ${scriptIndex}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
                projectId: testSetup.projectIds[userIndex],
                folderId: testSetup.folderIds[userIndex],
                metadata: {
                  contentType: scriptIndex % 2 === 0 ? 'tiktok' : 'youtube',
                  duration: 30 + (scriptIndex * 10),
                  tags: [`load${scriptIndex}`, 'test'],
                  status: 'draft'
                }
              })
              .expect(201)
          );
        }
      }

      const { results, totalDuration } = await performance.measureBatch(
        scriptCreations,
        `Concurrent script creation (${totalScripts} scripts)`
      );

      expect(results).toHaveLength(totalScripts);
      expect(totalDuration).toBeLessThan(testConfig.performance.scriptOperations.maxDuration * 2);

      reporter.addResult({
        suite: 'load',
        name: 'concurrent script creation',
        status: 'passed',
        duration: totalDuration,
        metrics: {
          apiCalls: totalScripts
        }
      });
    });

    it('should handle concurrent script search operations', async () => {
      // First create scripts to search
      const scriptsPerUser = 10;
      
      for (let userIndex = 0; userIndex < testSetup.authTokens.length; userIndex++) {
        for (let scriptIndex = 0; scriptIndex < scriptsPerUser; scriptIndex++) {
          await request(app)
            .post('/api/scripts')
            .set('Authorization', `Bearer ${testSetup.authTokens[userIndex]}`)
            .send({
              title: `Searchable Script ${scriptIndex}`,
              content: `This script contains searchable content about ${scriptIndex % 2 === 0 ? 'tutorial' : 'entertainment'}`,
              projectId: testSetup.projectIds[userIndex],
              folderId: testSetup.folderIds[userIndex],
              metadata: {
                contentType: 'tiktok',
                duration: 30,
                tags: ['searchable', 'test'],
                status: 'draft'
              }
            });
        }
      }

      // Test concurrent search operations
      const searchOperations = testSetup.authTokens.map(token => () =>
        request(app)
          .get('/api/scripts/search')
          .set('Authorization', `Bearer ${token}`)
          .query({ q: 'tutorial' })
          .expect(200)
      );

      const { results, totalDuration } = await performance.measureBatch(
        searchOperations,
        `Concurrent script search (${testSetup.authTokens.length} searches)`
      );

      expect(results).toHaveLength(testSetup.authTokens.length);
      expect(totalDuration).toBeLessThan(testConfig.performance.searchOperations.maxDuration * 2);

      reporter.addResult({
        suite: 'load',
        name: 'concurrent script search',
        status: 'passed',
        duration: totalDuration,
        metrics: {
          apiCalls: testSetup.authTokens.length
        }
      });
    });

    it('should handle concurrent script updates', async () => {
      // Create scripts to update
      const scriptIds = [];
      
      for (let userIndex = 0; userIndex < testSetup.authTokens.length; userIndex++) {
        const response = await request(app)
          .post('/api/scripts')
          .set('Authorization', `Bearer ${testSetup.authTokens[userIndex]}`)
          .send({
            title: `Update Test Script ${userIndex}`,
            content: 'Original content',
            projectId: testSetup.projectIds[userIndex],
            folderId: testSetup.folderIds[userIndex],
            metadata: {
              contentType: 'tiktok',
              duration: 30,
              tags: ['update', 'test'],
              status: 'draft'
            }
          });
        
        scriptIds.push(response.body.script._id);
      }

      // Test concurrent updates
      const updateOperations = testSetup.authTokens.map((token, index) => () =>
        request(app)
          .put(`/api/scripts/${scriptIds[index]}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: `Updated Script ${index}`,
            content: 'Updated content with more details',
            metadata: {
              contentType: 'tiktok',
              duration: 45,
              tags: ['updated', 'test'],
              status: 'review'
            }
          })
          .expect(200)
      );

      const { results, totalDuration } = await performance.measureBatch(
        updateOperations,
        `Concurrent script updates (${testSetup.authTokens.length} updates)`
      );

      expect(results).toHaveLength(testSetup.authTokens.length);
      expect(totalDuration).toBeLessThan(8000);

      reporter.addResult({
        suite: 'load',
        name: 'concurrent script updates',
        status: 'passed',
        duration: totalDuration,
        metrics: {
          apiCalls: testSetup.authTokens.length
        }
      });
    });
  });

  describe('Mixed Operations Load Test', () => {
    it('should handle mixed concurrent operations', async () => {
      const operationCount = 20;
      const operations = [];

      // Mix of different operations
      for (let i = 0; i < operationCount; i++) {
        const operationType = i % 4;
        
        switch (operationType) {
          case 0: // User registration
            operations.push(() =>
              request(app)
                .post('/api/users/register')
                .send({
                  email: `mixed${i}@example.com`,
                  username: `mixed${i}`,
                  password: 'password123'
                })
                .expect(201)
            );
            break;
            
          case 1: // User login (after registration)
            operations.push(async () => {
              // First register
              await request(app)
                .post('/api/users/register')
                .send({
                  email: `login${i}@example.com`,
                  username: `login${i}`,
                  password: 'password123'
                });
              
              // Then login
              return request(app)
                .post('/api/users/login')
                .send({
                  identifier: `login${i}@example.com`,
                  password: 'password123'
                })
                .expect(200);
            });
            break;
            
          case 2: // Project creation (after user setup)
            operations.push(async () => {
              const userResponse = await request(app)
                .post('/api/users/register')
                .send({
                  email: `project${i}@example.com`,
                  username: `project${i}`,
                  password: 'password123'
                });
              
              return request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${userResponse.body.token}`)
                .send({
                  title: `Mixed Test Project ${i}`,
                  folders: [{
                    id: `mixed-folder-${i}`,
                    name: `Mixed Folder ${i}`,
                    scriptCount: 0,
                    createdAt: new Date().toISOString()
                  }]
                })
                .expect(201);
            });
            break;
            
          case 3: // Script creation (after full setup)
            operations.push(async () => {
              const userResponse = await request(app)
                .post('/api/users/register')
                .send({
                  email: `script${i}@example.com`,
                  username: `script${i}`,
                  password: 'password123'
                });
              
              const projectResponse = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${userResponse.body.token}`)
                .send({
                  title: `Script Test Project ${i}`,
                  folders: [{
                    id: `script-folder-${i}`,
                    name: `Script Folder ${i}`,
                    scriptCount: 0,
                    createdAt: new Date().toISOString()
                  }]
                });
              
              return request(app)
                .post('/api/scripts')
                .set('Authorization', `Bearer ${userResponse.body.token}`)
                .send({
                  title: `Mixed Test Script ${i}`,
                  content: `Mixed operation script content ${i}`,
                  projectId: projectResponse.body.project._id,
                  folderId: `script-folder-${i}`,
                  metadata: {
                    contentType: 'tiktok',
                    duration: 30,
                    tags: ['mixed', 'test'],
                    status: 'draft'
                  }
                })
                .expect(201);
            });
            break;
        }
      }

      const { results, totalDuration } = await performance.measureBatch(
        operations,
        `Mixed concurrent operations (${operationCount} operations)`
      );

      expect(results).toHaveLength(operationCount);
      expect(totalDuration).toBeLessThan(30000); // 30 seconds for mixed operations

      reporter.addResult({
        suite: 'load',
        name: 'mixed concurrent operations',
        status: 'passed',
        duration: totalDuration,
        metrics: {
          apiCalls: operationCount
        }
      });
    });
  });

  describe('Database Load Test', () => {
    it('should handle database operations under load', async () => {
      const { result: bulkData, memoryUsage } = await performance.measureMemory(async () => {
        return await testDb.models.user.createUser({
          email: 'dbload@example.com',
          username: 'dbloaduser',
          password: 'password123'
        });
      }, 'Database user creation with memory tracking');

      expect(bulkData).toBeDefined();
      expect(memoryUsage.heapUsed).toBeLessThan(50 * 1024 * 1024); // Less than 50MB

      reporter.addResult({
        suite: 'load',
        name: 'database operations under load',
        status: 'passed',
        duration: 0,
        metrics: {
          memoryUsage: memoryUsage.heapUsed,
          dbOperations: 1
        }
      });
    });
  });
});