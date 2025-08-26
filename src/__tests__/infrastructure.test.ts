import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, TestDatabase } from './utils/test-setup';
import { createTestUser, assertions } from './utils/test-helpers';

describe('Test Infrastructure Verification', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
  });

  it('should set up test database correctly', () => {
    expect(testDb).toBeDefined();
    expect(testDb.db).toBeDefined();
    expect(testDb.models).toBeDefined();
    expect(testDb.models.user).toBeDefined();
    expect(testDb.models.project).toBeDefined();
    expect(testDb.models.script).toBeDefined();
  });

  it('should create test user using helper functions', async () => {
    const user = await createTestUser(testDb.models);
    
    assertions.assertValidUser(user);
    expect(user.email).toMatch(/@example\.com$/);
    expect(user.username).toMatch(/^testuser\d+$/);
  });

  it('should verify test configuration is loaded', async () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-secret-key-for-testing-only');
  });
});