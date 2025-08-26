/**
 * Database seeding utilities for development and testing
 */

import { ObjectId } from 'mongodb';
import { getDatabase } from './connection';
import { ProjectRepository } from './repositories/project-repository';
import { ProjectModel } from './models/project';
import { UserRepository } from './repositories/user-repository';
import { UserModel } from './models/user';

export interface SeedOptions {
  clearExisting?: boolean;
  userCount?: number;
  projectsPerUser?: number;
}

export class DatabaseSeeder {
  private getUserRepository(): UserRepository {
    const db = getDatabase();
    return new UserRepository(new UserModel(db));
  }

  private getProjectRepository(): ProjectRepository {
    const db = getDatabase();
    return new ProjectRepository(new ProjectModel(db));
  }

  /**
   * Seed the database with sample data
   */
  async seedDatabase(options: SeedOptions = {}): Promise<{
    users: any[];
    projects: any[];
    message: string;
  }> {
    const {
      clearExisting = false,
      userCount = 3,
      projectsPerUser = 2
    } = options;

    try {
      const db = getDatabase();

      // Clear existing data if requested
      if (clearExisting) {
        await db.collection('users').deleteMany({});
        await db.collection('projects').deleteMany({});
        await db.collection('scripts').deleteMany({});
        console.log('Cleared existing data');
      }

      const userRepo = this.getUserRepository();
      const projectRepo = this.getProjectRepository();

      const users: any[] = [];
      const projects: any[] = [];

      // Create sample users
      for (let i = 1; i <= userCount; i++) {
        const userData = {
          email: `user${i}@example.com`,
          username: `user${i}`,
          password: 'password123',
          profile: {
            firstName: `User`,
            lastName: `${i}`,
            bio: `Sample user ${i} for testing`
          }
        };

        const user = await userRepo.createUser(userData);
        users.push({
          _id: user._id.toString(),
          email: user.email,
          username: user.username
        });

        // Create projects for each user
        for (let j = 1; j <= projectsPerUser; j++) {
          const projectData = {
            title: `Project ${j} by ${user.username}`,
            description: `Sample project ${j} created by ${user.username}`,
            settings: {
              isPublic: j % 2 === 0, // Make every second project public
              allowCollaboration: true
            }
          };

          const project = await projectRepo.createProject(user._id, projectData);
          projects.push({
            _id: project._id.toString(),
            title: project.title,
            userId: project.userId.toString(),
            userName: user.username
          });
        }
      }

      return {
        users,
        projects,
        message: `Successfully seeded database with ${users.length} users and ${projects.length} projects`
      };
    } catch (error: any) {
      throw new Error(`Failed to seed database: ${error.message}`);
    }
  }

  /**
   * Create a specific user and project for testing
   */
  async createTestUserAndProject(): Promise<{
    user: any;
    project: any;
    message: string;
  }> {
    try {
      const userRepo = this.getUserRepository();
      const projectRepo = this.getProjectRepository();

      // Create test user
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          bio: 'Test user for debugging'
        }
      };

      const user = await userRepo.createUser(userData);

      // Create test project
      const projectData = {
        title: 'Test Project',
        description: 'A test project for debugging the 404 issue',
        settings: {
          isPublic: false,
          allowCollaboration: true
        }
      };

      const project = await projectRepo.createProject(user._id, projectData);

      return {
        user: {
          _id: user._id.toString(),
          email: user.email,
          username: user.username
        },
        project: {
          _id: project._id.toString(),
          title: project.title,
          userId: project.userId.toString()
        },
        message: `Created test user and project. Project ID: ${project._id.toString()}`
      };
    } catch (error: any) {
      throw new Error(`Failed to create test data: ${error.message}`);
    }
  }

  /**
   * Check if the problematic project ID exists and get info about it
   */
  async checkProjectId(projectId: string): Promise<{
    exists: boolean;
    isValidFormat: boolean;
    project?: any;
    error?: string;
  }> {
    try {
      // Check if it's a valid ObjectId format
      const isValidFormat = ObjectId.isValid(projectId);
      
      if (!isValidFormat) {
        return {
          exists: false,
          isValidFormat: false,
          error: 'Invalid ObjectId format'
        };
      }

      const db = getDatabase();
      const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });

      if (!project) {
        return {
          exists: false,
          isValidFormat: true,
          error: 'Project not found in database'
        };
      }

      return {
        exists: true,
        isValidFormat: true,
        project: {
          _id: project._id.toString(),
          title: project.title,
          userId: project.userId.toString(),
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }
      };
    } catch (error: any) {
      return {
        exists: false,
        isValidFormat: ObjectId.isValid(projectId),
        error: error.message
      };
    }
  }
}

export const dbSeeder = new DatabaseSeeder();