import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ScriptRepository } from '../../lib/database/repositories/script-repository';
import { getDatabase } from '../../lib/database/connection';
import { DatabaseError, ValidationError, NotFoundError } from '../../lib/database/errors';
import { ContentType, ScriptStatus } from '../../lib/database/types';
import {
  CreateScriptRequest,
  UpdateScriptRequest,
  UpdateScriptContentRequest,
  MoveScriptRequest,
  BulkUpdateStatusRequest,
  RevertToVersionRequest,
  ScriptQueryRequest,
  SearchQueryRequest,
  FolderScriptsQueryRequest
} from '../schemas/script.schemas';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
  validatedQuery?: any;
}

export class ScriptController {
  private scriptRepository: ScriptRepository | null = null;

  private getScriptRepository(): ScriptRepository {
    if (!this.scriptRepository) {
      const db = getDatabase();
      this.scriptRepository = new ScriptRepository(db);
    }
    return this.scriptRepository;
  }

  /**
   * Create a new script
   */
  createScript = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const scriptData: CreateScriptRequest = req.body;

      const script = await this.getScriptRepository().create({
        ...scriptData,
        userId: new ObjectId(userId),
        projectId: new ObjectId(scriptData.projectId)
      });

      res.status(201).json({
        success: true,
        data: script
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else if (error instanceof DatabaseError) {
        res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Get script by ID
   */
  getScriptById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { id } = req.params;
      const script = await this.getScriptRepository().findById(id);

      if (!script) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Script not found'
          }
        });
        return;
      }

      // Check if user owns the script
      if (script.userId.toString() !== userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: script
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Get user's scripts with filtering and pagination
   */
  getUserScripts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const query: ScriptQueryRequest = req.validatedQuery || req.query;

      const scripts = await this.getScriptRepository().findByUser(userId, {
        limit: query.limit,
        skip: query.skip,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.status,
        contentType: query.contentType
      });

      res.json({
        success: true,
        data: scripts,
        pagination: {
          limit: query.limit || 50,
          skip: query.skip || 0,
          total: scripts.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  };

  /**
   * Get scripts by project
   */
  getProjectScripts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { projectId } = req.params;
      const query: ScriptQueryRequest = req.validatedQuery || req.query;

      const scripts = await this.getScriptRepository().findByProject(projectId, {
        limit: query.limit,
        skip: query.skip,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        folderId: query.folderId
      });

      // Filter scripts to only include those owned by the user
      const userScripts = scripts.filter(script => script.userId.toString() === userId);

      res.json({
        success: true,
        data: userScripts,
        pagination: {
          limit: query.limit || 50,
          skip: query.skip || 0,
          total: userScripts.length
        }
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Get scripts in a specific folder
   */
  getFolderScripts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { projectId, folderId } = req.params;
      const query: ScriptQueryRequest = req.validatedQuery || req.query;

      const scripts = await this.getScriptRepository().findByFolder(projectId, folderId, {
        limit: query.limit,
        skip: query.skip,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      });

      // Filter scripts to only include those owned by the user
      const userScripts = scripts.filter(script => script.userId.toString() === userId);

      res.json({
        success: true,
        data: userScripts,
        pagination: {
          limit: query.limit || 50,
          skip: query.skip || 0,
          total: userScripts.length
        }
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Update script
   */
  updateScript = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { id } = req.params;
      const updateData: UpdateScriptRequest = req.body;

      // Check if user owns the script
      const existingScript = await this.getScriptRepository().findById(id);
      if (!existingScript) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Script not found'
          }
        });
        return;
      }

      if (existingScript.userId.toString() !== userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      // Convert projectId to ObjectId if provided
      const processedUpdateData = {
        ...updateData,
        ...(updateData.projectId && { projectId: new ObjectId(updateData.projectId) })
      };

      const updatedScript = await this.getScriptRepository().update(id, processedUpdateData);

      res.json({
        success: true,
        data: updatedScript
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Update script content and create new version
   */
  updateScriptContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { id } = req.params;
      const { content, metadata }: UpdateScriptContentRequest = req.body;

      // Check if user owns the script
      const existingScript = await this.getScriptRepository().findById(id);
      if (!existingScript) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Script not found'
          }
        });
        return;
      }

      if (existingScript.userId.toString() !== userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      const updatedScript = await this.getScriptRepository().updateContent(id, content, metadata);

      res.json({
        success: true,
        data: updatedScript
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Delete script
   */
  deleteScript = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { id } = req.params;

      // Check if user owns the script
      const existingScript = await this.getScriptRepository().findById(id);
      if (!existingScript) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Script not found'
          }
        });
        return;
      }

      if (existingScript.userId.toString() !== userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      await this.getScriptRepository().delete(id);

      res.json({
        success: true,
        message: 'Script deleted successfully'
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Move script to different project/folder
   */
  moveScript = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { id } = req.params;
      const { projectId, folderId }: MoveScriptRequest = req.body;

      // Check if user owns the script
      const existingScript = await this.getScriptRepository().findById(id);
      if (!existingScript) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Script not found'
          }
        });
        return;
      }

      if (existingScript.userId.toString() !== userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      const movedScript = await this.getScriptRepository().move(id, new ObjectId(projectId), folderId);

      res.json({
        success: true,
        data: movedScript
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Search scripts
   */
  searchScripts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const query: SearchQueryRequest = req.validatedQuery || req.query;

      const scripts = await this.getScriptRepository().search(userId, query.q, {
        limit: query.limit,
        skip: query.skip,
        projectId: query.projectId ? new ObjectId(query.projectId) : undefined,
        status: query.status,
        contentType: query.contentType
      });

      res.json({
        success: true,
        data: scripts,
        pagination: {
          limit: query.limit || 20,
          skip: query.skip || 0,
          total: scripts.length
        },
        query: query.q
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Get script version history
   */
  getVersionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { id } = req.params;

      // Check if user owns the script
      const existingScript = await this.getScriptRepository().findById(id);
      if (!existingScript) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Script not found'
          }
        });
        return;
      }

      if (existingScript.userId.toString() !== userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      const versions = await this.getScriptRepository().getVersionHistory(id);

      res.json({
        success: true,
        data: versions
      });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Revert script to a previous version
   */
  revertToVersion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { id } = req.params;
      const { version }: RevertToVersionRequest = req.body;

      // Check if user owns the script
      const existingScript = await this.getScriptRepository().findById(id);
      if (!existingScript) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Script not found'
          }
        });
        return;
      }

      if (existingScript.userId.toString() !== userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      const revertedScript = await this.getScriptRepository().revertToVersion(id, version);

      res.json({
        success: true,
        data: revertedScript
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Bulk update script status
   */
  bulkUpdateStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { scriptIds, status }: BulkUpdateStatusRequest = req.body;

      // Verify all scripts belong to the user
      const scripts = await Promise.all(
        scriptIds.map(id => this.getScriptRepository().findById(id))
      );

      const invalidScripts = scripts.filter((script, index) => 
        !script || script.userId.toString() !== userId
      );

      if (invalidScripts.length > 0) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'One or more scripts not found or access denied'
          }
        });
        return;
      }

      const updatedCount = await this.getScriptRepository().bulkUpdateStatus(scriptIds, status);

      res.json({
        success: true,
        data: {
          updatedCount,
          totalRequested: scriptIds.length
        }
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    }
  };

  /**
   * Get script statistics for the user
   */
  getScriptStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const stats = await this.getScriptRepository().getStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  };

  /**
   * Get recent scripts for the user
   */
  getRecentScripts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const scripts = await this.getScriptRepository().getRecent(userId, limit);

      res.json({
        success: true,
        data: scripts
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  };
}