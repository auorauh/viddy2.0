import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { ContentType, ScriptStatus, ProjectView, Theme } from './types';

// Custom Zod schema for ObjectId
const objectIdSchema = z.custom<ObjectId>((val) => {
  return val instanceof ObjectId || ObjectId.isValid(val);
}, {
  message: "Invalid ObjectId"
});

// Enum schemas
export const contentTypeSchema = z.nativeEnum(ContentType);
export const scriptStatusSchema = z.nativeEnum(ScriptStatus);
export const projectViewSchema = z.nativeEnum(ProjectView);
export const themeSchema = z.nativeEnum(Theme);

// User profile schema
export const userProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional()
});

// User preferences schema
export const userPreferencesSchema = z.object({
  defaultProjectView: projectViewSchema,
  theme: themeSchema
});

// User schema
export const userSchema = z.object({
  _id: objectIdSchema,
  email: z.string().email().max(255),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, {
    message: "Username can only contain letters, numbers, underscores, and hyphens"
  }),
  passwordHash: z.string().min(1),
  profile: userProfileSchema,
  preferences: userPreferencesSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});

// FolderNode schema (recursive)
export const folderNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
  children: z.array(folderNodeSchema).optional(),
  scriptCount: z.number().int().min(0),
  createdAt: z.date()
}));

// Project settings schema
export const projectSettingsSchema = z.object({
  isPublic: z.boolean(),
  allowCollaboration: z.boolean()
});

// Project stats schema
export const projectStatsSchema = z.object({
  totalScripts: z.number().int().min(0),
  lastActivity: z.date()
});

// Project schema
export const projectSchema = z.object({
  _id: objectIdSchema,
  userId: objectIdSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  folders: z.array(folderNodeSchema),
  settings: projectSettingsSchema,
  stats: projectStatsSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});

// Script metadata schema
export const scriptMetadataSchema = z.object({
  contentType: contentTypeSchema,
  duration: z.number().int().min(0).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20),
  status: scriptStatusSchema
});

// Script version schema
export const scriptVersionSchema = z.object({
  version: z.number().int().min(1),
  content: z.string(),
  createdAt: z.date()
});

// Script schema
export const scriptSchema = z.object({
  _id: objectIdSchema,
  userId: objectIdSchema,
  projectId: objectIdSchema,
  folderId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string(),
  metadata: scriptMetadataSchema,
  versions: z.array(scriptVersionSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Input schemas for creation (without _id, timestamps)
export const createUserInputSchema = userSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true
});

export const createProjectInputSchema = projectSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
  stats: true
}).extend({
  stats: projectStatsSchema.partial()
});

export const createScriptInputSchema = scriptSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
  versions: true
}).extend({
  versions: z.array(scriptVersionSchema).optional()
});

// Update schemas (all fields optional except required ones)
export const updateUserInputSchema = userSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true
}).partial().extend({
  email: z.string().email().max(255).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional()
});

export const updateProjectInputSchema = projectSchema.omit({
  _id: true,
  userId: true,
  createdAt: true,
  updatedAt: true
}).partial();

export const updateScriptInputSchema = scriptSchema.omit({
  _id: true,
  userId: true,
  createdAt: true,
  updatedAt: true
}).partial().extend({
  metadata: scriptMetadataSchema.partial().optional()
});

// Type exports for the schemas
export type UserInput = z.infer<typeof createUserInputSchema>;
export type ProjectInput = z.infer<typeof createProjectInputSchema>;
export type ScriptInput = z.infer<typeof createScriptInputSchema>;
export type UserUpdateInput = z.infer<typeof updateUserInputSchema>;
export type ProjectUpdateInput = z.infer<typeof updateProjectInputSchema>;
export type ScriptUpdateInput = z.infer<typeof updateScriptInputSchema>;