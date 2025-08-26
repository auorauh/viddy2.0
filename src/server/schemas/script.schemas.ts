import { z } from 'zod';
import { ContentType, ScriptStatus } from '../../lib/database/types';

// Base schemas for reusable components
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

const contentTypeSchema = z.nativeEnum(ContentType);
const scriptStatusSchema = z.nativeEnum(ScriptStatus);

const scriptVersionSchema = z.object({
  version: z.number().int().positive(),
  content: z.string(),
  createdAt: z.date()
});

const scriptMetadataSchema = z.object({
  contentType: contentTypeSchema,
  duration: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
  status: scriptStatusSchema.default(ScriptStatus.DRAFT)
});

// Create script schema
export const createScriptSchema = z.object({
  projectId: objectIdSchema,
  folderId: z.string().min(1, 'Folder ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  metadata: scriptMetadataSchema
});

// Update script schema
export const updateScriptSchema = z.object({
  projectId: objectIdSchema.optional(),
  folderId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  metadata: scriptMetadataSchema.partial().optional()
});

// Update script content schema (for versioning)
export const updateScriptContentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  metadata: scriptMetadataSchema.partial().optional()
});

// Move script schema
export const moveScriptSchema = z.object({
  projectId: objectIdSchema,
  folderId: z.string().min(1, 'Folder ID is required')
});

// Bulk update status schema
export const bulkUpdateStatusSchema = z.object({
  scriptIds: z.array(objectIdSchema).min(1, 'At least one script ID is required'),
  status: scriptStatusSchema
});

// Revert to version schema
export const revertToVersionSchema = z.object({
  version: z.number().int().positive()
});

// Parameter schemas
export const scriptIdParamSchema = z.object({
  id: objectIdSchema
});

export const versionParamSchema = z.object({
  version: z.string().regex(/^\d+$/, 'Version must be a positive integer').transform(Number)
});

// Query schemas
export const scriptQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  skip: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, 'Skip must be non-negative').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),
  sortOrder: z.enum(['1', '-1']).transform(val => val === '1' ? 1 : -1).optional(),
  status: scriptStatusSchema.optional(),
  contentType: contentTypeSchema.optional(),
  projectId: objectIdSchema.optional(),
  folderId: z.string().optional()
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 50, 'Limit must be between 1 and 50').optional(),
  skip: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, 'Skip must be non-negative').optional(),
  projectId: objectIdSchema.optional(),
  status: scriptStatusSchema.optional(),
  contentType: contentTypeSchema.optional()
});

export const folderScriptsQuerySchema = z.object({
  projectId: objectIdSchema,
  folderId: z.string().min(1, 'Folder ID is required'),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  skip: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, 'Skip must be non-negative').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),
  sortOrder: z.enum(['1', '-1']).transform(val => val === '1' ? 1 : -1).optional()
});

// Type exports for use in controllers
export type CreateScriptRequest = z.infer<typeof createScriptSchema>;
export type UpdateScriptRequest = z.infer<typeof updateScriptSchema>;
export type UpdateScriptContentRequest = z.infer<typeof updateScriptContentSchema>;
export type MoveScriptRequest = z.infer<typeof moveScriptSchema>;
export type BulkUpdateStatusRequest = z.infer<typeof bulkUpdateStatusSchema>;
export type RevertToVersionRequest = z.infer<typeof revertToVersionSchema>;
export type ScriptQueryRequest = z.infer<typeof scriptQuerySchema>;
export type SearchQueryRequest = z.infer<typeof searchQuerySchema>;
export type FolderScriptsQueryRequest = z.infer<typeof folderScriptsQuerySchema>;