/**
 * Example usage of the database service layer
 * This file demonstrates how to use the DatabaseService, DatabaseServiceFactory,
 * DatabaseContainer, and DatabaseUtils classes
 */

import {
  DatabaseService,
  DatabaseServiceFactory,
  DatabaseContainer,
  DatabaseUtils
} from '../services';
import { ContentType, ScriptStatus } from '../types';

/**
 * Example 1: Using DatabaseService singleton
 */
export async function exampleUsingSingleton() {
  // Get the singleton database service instance
  const service = await DatabaseService.getInstance();
  
  // Get individual repositories
  const userRepo = service.getUserRepository();
  const projectRepo = service.getProjectRepository();
  const scriptRepo = service.getScriptRepository();
  
  // Create a user
  const user = await userRepo.create({
    email: 'john@example.com',
    username: 'johndoe',
    password: 'securepassword123',
    profile: {
      firstName: 'John',
      lastName: 'Doe'
    }
  });
  
  // Create a project for the user
  const project = await projectRepo.createProject(user._id, {
    title: 'My Video Series',
    description: 'A collection of educational videos'
  });
  
  // Create a folder in the project
  const folder = await projectRepo.createFolder(project._id, 'Episode 1');
  
  // Create a script in the folder
  const script = await scriptRepo.create({
    userId: user._id,
    projectId: project._id,
    folderId: folder.id,
    title: 'Introduction Script',
    content: 'Welcome to our educational series...',
    metadata: {
      contentType: ContentType.YOUTUBE,
      status: ScriptStatus.DRAFT,
      tags: ['education', 'introduction'],
      duration: 300
    }
  });
  
  console.log('Created user:', user.username);
  console.log('Created project:', project.title);
  console.log('Created script:', script.title);
  
  return { user, project, script };
}

/**
 * Example 2: Using DatabaseServiceFactory
 */
export async function exampleUsingFactory() {
  // Create repositories directly using the factory
  const userRepo = await DatabaseServiceFactory.createUserRepository();
  const projectRepo = await DatabaseServiceFactory.createProjectRepository();
  
  // Or create all repositories at once
  const { userRepository, projectRepository, scriptRepository } = 
    await DatabaseServiceFactory.createAllRepositories();
  
  // Use the repositories
  const user = await userRepository.create({
    email: 'jane@example.com',
    username: 'janedoe',
    password: 'securepassword456'
  });
  
  console.log('Created user via factory:', user.username);
  
  return user;
}

/**
 * Example 3: Using DatabaseContainer for dependency injection
 */
export async function exampleUsingContainer() {
  // Initialize default services in the container
  await DatabaseContainer.initializeDefaults();
  
  // Resolve services from the container
  const userRepo = await DatabaseContainer.resolve('userRepository');
  const projectRepo = await DatabaseContainer.resolve('projectRepository');
  
  // Register custom services
  DatabaseContainer.register('customUserService', async () => {
    const repo = await DatabaseContainer.resolve('userRepository');
    return {
      createUserWithDefaults: async (email: string, username: string) => {
        return repo.create({
          email,
          username,
          password: 'defaultpassword123',
          profile: {
            firstName: 'New',
            lastName: 'User'
          }
        });
      }
    };
  });
  
  // Use the custom service
  const customService = await DatabaseContainer.resolve('customUserService');
  const user = await customService.createUserWithDefaults('custom@example.com', 'customuser');
  
  console.log('Created user via container:', user.username);
  
  return user;
}

/**
 * Example 4: Using DatabaseUtils for initialization and transactions
 */
export async function exampleUsingUtils() {
  // Initialize all database services
  const service = await DatabaseUtils.initialize();
  
  // Perform a transaction-like operation across multiple repositories
  const result = await DatabaseUtils.withTransaction(async ({ userRepository, projectRepository, scriptRepository }) => {
    // Create user
    const user = await userRepository.create({
      email: 'transaction@example.com',
      username: 'transactionuser',
      password: 'password123'
    });
    
    // Create project
    const project = await projectRepository.createProject(user._id, {
      title: 'Transaction Project',
      description: 'Created in a transaction'
    });
    
    // Create script
    const script = await scriptRepository.create({
      userId: user._id,
      projectId: project._id,
      folderId: 'root',
      title: 'Transaction Script',
      content: 'This script was created in a transaction',
      metadata: {
        contentType: ContentType.TIKTOK,
        status: ScriptStatus.DRAFT,
        tags: ['transaction']
      }
    });
    
    return { user, project, script };
  });
  
  console.log('Transaction completed:', {
    user: result.user.username,
    project: result.project.title,
    script: result.script.title
  });
  
  return result;
}

/**
 * Example 5: Health checking and monitoring
 */
