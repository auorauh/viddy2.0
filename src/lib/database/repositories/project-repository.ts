import { ObjectId } from 'mongodb';
import { ProjectModel } from '../models/project';
import { Project, ProjectInput, ProjectUpdateInput, FolderNode } from '../types';
import { ValidationError, NotFoundError, DatabaseError } from '../errors';

export class ProjectRepository {
  constructor(private projectModel: ProjectModel) {}

  /**
   * Create a new project for a user
   */
  async createProject(
    userId: string | ObjectId,
    projectData: Omit<ProjectInput, 'userId'>
  ): Promise<Project> {
    try {
      const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      
      return await this.projectModel.createProject({
        ...projectData,
        userId: userObjectId
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * Get a project by ID
   */
  async getProjectById(projectId: string | ObjectId): Promise<Project> {
    try {
      const project = await this.projectModel.findById(projectId);
      
      if (!project) {
        const id = typeof projectId === 'string' ? projectId : projectId.toString();
        throw new NotFoundError('Project', id);
      }
      
      return project;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get project: ${error.message}`);
    }
  }

  /**
   * Get all projects for a user with pagination and sorting
   */
  async getUserProjects(
    userId: string | ObjectId,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ projects: Project[]; total: number; page: number; limit: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = options || {};

      const skip = (page - 1) * limit;
      const sortOrderValue = sortOrder === 'asc' ? 1 : -1;

      const projects = await this.projectModel.findByUserId(userId, {
        skip,
        limit,
        sortBy,
        sortOrder: sortOrderValue
      });

      // Note: In a real implementation, you'd want to get the total count
      // For now, we'll return the projects length as a placeholder
      const total = projects.length;

      return {
        projects,
        total,
        page,
        limit
      };
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get user projects: ${error.message}`);
    }
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string | ObjectId,
    updateData: ProjectUpdateInput
  ): Promise<Project> {
    try {
      return await this.projectModel.updateProject(projectId, updateData);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update project: ${error.message}`);
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string | ObjectId): Promise<void> {
    try {
      await this.projectModel.deleteProject(projectId);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Search projects for a user
   */
  async searchUserProjects(
    userId: string | ObjectId,
    searchText: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ projects: Project[]; total: number; page: number; limit: number }> {
    try {
      const { page = 1, limit = 20 } = options || {};
      const skip = (page - 1) * limit;

      const projects = await this.projectModel.searchProjects(userId, searchText, {
        skip,
        limit
      });

      return {
        projects,
        total: projects.length,
        page,
        limit
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to search projects: ${error.message}`);
    }
  }

  /**
   * Create a new folder in a project
   */
  async createFolder(
    projectId: string | ObjectId,
    folderName: string,
    parentId?: string
  ): Promise<FolderNode> {
    try {
      if (!folderName.trim()) {
        throw new ValidationError('Folder name cannot be empty');
      }

      return await this.projectModel.addFolder(projectId, folderName.trim(), parentId);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create folder: ${error.message}`);
    }
  }

  /**
   * Update a folder in a project
   */
  async updateFolder(
    projectId: string | ObjectId,
    folderId: string,
    updates: { name?: string }
  ): Promise<FolderNode> {
    try {
      if (updates.name !== undefined && !updates.name.trim()) {
        throw new ValidationError('Folder name cannot be empty');
      }

      const normalizedUpdates = {
        ...updates,
        name: updates.name?.trim()
      };

      return await this.projectModel.updateFolder(projectId, folderId, normalizedUpdates);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update folder: ${error.message}`);
    }
  }

  /**
   * Delete a folder from a project
   */
  async deleteFolder(projectId: string | ObjectId, folderId: string): Promise<void> {
    try {
      await this.projectModel.deleteFolder(projectId, folderId);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete folder: ${error.message}`);
    }
  }

  /**
   * Get folder structure for a project
   */
  async getProjectFolders(projectId: string | ObjectId): Promise<FolderNode[]> {
    try {
      const project = await this.getProjectById(projectId);
      return project.folders;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get project folders: ${error.message}`);
    }
  }

  /**
   * Update script count for a folder (called when scripts are added/removed)
   */
  async updateFolderScriptCount(
    projectId: string | ObjectId,
    folderId: string,
    delta: number
  ): Promise<void> {
    try {
      await this.projectModel.updateFolderScriptCount(projectId, folderId, delta);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update folder script count: ${error.message}`);
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string | ObjectId): Promise<{
    totalScripts: number;
    totalFolders: number;
    lastActivity: Date;
  }> {
    try {
      const project = await this.getProjectById(projectId);
      
      const totalFolders = this.countFolders(project.folders);
      
      return {
        totalScripts: project.stats.totalScripts,
        totalFolders,
        lastActivity: project.stats.lastActivity
      };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get project stats: ${error.message}`);
    }
  }

  /**
   * Check if user owns a project
   */
  async isProjectOwner(projectId: string | ObjectId, userId: string | ObjectId): Promise<boolean> {
    try {
      const project = await this.projectModel.findById(projectId);
      
      if (!project) {
        return false;
      }

      const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      return project.userId.equals(userObjectId);
    } catch (error: any) {
      throw new DatabaseError(`Failed to check project ownership: ${error.message}`);
    }
  }

  /**
   * Get recent projects for a user
   */
  async getRecentProjects(
    userId: string | ObjectId,
    limit: number = 5
  ): Promise<Project[]> {
    try {
      return await this.projectModel.findByUserId(userId, {
        limit,
        sortBy: 'updatedAt',
        sortOrder: -1
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get recent projects: ${error.message}`);
    }
  }

  // Private helper methods

  private countFolders(folders: FolderNode[]): number {
    let count = folders.length;
    
    for (const folder of folders) {
      if (folder.children) {
        count += this.countFolders(folder.children);
      }
    }
    
    return count;
  }
}