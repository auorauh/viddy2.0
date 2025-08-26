import { ObjectId } from 'mongodb';
import { TestDatabase } from './test-setup';

/**
 * Helper functions for creating test data and assertions
 */

export interface TestUser {
  _id: ObjectId;
  email: string;
  username: string;
  passwordHash: string;
  profile: any;
  preferences: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestProject {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  folders: any[];
  settings: any;
  stats: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestScript {
  _id: ObjectId;
  userId: ObjectId;
  projectId: ObjectId;
  folderId: string;
  title: string;
  content: string;
  metadata: any;
  versions: any[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a test user with default values
 */
export async function createTestUser(
  models: TestDatabase['models'],
  overrides: Partial<any> = {}
): Promise<TestUser> {
  const defaultData = {
    email: `test${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'password123',
    profile: {
      firstName: 'Test',
      lastName: 'User'
    },
    preferences: {
      theme: 'light',
      defaultProjectView: 'grid'
    }
  };

  return await models.user.createUser({ ...defaultData, ...overrides });
}

/**
 * Creates a test project with default values
 */
export async function createTestProject(
  models: TestDatabase['models'],
  userId: ObjectId,
  overrides: Partial<any> = {}
): Promise<TestProject> {
  const defaultData = {
    userId,
    title: `Test Project ${Date.now()}`,
    description: 'A test project',
    folders: [
      {
        id: `folder-${Date.now()}`,
        name: 'Test Folder',
        scriptCount: 0,
        createdAt: new Date()
      }
    ],
    settings: {
      isPublic: false,
      allowCollaboration: true
    }
  };

  return await models.project.createProject({ ...defaultData, ...overrides });
}

/**
 * Creates a test script with default values
 */
export async function createTestScript(
  models: TestDatabase['models'],
  userId: ObjectId,
  projectId: ObjectId,
  folderId: string,
  overrides: Partial<any> = {}
): Promise<TestScript> {
  const defaultData = {
    userId,
    projectId,
    folderId,
    title: `Test Script ${Date.now()}`,
    content: 'This is test script content for testing purposes.',
    metadata: {
      contentType: 'tiktok',
      duration: 30,
      tags: ['test'],
      status: 'draft'
    }
  };

  return await models.script.createScript({ ...defaultData, ...overrides });
}

/**
 * Creates a complete test workflow with user, project, and scripts
 */
export async function createCompleteTestWorkflow(
  models: TestDatabase['models'],
  options: {
    scriptCount?: number;
    folderCount?: number;
    userOverrides?: Partial<any>;
    projectOverrides?: Partial<any>;
    scriptOverrides?: Partial<any>;
  } = {}
) {
  const {
    scriptCount = 3,
    folderCount = 2,
    userOverrides = {},
    projectOverrides = {},
    scriptOverrides = {}
  } = options;

  // Create user
  const user = await createTestUser(models, userOverrides);

  // Create folders
  const folders = Array.from({ length: folderCount }, (_, i) => ({
    id: `test-folder-${i}`,
    name: `Test Folder ${i}`,
    parentId: i > 0 ? `test-folder-${Math.floor(i / 2)}` : undefined,
    scriptCount: 0,
    createdAt: new Date()
  }));

  // Create project
  const project = await createTestProject(models, user._id, {
    folders,
    ...projectOverrides
  });

  // Create scripts
  const scripts = [];
  for (let i = 0; i < scriptCount; i++) {
    const script = await createTestScript(
      models,
      user._id,
      project._id,
      folders[i % folders.length].id,
      {
        title: `Test Script ${i}`,
        metadata: {
          contentType: i % 2 === 0 ? 'tiktok' : 'youtube',
          duration: 30 + (i * 10),
          tags: [`tag${i}`, 'test'],
          status: i % 3 === 0 ? 'draft' : i % 3 === 1 ? 'review' : 'final'
        },
        ...scriptOverrides
      }
    );
    scripts.push(script);
  }

  return { user, project, scripts, folders };
}

/**
 * Assertion helpers for testing
 */
export const assertions = {
  /**
   * Asserts that a user object has the expected structure
   */
  assertValidUser(user: any) {
    expect(user).toBeDefined();
    expect(user._id).toBeInstanceOf(ObjectId);
    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(user.username).toBeTruthy();
    expect(user.passwordHash).toBeTruthy();
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  },

  /**
   * Asserts that a project object has the expected structure
   */
  assertValidProject(project: any) {
    expect(project).toBeDefined();
    expect(project._id).toBeInstanceOf(ObjectId);
    expect(project.userId).toBeInstanceOf(ObjectId);
    expect(project.title).toBeTruthy();
    expect(Array.isArray(project.folders)).toBe(true);
    expect(project.settings).toBeDefined();
    expect(project.createdAt).toBeInstanceOf(Date);
    expect(project.updatedAt).toBeInstanceOf(Date);
  },

  /**
   * Asserts that a script object has the expected structure
   */
  assertValidScript(script: any) {
    expect(script).toBeDefined();
    expect(script._id).toBeInstanceOf(ObjectId);
    expect(script.userId).toBeInstanceOf(ObjectId);
    expect(script.projectId).toBeInstanceOf(ObjectId);
    expect(script.folderId).toBeTruthy();
    expect(script.title).toBeTruthy();
    expect(script.content).toBeTruthy();
    expect(script.metadata).toBeDefined();
    expect(script.metadata.contentType).toMatch(/^(tiktok|youtube|instagram|general)$/);
    expect(script.metadata.status).toMatch(/^(draft|review|final|published)$/);
    expect(Array.isArray(script.versions)).toBe(true);
    expect(script.createdAt).toBeInstanceOf(Date);
    expect(script.updatedAt).toBeInstanceOf(Date);
  },

  /**
   * Asserts that a folder object has the expected structure
   */
  assertValidFolder(folder: any) {
    expect(folder).toBeDefined();
    expect(folder.id).toBeTruthy();
    expect(folder.name).toBeTruthy();
    expect(typeof folder.scriptCount).toBe('number');
    expect(folder.createdAt).toBeInstanceOf(Date);
  },

  /**
   * Asserts that an API response has the expected error structure
   */
  assertValidErrorResponse(response: any, expectedCode?: string) {
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBeTruthy();
    expect(response.body.error.message).toBeTruthy();
    expect(response.body.timestamp).toBeDefined();
    
    if (expectedCode) {
      expect(response.body.error.code).toBe(expectedCode);
    }
  },

  /**
   * Asserts that an API response has the expected success structure
   */
  assertValidSuccessResponse(response: any, expectedMessage?: string) {
    expect(response.body.message).toBeTruthy();
    
    if (expectedMessage) {
      expect(response.body.message).toBe(expectedMessage);
    }
  }
};

/**
 * Performance testing utilities
 */
export const performance = {
  /**
   * Measures the execution time of multiple operations
   */
  async measureBatch<T>(
    operations: (() => Promise<T>)[],
    label: string
  ): Promise<{ results: T[]; totalDuration: number; avgDuration: number }> {
    const start = Date.now();
    const results = await Promise.all(operations.map(op => op()));
    const end = Date.now();
    
    const totalDuration = end - start;
    const avgDuration = totalDuration / operations.length;
    
    console.log(`${label}: ${totalDuration}ms total, ${avgDuration.toFixed(2)}ms average`);
    
    return { results, totalDuration, avgDuration };
  },

  /**
   * Measures memory usage during operation
   */
  async measureMemory<T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<{ result: T; memoryUsage: NodeJS.MemoryUsage }> {
    const initialMemory = process.memoryUsage();
    const result = await operation();
    const finalMemory = process.memoryUsage();
    
    const memoryDiff = {
      rss: finalMemory.rss - initialMemory.rss,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      external: finalMemory.external - initialMemory.external,
      arrayBuffers: finalMemory.arrayBuffers - initialMemory.arrayBuffers
    };
    
    console.log(`${label} memory usage:`, {
      'RSS': `${(memoryDiff.rss / 1024 / 1024).toFixed(2)}MB`,
      'Heap Used': `${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`
    });
    
    return { result, memoryUsage: memoryDiff };
  }
};

/**
 * Data generation utilities for testing
 */
export const generators = {
  /**
   * Generates random email address
   */
  randomEmail(): string {
    const domains = ['example.com', 'test.org', 'demo.net'];
    const username = Math.random().toString(36).substring(2, 10);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}@${domain}`;
  },

  /**
   * Generates random username
   */
  randomUsername(): string {
    const adjectives = ['cool', 'awesome', 'super', 'mega', 'ultra'];
    const nouns = ['user', 'creator', 'maker', 'builder', 'artist'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adjective}${noun}${number}`;
  },

  /**
   * Generates random script content
   */
  randomScriptContent(contentType: 'tiktok' | 'youtube' | 'instagram' | 'general' = 'tiktok'): string {
    const templates = {
      tiktok: [
        'POV: You just discovered the secret to...',
        'This trend is about to blow up! Here\'s how to...',
        'Day in my life as a...',
        'Things nobody tells you about...'
      ],
      youtube: [
        'Welcome back to my channel! Today we\'re going to...',
        'In this tutorial, I\'ll show you how to...',
        'Let\'s dive deep into...',
        'Here are the top 10 ways to...'
      ],
      instagram: [
        'Quick tip for your daily routine...',
        'Outfit of the day featuring...',
        'Behind the scenes of...',
        'Transform your space with...'
      ],
      general: [
        'Here\'s an interesting fact about...',
        'Let me share my experience with...',
        'The ultimate guide to...',
        'Everything you need to know about...'
      ]
    };

    const template = templates[contentType][Math.floor(Math.random() * templates[contentType].length)];
    return template + ' Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  },

  /**
   * Generates random tags
   */
  randomTags(count: number = 3): string[] {
    const allTags = [
      'trending', 'viral', 'tutorial', 'tips', 'lifestyle', 'fashion', 'food',
      'travel', 'fitness', 'beauty', 'tech', 'gaming', 'music', 'art', 'diy',
      'comedy', 'educational', 'motivational', 'behind-the-scenes', 'review'
    ];
    
    const shuffled = allTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};

/**
 * Test data cleanup utilities
 */
export const cleanup = {
  /**
   * Removes all test data created by a specific test
   */
  async cleanupTestData(
    models: TestDatabase['models'],
    identifiers: { userIds?: ObjectId[]; projectIds?: ObjectId[]; scriptIds?: ObjectId[] }
  ) {
    const { userIds = [], projectIds = [], scriptIds = [] } = identifiers;

    // Delete scripts
    for (const scriptId of scriptIds) {
      try {
        await models.script.deleteScript(scriptId);
      } catch (error) {
        // Ignore if already deleted
      }
    }

    // Delete projects
    for (const projectId of projectIds) {
      try {
        await models.project.deleteProject(projectId);
      } catch (error) {
        // Ignore if already deleted
      }
    }

    // Delete users
    for (const userId of userIds) {
      try {
        await models.user.deleteUser(userId);
      } catch (error) {
        // Ignore if already deleted
      }
    }
  }
};