export async function exampleHealthCheck() {
  const service = await DatabaseService.getInstance();
  
  // Perform health check
  const health = await service.healthCheck();
  
  console.log('Database health:', health);
  
  if (health.status === 'healthy') {
    console.log('All services are operational');
  } else {
    console.error('Database services are unhealthy:', health.details);
  }
  
  return health;
}

/**
 * Example 6: Repository operations with authentication
 */
export async function exampleAuthenticationFlow() {
  const service = await DatabaseService.getInstance();
  const userRepo = service.getUserRepository();
  
  // Create user
  const user = await userRepo.create({
    email: 'auth@example.com',
    username: 'authuser',
    password: 'mypassword123',
    profile: {
      firstName: 'Auth',
      lastName: 'User'
    }
  });
  
  // Authenticate user
  const authenticatedUser = await userRepo.authenticate('auth@example.com', 'mypassword123');
  
  if (authenticatedUser) {
    console.log('Authentication successful:', authenticatedUser.username);
    
    // Update user profile
    const updatedUser = await userRepo.update(user._id, {
      profile: {
        ...user.profile,
        bio: 'Updated bio through service layer'
      }
    });
    
    console.log('Updated user bio:', updatedUser.profile?.bio);
  } else {
    console.log('Authentication failed');
  }
  
  return authenticatedUser;
}

/**
 * Example 7: Project and folder management
 */
export async function exampleProjectManagement() {
  const service = await DatabaseService.getInstance();
  const { userRepository, projectRepository } = service.getAllRepositories();
  
  // Create user
  const user = await userRepository.create({
    email: 'project@example.com',
    username: 'projectuser',
    password: 'password123'
  });
  
  // Create project
  const project = await projectRepository.createProject(user._id, {
    title: 'Content Series',
    description: 'A series of educational content'
  });
  
  // Create nested folder structure
  const seasonFolder = await projectRepository.createFolder(project._id, 'Season 1');
  const episodeFolder = await projectRepository.createFolder(project._id, 'Episode 1', seasonFolder.id);
  
  // Get project statistics
  const stats = await projectRepository.getProjectStats(project._id);
  
  console.log('Project stats:', stats);
  
  // Search projects
  const searchResults = await projectRepository.searchUserProjects(user._id, 'Content');
  
  console.log('Search results:', searchResults.projects.length);
  
  return { project, seasonFolder, episodeFolder, stats };
}

/**
 * Example 8: Script management with search and filtering
 */
export async function exampleScriptManagement() {
  const service = await DatabaseService.getInstance();
  const { userRepository, projectRepository, scriptRepository } = service.getAllRepositories();
  
  // Create user and project
  const user = await userRepository.create({
    email: 'script@example.com',
    username: 'scriptuser',
    password: 'password123'
  });
  
  const project = await projectRepository.createProject(user._id, {
    title: 'Script Collection'
  });
  
  // Create multiple scripts
  const scripts = await Promise.all([
    scriptRepository.create({
      userId: user._id,
      projectId: project._id,
      folderId: 'root',
      title: 'YouTube Tutorial',
      content: 'How to create amazing content...',
      metadata: {
        contentType: ContentType.YOUTUBE,
        status: ScriptStatus.DRAFT,
        tags: ['tutorial', 'education']
      }
    }),
    scriptRepository.create({
      userId: user._id,
      projectId: project._id,
      folderId: 'root',
      title: 'TikTok Hook',
      content: 'Attention-grabbing opening...',
      metadata: {
        contentType: ContentType.TIKTOK,
        status: ScriptStatus.FINAL,
        tags: ['hook', 'viral']
      }
    })
  ]);
  
  // Search scripts
  const searchResults = await scriptRepository.search(user._id, 'tutorial');
  console.log('Found scripts:', searchResults.length);
  
  // Get scripts by status
  const draftScripts = await scriptRepository.getByStatus(user._id, ScriptStatus.DRAFT);
  console.log('Draft scripts:', draftScripts.length);
  
  // Get user script statistics
  const stats = await scriptRepository.getStats(user._id);
  console.log('Script stats:', stats);
  
  return { scripts, searchResults, stats };
}

/**
 * Example 9: Cleanup and resource management
 */
export async function exampleCleanup() {
  // Perform cleanup
  await DatabaseUtils.cleanup();
  
  console.log('Database services cleaned up');
  
  // Check if services are cleared
  const hasServices = DatabaseContainer.has('databaseService');
  console.log('Services cleared:', !hasServices);
}

// Export all examples for easy testing
export const examples = {
  singleton: exampleUsingSingleton,
  factory: exampleUsingFactory,
  container: exampleUsingContainer,
  utils: exampleUsingUtils,
  healthCheck: exampleHealthCheck,
  authentication: exampleAuthenticationFlow,
  projectManagement: exampleProjectManagement,
  scriptManagement: exampleScriptManagement,
  cleanup: exampleCleanup
};