import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { app } from '../app';
import { setDatabase } from '../../lib/database/connection';

describe('User API Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;

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
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.token).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser1',
        password: 'password123'
      };

      // Register first user
      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const duplicateData = {
        ...userData,
        username: 'testuser2'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body.error.code).toBe('DUPLICATE_KEY_ERROR');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Register a test user
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });
    });

    it('should login with email successfully', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          identifier: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });

    it('should login with username successfully', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          identifier: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          identifier: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/users/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get auth token
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });
      
      authToken = response.body.token;
    });

    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/users/profile', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });
      
      authToken = response.body.token;
    });

    it('should update profile successfully', async () => {
      const updateData = {
        profile: {
          firstName: 'Updated',
          lastName: 'Name',
          bio: 'Updated bio'
        },
        preferences: {
          theme: 'dark' as const,
          defaultProjectView: 'list' as const
        }
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.profile.firstName).toBe('Updated');
      expect(response.body.user.preferences.theme).toBe('dark');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ profile: { firstName: 'Test' } })
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/users/password', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });
      
      authToken = response.body.token;
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');

      // Verify new password works
      await request(app)
        .post('/api/users/login')
        .send({
          identifier: 'test@example.com',
          password: 'newpassword123'
        })
        .expect(200);
    });

    it('should return 400 for incorrect current password', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/users/check-availability', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'taken@example.com',
          username: 'takenuser',
          password: 'password123'
        });
    });

    it('should check email availability', async () => {
      const response = await request(app)
        .post('/api/users/check-availability')
        .send({ email: 'available@example.com' })
        .expect(200);

      expect(response.body.available.email).toBe(true);
    });

    it('should return false for taken email', async () => {
      const response = await request(app)
        .post('/api/users/check-availability')
        .send({ email: 'taken@example.com' })
        .expect(200);

      expect(response.body.available.email).toBe(false);
    });

    it('should check username availability', async () => {
      const response = await request(app)
        .post('/api/users/check-availability')
        .send({ username: 'availableuser' })
        .expect(200);

      expect(response.body.available.username).toBe(true);
    });

    it('should return false for taken username', async () => {
      const response = await request(app)
        .post('/api/users/check-availability')
        .send({ username: 'takenuser' })
        .expect(200);

      expect(response.body.available.username).toBe(false);
    });
  });

  describe('DELETE /api/users/account', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });
      
      authToken = response.body.token;
    });

    it('should delete account successfully', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Account deleted successfully');

      // Verify user can no longer login
      await request(app)
        .post('/api/users/login')
        .send({
          identifier: 'test@example.com',
          password: 'password123'
        })
        .expect(401);
    });
  });

  describe('POST /api/users/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/users/logout')
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });
  });
});