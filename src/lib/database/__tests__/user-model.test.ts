import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { UserModel } from '../models/user';
import { UserRepository } from '../repositories/user-repository';
import { ProjectView, Theme } from '../types';
import { ValidationError, DuplicateKeyError, NotFoundError } from '../errors';

describe('User Model and Repository', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let userModel: UserModel;
  let userRepository: UserRepository;

  beforeEach(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Connect to the in-memory database
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test-db');
    
    // Initialize models
    userModel = new UserModel(db);
    userRepository = new UserRepository(db);
  });

  afterEach(async () => {
    // Clean up
    if (client) {
      await client.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testpassword123';
      const hash = await UserModel.hashPassword(password);
      
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should verify passwords correctly', async () => {
      const password = 'testpassword123';
      const hash = await UserModel.hashPassword(password);
      
      const isValid = await UserModel.verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await UserModel.verifyPassword('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should reject passwords that are too short', async () => {
      await expect(UserModel.hashPassword('12345')).rejects.toThrow(ValidationError);
    });

    it('should handle empty passwords gracefully', async () => {
      await expect(UserModel.hashPassword('')).rejects.toThrow(ValidationError);
      
      const result = await UserModel.verifyPassword('', 'somehash');
      expect(result).toBe(false);
    });
  });

  describe('User Creation', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        bio: 'Test bio'
      },
      preferences: {
        defaultProjectView: ProjectView.GRID,
        theme: Theme.LIGHT
      }
    };

    it('should create a user successfully', async () => {
      const user = await userModel.createUser(validUserData);
      
      expect(user._id).toBeInstanceOf(ObjectId);
      expect(user.email).toBe(validUserData.email.toLowerCase());
      expect(user.username).toBe(validUserData.username);
      expect(user.passwordHash).toBeTruthy();
      expect(user.passwordHash).not.toBe(validUserData.password);
      expect(user.profile.firstName).toBe(validUserData.profile.firstName);
      expect(user.preferences.theme).toBe(validUserData.preferences.theme);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with default preferences', async () => {
      const userData = {
        email: 'test2@example.com',
        username: 'testuser2',
        password: 'password123'
      };
      
      const user = await userModel.createUser(userData);
      
      expect(user.preferences.defaultProjectView).toBe(ProjectView.GRID);
      expect(user.preferences.theme).toBe(Theme.LIGHT);
      expect(user.profile).toEqual({});
    });

    it('should normalize email to lowercase', async () => {
      const userData = {
        ...validUserData,
        email: 'TEST@EXAMPLE.COM',
        username: 'testuser3'
      };
      
      const user = await userModel.createUser(userData);
      expect(user.email).toBe('test@example.com');
    });

    it('should trim whitespace from email and username', async () => {
      const userData = {
        ...validUserData,
        email: '  test4@example.com  ',
        username: '  testuser4  '
      };
      
      const user = await userModel.createUser(userData);
      expect(user.email).toBe('test4@example.com');
      expect(user.username).toBe('testuser4');
    });

    it('should reject duplicate email', async () => {
      await userModel.createUser(validUserData);
      
      const duplicateUser = {
        ...validUserData,
        username: 'differentuser'
      };
      
      await expect(userModel.createUser(duplicateUser)).rejects.toThrow(DuplicateKeyError);
    });

    it('should reject duplicate username', async () => {
      await userModel.createUser(validUserData);
      
      const duplicateUser = {
        ...validUserData,
        email: 'different@example.com'
      };
      
      await expect(userModel.createUser(duplicateUser)).rejects.toThrow(DuplicateKeyError);
    });

    it('should reject invalid email format', async () => {
      const invalidUser = {
        ...validUserData,
        email: 'invalid-email'
      };
      
      await expect(userModel.createUser(invalidUser)).rejects.toThrow(ValidationError);
    });

    it('should reject invalid username format', async () => {
      const invalidUser = {
        ...validUserData,
        username: 'ab' // too short
      };
      
      await expect(userModel.createUser(invalidUser)).rejects.toThrow(ValidationError);
    });
  });

  describe('User Lookup', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await userModel.createUser({
        email: 'lookup@example.com',
        username: 'lookupuser',
        password: 'password123',
        profile: { firstName: 'Lookup', lastName: 'User' }
      });
    });

    it('should find user by email', async () => {
      const found = await userModel.findByEmail('lookup@example.com');
      expect(found).toBeTruthy();
      expect(found?._id.toString()).toBe(testUser._id.toString());
    });

    it('should find user by email case-insensitively', async () => {
      const found = await userModel.findByEmail('LOOKUP@EXAMPLE.COM');
      expect(found).toBeTruthy();
      expect(found?._id.toString()).toBe(testUser._id.toString());
    });

    it('should find user by username', async () => {
      const found = await userModel.findByUsername('lookupuser');
      expect(found).toBeTruthy();
      expect(found?._id.toString()).toBe(testUser._id.toString());
    });

    it('should find user by ID', async () => {
      const found = await userModel.findById(testUser._id);
      expect(found).toBeTruthy();
      expect(found?._id.toString()).toBe(testUser._id.toString());
    });

    it('should find user by ID string', async () => {
      const found = await userModel.findById(testUser._id.toString());
      expect(found).toBeTruthy();
      expect(found?._id.toString()).toBe(testUser._id.toString());
    });

    it('should return null for non-existent email', async () => {
      const found = await userModel.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });

    it('should return null for non-existent username', async () => {
      const found = await userModel.findByUsername('nonexistentuser');
      expect(found).toBeNull();
    });

    it('should return null for non-existent ID', async () => {
      const found = await userModel.findById(new ObjectId());
      expect(found).toBeNull();
    });

    it('should throw validation error for invalid ID format', async () => {
      await expect(userModel.findById('invalid-id')).rejects.toThrow(ValidationError);
    });
  });

  describe('User Authentication', () => {
    let testUser: any;
    const password = 'password123';

    beforeEach(async () => {
      testUser = await userModel.createUser({
        email: 'auth@example.com',
        username: 'authuser',
        password,
        profile: { firstName: 'Auth', lastName: 'User' }
      });
    });

    it('should authenticate with correct email and password', async () => {
      const authenticated = await userModel.authenticate('auth@example.com', password);
      expect(authenticated).toBeTruthy();
      expect(authenticated?._id.toString()).toBe(testUser._id.toString());
    });

    it('should authenticate with correct username and password', async () => {
      const authenticated = await userModel.authenticate('authuser', password);
      expect(authenticated).toBeTruthy();
      expect(authenticated?._id.toString()).toBe(testUser._id.toString());
    });

    it('should return null for incorrect password', async () => {
      const authenticated = await userModel.authenticate('auth@example.com', 'wrongpassword');
      expect(authenticated).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const authenticated = await userModel.authenticate('nonexistent@example.com', password);
      expect(authenticated).toBeNull();
    });

    it('should throw validation error for empty credentials', async () => {
      await expect(userModel.authenticate('', password)).rejects.toThrow(ValidationError);
      await expect(userModel.authenticate('auth@example.com', '')).rejects.toThrow(ValidationError);
    });
  });

  describe('User Updates', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await userModel.createUser({
        email: 'update@example.com',
        username: 'updateuser',
        password: 'password123',
        profile: { firstName: 'Update', lastName: 'User' }
      });
    });

    it('should update user profile', async () => {
      const updateData = {
        profile: {
          firstName: 'Updated',
          lastName: 'Name',
          bio: 'Updated bio'
        }
      };

      const updated = await userModel.updateUser(testUser._id, updateData);
      expect(updated.profile.firstName).toBe('Updated');
      expect(updated.profile.lastName).toBe('Name');
      expect(updated.profile.bio).toBe('Updated bio');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(testUser.updatedAt.getTime());
    });

    it('should update user preferences', async () => {
      const updateData = {
        preferences: {
          defaultProjectView: ProjectView.LIST,
          theme: Theme.DARK
        }
      };

      const updated = await userModel.updateUser(testUser._id, updateData);
      expect(updated.preferences.defaultProjectView).toBe(ProjectView.LIST);
      expect(updated.preferences.theme).toBe(Theme.DARK);
    });

    it('should normalize email and username on update', async () => {
      const updateData = {
        email: '  UPDATED@EXAMPLE.COM  ',
        username: '  updateduser  '
      };

      const updated = await userModel.updateUser(testUser._id, updateData);
      expect(updated.email).toBe('updated@example.com');
      expect(updated.username).toBe('updateduser');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      const updateData = { profile: { firstName: 'Test' } };
      await expect(userModel.updateUser(new ObjectId(), updateData)).rejects.toThrow(NotFoundError);
    });

    it('should reject duplicate email on update', async () => {
      // Create another user
      await userModel.createUser({
        email: 'other@example.com',
        username: 'otheruser',
        password: 'password123'
      });

      const updateData = { email: 'other@example.com' };
      await expect(userModel.updateUser(testUser._id, updateData)).rejects.toThrow(DuplicateKeyError);
    });
  });

  describe('Password Updates', () => {
    let testUser: any;
    const currentPassword = 'password123';

    beforeEach(async () => {
      testUser = await userModel.createUser({
        email: 'password@example.com',
        username: 'passworduser',
        password: currentPassword
      });
    });

    it('should update password with correct current password', async () => {
      const newPassword = 'newpassword123';
      
      await userModel.updatePassword(testUser._id, currentPassword, newPassword);
      
      // Verify old password no longer works
      const oldAuth = await userModel.authenticate('password@example.com', currentPassword);
      expect(oldAuth).toBeNull();
      
      // Verify new password works
      const newAuth = await userModel.authenticate('password@example.com', newPassword);
      expect(newAuth).toBeTruthy();
    });

    it('should reject password update with incorrect current password', async () => {
      await expect(
        userModel.updatePassword(testUser._id, 'wrongpassword', 'newpassword123')
      ).rejects.toThrow(ValidationError);
    });

    it('should reject weak new password', async () => {
      await expect(
        userModel.updatePassword(testUser._id, currentPassword, '123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(
        userModel.updatePassword(new ObjectId(), currentPassword, 'newpassword123')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('User Deletion', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await userModel.createUser({
        email: 'delete@example.com',
        username: 'deleteuser',
        password: 'password123'
      });
    });

    it('should delete user successfully', async () => {
      await userModel.deleteUser(testUser._id);
      
      const found = await userModel.findById(testUser._id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(userModel.deleteUser(new ObjectId())).rejects.toThrow(NotFoundError);
    });
  });

  describe('Existence Checks', () => {
    beforeEach(async () => {
      await userModel.createUser({
        email: 'exists@example.com',
        username: 'existsuser',
        password: 'password123'
      });
    });

    it('should check email existence correctly', async () => {
      const exists = await userModel.emailExists('exists@example.com');
      expect(exists).toBe(true);
      
      const notExists = await userModel.emailExists('notexists@example.com');
      expect(notExists).toBe(false);
    });

    it('should check username existence correctly', async () => {
      const exists = await userModel.usernameExists('existsuser');
      expect(exists).toBe(true);
      
      const notExists = await userModel.usernameExists('notexistsuser');
      expect(notExists).toBe(false);
    });
  });

  describe('UserRepository', () => {
    it('should provide the same functionality through repository pattern', async () => {
      const userData = {
        email: 'repo@example.com',
        username: 'repouser',
        password: 'password123'
      };

      // Test creation through repository
      const user = await userRepository.create(userData);
      expect(user.email).toBe(userData.email);

      // Test authentication through repository
      const authenticated = await userRepository.authenticate(userData.email, userData.password);
      expect(authenticated).toBeTruthy();

      // Test update through repository
      const updated = await userRepository.update(user._id.toString(), {
        profile: { firstName: 'Repo' }
      });
      expect(updated.profile.firstName).toBe('Repo');

      // Test static methods
      const hash = await UserRepository.hashPassword('testpass');
      expect(hash).toBeTruthy();
      
      const isValid = await UserRepository.verifyPassword('testpass', hash);
      expect(isValid).toBe(true);
    });
  });
});