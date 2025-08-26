import { ObjectId, Db } from 'mongodb';
import { ScriptModel } from '../models/script';
import { Script, ScriptInput, ScriptUpdateInput, ScriptVersion, ContentType, ScriptStatus } from '../types';
import { DatabaseError, ValidationError, NotFoundError } from '../errors';

/**
 * Repository class for Script operations
 * Provides a high-level interface for script management
 */
export class ScriptRepository {
  private scriptModel: ScriptModel;

  constructor(db: Db) {
    this.scriptModel = new ScriptModel(db);
  }

  /**
   * Create a new script
   */
  async create(scriptData: ScriptInput): Promise<Script> {
    try {
      return await this.scriptModel.createScript(scriptData);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create script: ${error.message}`);
    }
  }

  /**
   * Find script by ID
   */
  async findById(id: string | ObjectId): Promise<Script | null> {
    try {
      return await this.scriptModel.findById(id);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find script: ${error.message}`);
    }
  }

  /**
   * Find scripts by user ID with filtering and pagination
   */
  async findByUser(
    userId: string | ObjectId,
    options?: {
      limit?: number;
      skip?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 1 | -1;
      status?: ScriptStatus;
      contentType?: ContentType;
    }
  ): Promise<Script[]> {
    try {
      return await this.scriptModel.findByUserId(userId, options);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find user scripts: ${error.message}`);
    }
  }

  /**
   * Find scripts by project ID with filtering and pagination
   */
  async findByProject(
    projectId: string | ObjectId,
    options?: {
      limit?: number;
      skip?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 1 | -1;
      folderId?: string;
    }
  ): Promise<Script[]> {
    try {
      return await this.scriptModel.findByProjectId(projectId, options);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find project scripts: ${error.message}`);
    }
  }

  /**
   * Find scripts in a specific folder
   */
  async findByFolder(
    projectId: string | ObjectId,
    folderId: string,
    options?: {
      limit?: number;
      skip?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 1 | -1;
    }
  ): Promise<Script[]> {
    try {
      return await this.scriptModel.findByFolderId(projectId, folderId, options);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find folder scripts: ${error.message}`);
    }
  }

  /**
   * Update script information
   */
  async update(id: string | ObjectId, updateData: ScriptUpdateInput): Promise<Script> {
    try {
      return await this.scriptModel.updateScript(id, updateData);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update script: ${error.message}`);
    }
  }

  /**
   * Update script content and create new version
   */
  async updateContent(
    id: string | ObjectId,
    newContent: string,
    updateMetadata?: Partial<ScriptUpdateInput['metadata']>
  ): Promise<Script> {
    try {
      return await this.scriptModel.updateScriptContent(id, newContent, updateMetadata);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update script content: ${error.message}`);
    }
  }

  /**
   * Revert script to a previous version
   */
  async revertToVersion(id: string | ObjectId, version: number): Promise<Script> {
    try {
      return await this.scriptModel.revertToVersion(id, version);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to revert script: ${error.message}`);
    }
  }

  /**
   * Delete script
   */
  async delete(id: string | ObjectId): Promise<void> {
    try {
      await this.scriptModel.deleteScript(id);
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete script: ${error.message}`);
    }
  }

  /**
   * Move script to different project/folder
   */
  async move(
    id: string | ObjectId,
    newProjectId: string | ObjectId,
    newFolderId: string
  ): Promise<Script> {
    try {
      return await this.scriptModel.moveScript(id, newProjectId, newFolderId);
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to move script: ${error.message}`);
    }
  }

  /**
   * Search scripts by text
   */
  async search(
    userId: string | ObjectId,
    searchText: string,
    options?: {
      limit?: number;
      skip?: number;
      projectId?: string | ObjectId;
      status?: ScriptStatus;
      contentType?: ContentType;
    }
  ): Promise<Script[]> {
    try {
      return await this.scriptModel.searchScripts(userId, searchText, options);
    } catch (error: any) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to search scripts: ${error.message}`);
    }
  }

  /**
   * Get script statistics for a user
   */
  async getStats(userId: string | ObjectId): Promise<{
    totalScripts: number;
    scriptsByStatus: Record<ScriptStatus, number>;
    scriptsByContentType: Record<ContentType, number>;
    recentActivity: Date | null;
  }> {
    try {
      return await this.scriptModel.getScriptStats(userId);
    } catch (error: any) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get script stats: ${error.message}`);
    }
  }

  /**
   * Get version history for a script
   */
  async getVersionHistory(id: string | ObjectId): Promise<ScriptVersion[]> {
    try {
      return await this.scriptModel.getVersionHistory(id);
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get version history: ${error.message}`);
    }
  }

  /**
   * Count scripts in a folder
   */
  async countInFolder(projectId: string | ObjectId, folderId: string): Promise<number> {
    try {
      return await this.scriptModel.countScriptsInFolder(projectId, folderId);
    } catch (error: any) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to count scripts in folder: ${error.message}`);
    }
  }

  /**
   * Delete all scripts in a project (used when project is deleted)
   */
  async deleteByProject(projectId: string | ObjectId): Promise<number> {
    try {
      return await this.scriptModel.deleteScriptsByProjectId(projectId);
    } catch (error: any) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete scripts by project: ${error.message}`);
    }
  }

  /**
   * Delete all scripts in a folder (used when folder is deleted)
   */
  async deleteByFolder(projectId: string | ObjectId, folderId: string): Promise<number> {
    try {
      return await this.scriptModel.deleteScriptsByFolderId(projectId, folderId);
    } catch (error: any) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete scripts by folder: ${error.message}`);
    }
  }

  /**
   * Get recent scripts for a user
   */
  async getRecent(
    userId: string | ObjectId,
    limit: number = 10
  ): Promise<Script[]> {
    try {
      return await this.scriptModel.findByUserId(userId, {
        limit,
        sortBy: 'updatedAt',
        sortOrder: -1
      });
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get recent scripts: ${error.message}`);
    }
  }

  /**
   * Get scripts by status for a user
   */
  async getByStatus(
    userId: string | ObjectId,
    status: ScriptStatus,
    options?: {
      limit?: number;
      skip?: number;
    }
  ): Promise<Script[]> {
    try {
      return await this.scriptModel.findByUserId(userId, {
        ...options,
        status,
        sortBy: 'updatedAt',
        sortOrder: -1
      });
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get scripts by status: ${error.message}`);
    }
  }

  /**
   * Get scripts by content type for a user
   */
  async getByContentType(
    userId: string | ObjectId,
    contentType: ContentType,
    options?: {
      limit?: number;
      skip?: number;
    }
  ): Promise<Script[]> {
    try {
      return await this.scriptModel.findByUserId(userId, {
        ...options,
        contentType,
        sortBy: 'updatedAt',
        sortOrder: -1
      });
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get scripts by content type: ${error.message}`);
    }
  }

  /**
   * Bulk update script status
   */
  async bulkUpdateStatus(
    scriptIds: (string | ObjectId)[],
    status: ScriptStatus
  ): Promise<number> {
    try {
      let updatedCount = 0;
      
      for (const id of scriptIds) {
        try {
          await this.scriptModel.updateScript(id, {
            metadata: { status }
          });
          updatedCount++;
        } catch (error) {
          // Continue with other scripts if one fails
          console.warn(`Failed to update script ${id}:`, error);
        }
      }
      
      return updatedCount;
    } catch (error: any) {
      throw new DatabaseError(`Failed to bulk update script status: ${error.message}`);
    }
  }

  /**
   * Get script count by project
   */
  async getCountByProject(projectId: string | ObjectId): Promise<number> {
    try {
      const scripts = await this.scriptModel.findByProjectId(projectId, { limit: 0 });
      return scripts.length;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get script count by project: ${error.message}`);
    }
  }
}