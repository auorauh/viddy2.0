/**
 * User API service
 */

import { apiClient } from '../client';
import type {
  User,
  CreateUserRequest,
  LoginRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserStats,
} from '../types';

export class UserService {
  /**
   * Register a new user
   */
  async register(userData: CreateUserRequest): Promise<{ user: User; token: string }> {
    const response = await apiClient.post('/users/register', userData);
    
    // The server returns { message, user, token } directly
    if (!response || !response.user || !response.token) {
      console.error('Invalid register response:', response);
      throw new Error('Invalid response from server');
    }
    
    return { user: response.user, token: response.token };
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    const response = await apiClient.post('/users/login', credentials);
    
    // The server returns { message, user, token } directly
    if (!response || !response.user || !response.token) {
      console.error('Invalid login response:', response);
      throw new Error('Invalid response from server');
    }
    
    return { user: response.user, token: response.token };
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiClient.post('/users/logout');
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/users/profile');
    if (!response || !response.user) {
      throw new Error('Invalid profile response from server');
    }
    return response.user;
  }

  /**
   * Update user profile
   */
  async updateProfile(updateData: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put('/users/profile', updateData);
    if (!response || !response.user) {
      throw new Error('Invalid update profile response from server');
    }
    return response.user;
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    await apiClient.put('/users/password', passwordData);
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/account');
  }

  /**
   * Check email/username availability
   */
  async checkAvailability(data: { email?: string; username?: string }): Promise<{
    available: { email?: boolean; username?: boolean };
  }> {
    const response = await apiClient.post('/users/check-availability', data);
    if (!response || !response.available) {
      throw new Error('Invalid availability response from server');
    }
    return response;
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStats> {
    const response = await apiClient.get('/users/stats');
    if (!response || !response.stats) {
      throw new Error('Invalid stats response from server');
    }
    return response.stats;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    const response = await apiClient.post('/users/refresh-token');
    if (!response || !response.token) {
      throw new Error('Invalid refresh token response from server');
    }
    return response.token;
  }
}

export const userService = new UserService();