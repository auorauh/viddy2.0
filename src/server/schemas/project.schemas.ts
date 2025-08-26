import { z } from 'zod';

// Project creation schema
export const createProjectSchema = z.object({
  title: z.string()
    .min(1, 'Project title is required')
    .max(100, 'Project title must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Project description must be less than 500 characters')
    .optional(),
  settings: z.object({
    isPublic: z.boolean().default(false),
    allowCollaboration: z.boolean().default(false)
  }).optional()
});

// Project update schema
export const updateProjectSchema = z.object({
  title: z.string()
    .min(1, 'Project title is required')
    .max(100, 'Project title must be less than 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Project description must be less than 500 characters')
    .optional(),
  settings: z.object({
    isPublic: z.boolean().optional(),
    allowCollaboration: z.boolean().optional()
  }).optional()
});

// Project ID parameter schema
export const projectIdParamSchema = z.object({
  id: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid project ID format')
});

// Project query parameters schema
export const projectQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a positive number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Page must be greater than 0')
    .optional(),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a positive number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string()
    .max(100, 'Search query must be less than 100 characters')
    .optional()
});

// Folder creation schema
export const createFolderSchema = z.object({
  name: z.string()
    .min(1, 'Folder name is required')
    .max(50, 'Folder name must be less than 50 characters')
    .trim(),
  parentId: z.string()
    .regex(/^[0-9a-fA-F-]{36}$/, 'Invalid parent folder ID format')
    .optional()
});

// Folder update schema
export const updateFolderSchema = z.object({
  name: z.string()
    .min(1, 'Folder name is required')
    .max(50, 'Folder name must be less than 50 characters')
    .trim()
});

// Folder ID parameter schema
export const folderIdParamSchema = z.object({
  folderId: z.string()
    .regex(/^[0-9a-fA-F-]{36}$/, 'Invalid folder ID format')
});

// Project sharing schema
export const shareProjectSchema = z.object({
  userEmail: z.string()
    .email('Invalid email format')
    .min(1, 'User email is required'),
  permission: z.enum(['read', 'write', 'admin']).default('read')
});

// Collaboration settings schema
export const collaborationSettingsSchema = z.object({
  allowCollaboration: z.boolean(),
  isPublic: z.boolean().optional(),
  collaborators: z.array(z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
    permission: z.enum(['read', 'write', 'admin'])
  })).optional()
});