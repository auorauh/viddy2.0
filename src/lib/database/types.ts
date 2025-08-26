import { ObjectId } from 'mongodb';

// Enum types for content types, statuses, and preferences
export enum ContentType {
  TIKTOK = 'tiktok',
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  GENERAL = 'general'
}

export enum ScriptStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  FINAL = 'final',
  PUBLISHED = 'published'
}

export enum ProjectView {
  GRID = 'grid',
  LIST = 'list'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

// Core interfaces
export interface User {
  _id: ObjectId;
  email: string;
  username: string;
  passwordHash: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  preferences: {
    defaultProjectView: ProjectView;
    theme: Theme;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderNode {
  id: string; // UUID for folder identification
  name: string;
  parentId?: string; // Reference to parent folder
  children?: FolderNode[]; // Nested folder structure
  scriptCount: number;
  createdAt: Date;
}

export interface Project {
  _id: ObjectId;
  userId: ObjectId; // Reference to User
  title: string;
  description?: string;
  folders: FolderNode[]; // Embedded folder hierarchy
  settings: {
    isPublic: boolean;
    allowCollaboration: boolean;
  };
  stats: {
    totalScripts: number;
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ScriptVersion {
  version: number;
  content: string;
  createdAt: Date;
}

export interface Script {
  _id: ObjectId;
  userId: ObjectId; // Reference to User
  projectId: ObjectId; // Reference to Project
  folderId: string; // Reference to folder within project
  title: string;
  content: string;
  metadata: {
    contentType: ContentType;
    duration?: number; // estimated duration in seconds
    tags: string[];
    status: ScriptStatus;
  };
  versions: ScriptVersion[];
  createdAt: Date;
  updatedAt: Date;
}

// Input types for creation (without _id, timestamps)
export interface UserInput {
  email: string;
  username: string;
  passwordHash: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  preferences: {
    defaultProjectView: ProjectView;
    theme: Theme;
  };
}

export interface ProjectInput {
  userId: ObjectId;
  title: string;
  description?: string;
  folders: FolderNode[];
  settings: {
    isPublic: boolean;
    allowCollaboration: boolean;
  };
  stats?: {
    totalScripts: number;
    lastActivity: Date;
  };
}

export interface ScriptInput {
  userId: ObjectId;
  projectId: ObjectId;
  folderId: string;
  title: string;
  content: string;
  metadata: {
    contentType: ContentType;
    duration?: number;
    tags: string[];
    status: ScriptStatus;
  };
  versions?: ScriptVersion[];
}

// Update types (all fields optional)
export interface UserUpdateInput {
  email?: string;
  username?: string;
  passwordHash?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  preferences?: {
    defaultProjectView?: ProjectView;
    theme?: Theme;
  };
}

export interface ProjectUpdateInput {
  title?: string;
  description?: string;
  folders?: FolderNode[];
  settings?: {
    isPublic?: boolean;
    allowCollaboration?: boolean;
  };
  stats?: {
    totalScripts?: number;
    lastActivity?: Date;
  };
}

export interface ScriptUpdateInput {
  projectId?: ObjectId;
  folderId?: string;
  title?: string;
  content?: string;
  metadata?: {
    contentType?: ContentType;
    duration?: number;
    tags?: string[];
    status?: ScriptStatus;
  };
  versions?: ScriptVersion[];
}