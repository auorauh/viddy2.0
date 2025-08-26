import { ObjectId } from 'mongodb';
import { 
  User, 
  Project, 
  Script, 
  FolderNode,
  ContentType,
  ScriptStatus,
  ProjectView,
  Theme
} from './types';
import {
  userSchema,
  projectSchema,
  scriptSchema,
  folderNodeSchema,
  createUserInputSchema,
  createProjectInputSchema,
  createScriptInputSchema,
  updateUserInputSchema,
  updateProjectInputSchema,
  updateScriptInputSchema
} from './schemas';

// Type guards
export function isValidObjectId(id: any): id is ObjectId {
  return id instanceof ObjectId || ObjectId.isValid(id);
}

export function isUser(obj: any): obj is User {
  return userSchema.safeParse(obj).success;
}

export function isProject(obj: any): obj is Project {
  return projectSchema.safeParse(obj).success;
}

export function isScript(obj: any): obj is Script {
  return scriptSchema.safeParse(obj).success;
}

export function isFolderNode(obj: any): obj is FolderNode {
  return folderNodeSchema.safeParse(obj).success;
}

export function isContentType(value: any): value is ContentType {
  return Object.values(ContentType).includes(value);
}

export function isScriptStatus(value: any): value is ScriptStatus {
  return Object.values(ScriptStatus).includes(value);
}

export function isProjectView(value: any): value is ProjectView {
  return Object.values(ProjectView).includes(value);
}

export function isTheme(value: any): value is Theme {
  return Object.values(Theme).includes(value);
}

// Validation functions
export function validateUser(data: unknown) {
  return userSchema.parse(data);
}

export function validateProject(data: unknown) {
  return projectSchema.parse(data);
}

export function validateScript(data: unknown) {
  return scriptSchema.parse(data);
}

export function validateFolderNode(data: unknown) {
  return folderNodeSchema.parse(data);
}

// Input validation functions
export function validateCreateUserInput(data: unknown) {
  return createUserInputSchema.parse(data);
}

export function validateCreateProjectInput(data: unknown) {
  return createProjectInputSchema.parse(data);
}

export function validateCreateScriptInput(data: unknown) {
  return createScriptInputSchema.parse(data);
}

export function validateUpdateUserInput(data: unknown) {
  return updateUserInputSchema.parse(data);
}

export function validateUpdateProjectInput(data: unknown) {
  return updateProjectInputSchema.parse(data);
}

export function validateUpdateScriptInput(data: unknown) {
  return updateScriptInputSchema.parse(data);
}

// Safe validation functions (returns result object instead of throwing)
export function safeValidateUser(data: unknown) {
  return userSchema.safeParse(data);
}

export function safeValidateProject(data: unknown) {
  return projectSchema.safeParse(data);
}

export function safeValidateScript(data: unknown) {
  return scriptSchema.safeParse(data);
}

export function safeValidateCreateUserInput(data: unknown) {
  return createUserInputSchema.safeParse(data);
}

export function safeValidateCreateProjectInput(data: unknown) {
  return createProjectInputSchema.safeParse(data);
}

export function safeValidateCreateScriptInput(data: unknown) {
  return createScriptInputSchema.safeParse(data);
}

// Utility functions for working with folder hierarchies
export function findFolderById(folders: FolderNode[], folderId: string): FolderNode | null {
  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder;
    }
    if (folder.children) {
      const found = findFolderById(folder.children, folderId);
      if (found) return found;
    }
  }
  return null;
}

export function validateFolderHierarchy(folders: FolderNode[]): boolean {
  const folderIds = new Set<string>();
  
  function validateNode(node: FolderNode, parentId?: string): boolean {
    // Check for duplicate IDs
    if (folderIds.has(node.id)) {
      return false;
    }
    folderIds.add(node.id);
    
    // Check parent reference consistency
    if (node.parentId !== parentId) {
      return false;
    }
    
    // Validate children recursively
    if (node.children) {
      for (const child of node.children) {
        if (!validateNode(child, node.id)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Validate root level folders (no parent)
  for (const folder of folders) {
    if (!validateNode(folder)) {
      return false;
    }
  }
  
  return true;
}