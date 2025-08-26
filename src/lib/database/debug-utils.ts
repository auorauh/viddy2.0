/**
 * Debug utilities for troubleshooting database issues
 */

import { ObjectId } from 'mongodb';
import { getDatabase } from './connection';
import { ProjectRepository } from './repositories/project-repository';
import { ProjectModel } from './models/project';

export class DatabaseDebugger {
  private getProjectRepository(): ProjectRepository {
    const db = getDatabase();
    return new ProjectRepository(new ProjectModel(db));
  }

  /**
   * Check if a project ID is valid and exists
   */
  async debugProjectId(projectId: string): Promise<{
    isValidObjectId: boolean;
    exists: boolean;
    project?: any;
    error?: string;
  }> {
    try {
      // Check if it's a valid ObjectId format
      const isValidObjectId = ObjectId.isValid(projectId);
      
      if (!isValidObjectId) {
        return {
          isValidObjectId: false,
          exists: false,
          error: 'Invalid ObjectId format. Must be a 24-character hex string.'
        };
      }

      // Try to find the project
      const projectRepo = this.getProjectRepository();
      const project = await projectRepo.getProjectById(projectId);
      
      return {
        isValidObjectId: true,
        exists: true,
        project: {
          _id: project._id,
          title: project.title,
          userId: project.userId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }
      };
    } catch (error: any) {
      return {
        isValidObjectId: ObjectId.isValid(projectId),
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * List all projects in the database
   */
  async listAllProjects(): Promise<{
    total: number;
    projects: Array<{
      _id: string;
      title: string;
      userId: string;
      createdAt: Date;
    }>;
  }> {
    try {
      const db = getDatabase();
      const collection = db.collection('projects');
      
      const projects = await collection.find({}, {
        projection: {
          _id: 1,
          title: 1,
          userId: 1,
          createdAt: 1
        }
      }).toArray();

      return {
        total: projects.length,
        projects: projects.map(p => ({
          _id: p._id.toString(),
          title: p.title,
          userId: p.userId.toString(),
          createdAt: p.createdAt
        }))
      };
    } catch (error: any) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }
  }

  /**
   * Check database connection and collections
   */
  async checkDatabaseHealth(): Promise<{
    connected: boolean;
    collections: string[];
    projectsCount: number;
    usersCount: number;
    scriptsCount: number;
  }> {
    try {
      const db = getDatabase();
      
      // Test connection
      await db.admin().ping();
      
      // List collections
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      // Count documents in each collection
      const projectsCount = await db.collection('projects').countDocuments();
      const usersCount = await db.collection('users').countDocuments();
      const scriptsCount = await db.collection('scripts').countDocuments();
      
      return {
        connected: true,
        collections: collectionNames,
        projectsCount,
        usersCount,
        scriptsCount
      };
    } catch (error: any) {
      throw new Error(`Database health check failed: ${error.message}`);
    }
  }

  /**
   * Create sample data for testing
   */
  async createSampleData(): Promise<{
    user: any;
    project: any;
    message: string;
  }> {
    try {
      const db = getDatabase();
      
      // Create a sample user
      const sampleUser = {
        _id: new ObjectId(),
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        preferences: {
          defaultProjectView: 'grid' as const,
          theme: 'light' as const
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').insertOne(sampleUser);

      // Create a sample project
      const projectRepo = this.getProjectRepository();
      const sampleProject = await projectRepo.createProject(sampleUser._id, {
        title: 'Sample Project',
        description: 'A sample project for testing'
      });

      return {
        user: {
          _id: sampleUser._id.toString(),
          email: sampleUser.email,
          username: sampleUser.username
        },
        project: {
          _id: sampleProject._id.toString(),
          title: sampleProject.title,
          userId: sampleProject.userId.toString()
        },
        message: 'Sample data created successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to create sample data: ${error.message}`);
    }
  }
}

export const dbDebugger = new DatabaseDebugger();