import { z } from 'zod';

// Registration schema
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
  profile: z.object({
    firstName: z.string().max(50, 'First name must be less than 50 characters').optional(),
    lastName: z.string().max(50, 'Last name must be less than 50 characters').optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional()
  }).optional(),
  preferences: z.object({
    defaultProjectView: z.enum(['grid', 'list']).optional(),
    theme: z.enum(['light', 'dark']).optional()
  }).optional()
});

// Login schema
export const loginSchema = z.object({
  identifier: z.string()
    .min(1, 'Email or username is required'),
  password: z.string()
    .min(1, 'Password is required')
});

// Update profile schema
export const updateProfileSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  profile: z.object({
    firstName: z.string().max(50, 'First name must be less than 50 characters').optional(),
    lastName: z.string().max(50, 'Last name must be less than 50 characters').optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional()
  }).optional(),
  preferences: z.object({
    defaultProjectView: z.enum(['grid', 'list']).optional(),
    theme: z.enum(['light', 'dark']).optional()
  }).optional()
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .max(128, 'New password must be less than 128 characters')
});

// User ID parameter schema
export const userIdParamSchema = z.object({
  id: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
});

// Check availability schema
export const checkAvailabilitySchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .optional()
}).refine(data => data.email || data.username, {
  message: 'Either email or username must be provided'
});