import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { setDatabase } from '../../lib/database/connection';
import { UserModel } from '../../lib/database/models/user';
import { ProjectModel } from '../../lib/database/models/project';
import { ScriptModel } from '../../lib/database/models/script';

export interface TestDatabase {
  mongoServer: MongoMemoryServer;
  client: MongoClient;
  db: Db;
  models: {
    user: UserModel;
    project: ProjectModel;
    script: ScriptModel;
  };
}

/**
 * Sets up an in-memory MongoDB instance for testing
 */
export async function setupTestDatabase(): Promise<TestDatabase> {
  // Start in-memory MongoDB instance
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect to the in-memory database
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('test-db');
  
  // Set the database for the application
  setDatabase(db);
  
  // Initialize models
  const models = {
    user: new UserModel(db),
    project: new ProjectModel(db),
    script: new ScriptModel(db)
  };
  
  // Set required environment variables for testing
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  process.env.NODE_ENV = 'test';
  
  return {
    mongoServer,
    client,
    db,
    models
  };
}

/**
 * Tears down the test database and cleans up resources
 */
export async function teardownTestDatabase(testDb: TestDatabase): Promise<void> {
  if (testDb.client) {
    await testDb.client.close();
  }
  if (testDb.mongoServer) {
    await testDb.mongoServer.stop();
  }
}

/**
 * Clears all collections in the test database
 */
export async function clearTestDatabase(db: Db): Promise<void> {
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
}

/**
 * Creates test data for a complete user workflow
 */
export async function createTestUserWorkflow(models: TestDatabase['models']) {
  // Create test user
  const user = await models.user.createUser({
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'password123',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      bio: 'Test user for workflows'
    }
  });

  // Create test project with folder structure
  const project = await models.project.createProject({
    userId: user._id,
    title: 'Test Project',
    description: 'A test project for workflows',
    folders: [
      {
        id: 'folder-1',
        name: 'Scripts',
        scriptCount: 0,
        createdAt: new Date()
      },
      {
        id: 'folder-2',
        name: 'Drafts',
        parentId: 'folder-1',
        scriptCount: 0,
        createdAt: new Date()
      }
    ]
  });

  // Create test scripts
  const script1 = await models.script.createScript({
    userId: user._id,
    projectId: project._id,
    folderId: 'folder-1',
    title: 'Test Script 1',
    content: 'This is a test script for TikTok content',
    metadata: {
      contentType: 'tiktok',
      duration: 30,
      tags: ['test', 'tiktok'],
      status: 'draft'
    }
  });

  const script2 = await models.script.createScript({
    userId: user._id,
    projectId: project._id,
    folderId: 'folder-2',
    title: 'Test Script 2',
    content: 'This is a test script for YouTube content',
    metadata: {
      contentType: 'youtube',
      duration: 120,
      tags: ['test', 'youtube'],
      status: 'review'
    }
  });

  return {
    user,
    project,
    scripts: [script1, script2]
  };
}

/**
 * Performance test helper to measure execution time
 */
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`${label}: ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Creates bulk test data for performance testing
 */
export async function createBulkTestData(
  models: TestDatabase['models'],
  counts: { users: number; projects: number; scripts: number }
) {
  const users = [];
  const projects = [];
  const scripts = [];

  // Create users
  for (let i = 0; i < counts.users; i++) {
    const user = await models.user.createUser({
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

  // Create projects for each user
  for (const user of users) {
    for (let i = 0; i < counts.projects; i++) {
      const project = await models.project.createProject({
        userId: user._id,
        title: `Project ${i} for ${user.username}`,
        description: `Test project ${i}`,
        folders: [
          {
            id: `folder-${i}-1`,
            name: `Folder ${i}`,
            scriptCount: 0,
            createdAt: new Date()
          }
        ]
      });
      projects.push({ project, userId: user._id });
    }
  }

  // Create scripts for each project
  for (const { project, userId } of projects) {
    for (let i = 0; i < counts.scripts; i++) {
      const script = await models.script.createScript({
        userId,
        projectId: project._id,
        folderId: project.folders[0].id,
        title: `Script ${i} in ${project.title}`,
        content: `This is test script content ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        metadata: {
          contentType: i % 2 === 0 ? 'tiktok' : 'youtube',
          duration: 30 + (i * 10),
          tags: [`tag${i}`, 'test'],
          status: i % 3 === 0 ? 'draft' : i % 3 === 1 ? 'review' : 'final'
        }
      });
      scripts.push(script);
    }
  }

  return { users, projects: projects.map(p => p.project), scripts };
}