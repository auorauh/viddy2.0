// Database connection and configuration
export { dbConnection, getDatabase } from './connection';
export { getDatabaseConfig } from './config';
export type { DatabaseConfig } from './config';

// Error handling
export {
  DatabaseError,
  ConnectionError,
  ValidationError,
  DuplicateKeyError,
  NotFoundError,
  handleMongoError,
  isRetryableError,
  withRetry
} from './errors';

// Export types and interfaces
export type {
  User,
  Project,
  Script,
  FolderNode,
  ScriptVersion
} from './types';

export type {
  UserInput,
  ProjectInput,
  ScriptInput,
  UserUpdateInput,
  ProjectUpdateInput,
  ScriptUpdateInput
} from './schemas';

export {
  ContentType,
  ScriptStatus,
  ProjectView,
  Theme
} from './types';

// Export schemas
export {
  userSchema,
  projectSchema,
  scriptSchema,
  folderNodeSchema,
  createUserInputSchema,
  createProjectInputSchema,
  createScriptInputSchema,
  updateUserInputSchema,
  updateProjectInputSchema,
  updateScriptInputSchema,
  contentTypeSchema,
  scriptStatusSchema,
  projectViewSchema,
  themeSchema
} from './schemas';

// Export validation utilities
export {
  isValidObjectId,
  isUser,
  isProject,
  isScript,
  isFolderNode,
  isContentType,
  isScriptStatus,
  isProjectView,
  isTheme,
  validateUser,
  validateProject,
  validateScript,
  validateFolderNode,
  validateCreateUserInput,
  validateCreateProjectInput,
  validateCreateScriptInput,
  validateUpdateUserInput,
  validateUpdateProjectInput,
  validateUpdateScriptInput,
  safeValidateUser,
  safeValidateProject,
  safeValidateScript,
  safeValidateCreateUserInput,
  safeValidateCreateProjectInput,
  safeValidateCreateScriptInput,
  findFolderById,
  validateFolderHierarchy
} from './validation';

// Export models and repositories
export { UserModel } from './models/user';
export { ProjectModel } from './models/project';
export { ScriptModel } from './models/script';
export { UserRepository } from './repositories/user-repository';
export { ProjectRepository } from './repositories/project-repository';
export { ScriptRepository } from './repositories/script-repository';

// Export search and optimization services
export { SearchService } from './search';
export { OptimizationService } from './optimization';

// Export database services and dependency injection
export {
  DatabaseService,
  DatabaseServiceFactory,
  DatabaseContainer,
  DatabaseUtils
} from './services';

// Re-export MongoDB types for convenience
export type { 
  Db, 
  Collection, 
  MongoClient, 
  ObjectId,
  InsertOneResult,
  InsertManyResult,
  UpdateResult,
  DeleteResult,
  FindOptions,
  UpdateOptions,
  DeleteOptions
} from 'mongodb';