import { Db } from 'mongodb';
import { UserModel } from '../models/user';
import { User, UserInput, UserUpdateInput } from '../types';
import { DatabaseLogger } from '../../logging/database-logger';

/**
 * Repository pattern for User operations
 * Provides a clean interface for user-related database operations
 */
export class UserRepository {
  private userModel: UserModel;

  constructor(db: Db) {
    this.userModel = new UserModel(db);
  }

  /**
   * Create a new user
   */
  async create(userData: Omit<UserInput, 'passwordHash'> & { password: string }): Promise<User> {
    return DatabaseLogger.withLogging(
      'users',
      'create',
      () => this.userModel.createUser(userData),
      {
        metadata: {
          email: userData.email,
          username: userData.username
        }
      }
    );
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return DatabaseLogger.withLogging(
      'users',
      'findById',
      () => this.userModel.findById(id),
      {
        metadata: { userId: id }
      }
    );
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findByEmail(email);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findByUsername(username);
  }

  /**
   * Authenticate user
   */
  async authenticate(identifier: string, password: string): Promise<User | null> {
    return DatabaseLogger.withLogging(
      'users',
      'authenticate',
      () => this.userModel.authenticate(identifier, password),
      {
        metadata: { identifier }
      }
    );
  }

  /**
   * Update user
   */
  async update(id: string, updateData: UserUpdateInput): Promise<User> {
    return this.userModel.updateUser(id, updateData);
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    return this.userModel.updatePassword(id, currentPassword, newPassword);
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    return this.userModel.deleteUser(id);
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    return this.userModel.emailExists(email);
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    return this.userModel.usernameExists(username);
  }

  /**
   * Get user statistics
   */
  async getStats(id: string): Promise<{ projectCount: number; scriptCount: number }> {
    return this.userModel.getUserStats(id);
  }

  /**
   * Hash password utility
   */
  static hashPassword(password: string): Promise<string> {
    return UserModel.hashPassword(password);
  }

  /**
   * Verify password utility
   */
  static verifyPassword(password: string, hash: string): Promise<boolean> {
    return UserModel.verifyPassword(password, hash);
  }
}