import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../../lib/database/connection';
import { UserRepository } from '../../lib/database/repositories/user-repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  private getUserRepository(): UserRepository {
    const db = getDatabase();
    return new UserRepository(db);
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body;

      // Create user
      const user = await this.getUserRepository().create(userData);

      // Generate JWT token
      const token = this.generateToken(user._id.toString());

      // Set cookie
      this.setAuthCookie(res, token);

      // Return user data (without password)
      const { passwordHash, ...userResponse } = user;
      
      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
        token
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { identifier, password } = req.body;

      // Authenticate user
      const user = await this.getUserRepository().authenticate(identifier, password);

      if (!user) {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email/username or password'
          }
        });
        return;
      }

      // Generate JWT token
      const token = this.generateToken(user._id.toString());

      // Set cookie
      this.setAuthCookie(res, token);

      // Return user data (without password)
      const { passwordHash, ...userResponse } = user;

      res.status(200).json({
        message: 'Login successful',
        user: userResponse,
        token
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Clear auth cookie
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const user = await this.getUserRepository().findById(req.user.id);

      if (!user) {
        res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }

      // Return user data (without password)
      const { passwordHash, ...userResponse } = user;

      res.status(200).json({
        user: userResponse
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const updateData = req.body;

      // Update user
      const updatedUser = await this.getUserRepository().update(req.user.id, updateData);

      // Return updated user data (without password)
      const { passwordHash, ...userResponse } = updatedUser;

      res.status(200).json({
        message: 'Profile updated successfully',
        user: userResponse
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change user password
   */
  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Update password
      await this.getUserRepository().updatePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user account
   */
  deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      // Delete user
      await this.getUserRepository().delete(req.user.id);

      // Clear auth cookie
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check email/username availability
   */
  checkAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username } = req.body;
      const availability: { email?: boolean; username?: boolean } = {};

      if (email) {
        const emailExists = await this.getUserRepository().emailExists(email);
        availability.email = !emailExists;
      }

      if (username) {
        const usernameExists = await this.getUserRepository().usernameExists(username);
        availability.username = !usernameExists;
      }

      res.status(200).json({
        available: availability
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user statistics
   */
  getStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const stats = await this.getUserRepository().getStats(req.user.id);

      res.status(200).json({
        stats
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh authentication token
   */
  refreshToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      // Generate new token
      const token = this.generateToken(req.user.id);

      // Set new cookie
      this.setAuthCookie(res, token);

      res.status(200).json({
        message: 'Token refreshed successfully',
        token
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate JWT token
   */
  private generateToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    return jwt.sign(
      { userId },
      jwtSecret,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'video-content-app',
        audience: 'video-content-users'
      }
    );
  }

  /**
   * Set authentication cookie
   */
  private setAuthCookie(res: Response, token: string): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });
  }
}