/**
 * API type definitions for frontend data layer
 */

export interface User {
  _id: string;
  email: string;
  username: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  preferences: {
    defaultProjectView: 'grid' | 'list';
    theme: 'light' | 'dark';
  };
  createdAt: string;
  updatedAt: string;
}

export interface FolderNode {
  id: string;
  name: string;
  parentId?: string;
  children?: FolderNode[];
  scriptCount: number;
  createdAt: string;
}

export interface Project {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  folders: FolderNode[];
  settings: {
    isPublic: boolean;
    allowCollaboration: boolean;
  };
  stats: {
    totalScripts: number;
    lastActivity: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScriptVersion {
  version: number;
  content: string;
  createdAt: string;
}

export interface Script {
  _id: string;
  userId: string;
  projectId: string;
  folderId: string;
  title: string;
  content: string;
  metadata: {
    contentType: 'tiktok' | 'instagram' | 'youtube' | 'general';
    duration?: number;
    tags: string[];
    status: 'draft' | 'review' | 'final' | 'published';
  };
  versions: ScriptVersion[];
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
  };
}

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  preferences?: {
    defaultProjectView?: 'grid' | 'list';
    theme?: 'light' | 'dark';
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  settings?: {
    isPublic?: boolean;
    allowCollaboration?: boolean;
  };
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  settings?: {
    isPublic?: boolean;
    allowCollaboration?: boolean;
  };
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string;
}

export interface CreateScriptRequest {
  projectId: string;
  folderId: string;
  title: string;
  content: string;
  metadata?: {
    contentType?: 'tiktok' | 'instagram' | 'youtube' | 'general';
    duration?: number;
    tags?: string[];
    status?: 'draft' | 'review' | 'final' | 'published';
  };
}

export interface UpdateScriptRequest {
  title?: string;
  projectId?: string;
  folderId?: string;
  metadata?: {
    contentType?: 'tiktok' | 'instagram' | 'youtube' | 'general';
    duration?: number;
    tags?: string[];
    status?: 'draft' | 'review' | 'final' | 'published';
  };
}

export interface UpdateScriptContentRequest {
  content: string;
  metadata?: {
    contentType?: 'tiktok' | 'instagram' | 'youtube' | 'general';
    duration?: number;
    tags?: string[];
    status?: 'draft' | 'review' | 'final' | 'published';
  };
}

export interface MoveScriptRequest {
  projectId: string;
  folderId: string;
}

// Query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectQueryParams extends PaginationParams, SortParams {
  search?: string;
}

export interface ScriptQueryParams extends PaginationParams, SortParams {
  status?: 'draft' | 'review' | 'final' | 'published';
  contentType?: 'tiktok' | 'instagram' | 'youtube' | 'general';
  folderId?: string;
}

export interface SearchScriptParams extends PaginationParams {
  q: string;
  projectId?: string;
  status?: 'draft' | 'review' | 'final' | 'published';
  contentType?: 'tiktok' | 'instagram' | 'youtube' | 'general';
}

// Response types
export interface UserStats {
  totalProjects: number;
  totalScripts: number;
  recentActivity: string;
}

export interface ProjectStats {
  totalScripts: number;
  scriptsByStatus: Record<string, number>;
  scriptsByContentType: Record<string, number>;
  lastActivity: string;
}

export interface ScriptStats {
  totalScripts: number;
  scriptsByStatus: Record<string, number>;
  scriptsByContentType: Record<string, number>;
  averageDuration: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}