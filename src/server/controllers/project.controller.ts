import { Request, Response, NextFunction } from 'express';
import { ProjectRepository } from '../../lib/database/repositories/project-repository';
import { ProjectModel } from '../../lib/database/models/project';
import { getDatabase } from '../../lib/database/connection';
import { ValidationError, NotFoundError, DatabaseError } from '../../lib/database/errors';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ProjectController {
  private getProjectRepository(): ProjectRepository {
    const db = getDatabase();
    return new ProjectRepository(new ProjectModel(db));
  }

  /**
   * Create a new project
   */
  createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const projectData = req.body;

      const project = await this.getProjectRepository().createProject(userId, projectData);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all projects for the authenticated user
   */
  getUserProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { page, limit, sortBy, sortOrder, search } = (req as any).validatedQuery || req.query;

      let result;

      if (search) {
        result = await this.getProjectRepository().searchUserProjects(userId, search, {
          page,
          limit
        });
      } else {
        result = await this.getProjectRepository().getUserProjects(userId, {
          page,
          limit,
          sortBy,
          sortOrder
        });
      }

      res.json({
        success: true,
        data: result,
        message: 'Projects retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific project by ID
   */
  getProjectById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      console.log(`🔍 Getting project ${id} for user ${userId}`);

      // First check if project exists, then check ownership
      const project = await this.getProjectRepository().getProjectById(id);
      
      console.log(`✅ Project found: ${project.title}`);
      
      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        console.log(`❌ User ${userId} does not own project ${id}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      console.log(`✅ User ${userId} owns project ${id}`);

      res.json({
        success: true,
        data: project,
        message: 'Project retrieved successfully'
      });
    } catch (error) {
      console.error(`❌ Error getting project ${req.params.id}:`, error);
      next(error);
    }
  };

  /**
   * Update a project
   */
  updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updateData = req.body;

      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      const project = await this.getProjectRepository().updateProject(id, updateData);

      res.json({
        success: true,
        data: project,
        message: 'Project updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a project
   */
  deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      await this.getProjectRepository().deleteProject(id);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get project statistics
   */
  getProjectStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      const stats = await this.getProjectRepository().getProjectStats(id);

      res.json({
        success: true,
        data: stats,
        message: 'Project statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent projects for the authenticated user
   */
  getRecentProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 5;

      const projects = await this.getProjectRepository().getRecentProjects(userId, limit);

      res.json({
        success: true,
        data: projects,
        message: 'Recent projects retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new folder in a project
   */
  createFolder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { name, parentId } = req.body;

      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      const folder = await this.getProjectRepository().createFolder(id, name, parentId);

      res.status(201).json({
        success: true,
        data: folder,
        message: 'Folder created successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a folder in a project
   */
  updateFolder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, folderId } = req.params;
      const userId = req.user!.id;
      const updateData = req.body;

      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      const folder = await this.getProjectRepository().updateFolder(id, folderId, updateData);

      res.json({
        success: true,
        data: folder,
        message: 'Folder updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a folder from a project
   */
  deleteFolder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, folderId } = req.params;
      const userId = req.user!.id;

      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      await this.getProjectRepository().deleteFolder(id, folderId);

      res.json({
        success: true,
        message: 'Folder deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get folder structure for a project
   */
  getProjectFolders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      const folders = await this.getProjectRepository().getProjectFolders(id);

      res.json({
        success: true,
        data: folders,
        message: 'Project folders retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Share a project with another user (placeholder for collaboration)
   */
  shareProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { userEmail, permission } = req.body;

      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      // TODO: Implement actual sharing logic
      // This would involve:
      // 1. Finding the user by email
      // 2. Adding them to project collaborators
      // 3. Sending notification/invitation

      res.json({
        success: true,
        message: `Project sharing invitation sent to ${userEmail} with ${permission} permission`,
        data: {
          userEmail,
          permission,
          status: 'pending'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update collaboration settings for a project
   */
  updateCollaborationSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { allowCollaboration, isPublic } = req.body;

      // Check if user owns the project
      const isOwner = await this.getProjectRepository().isProjectOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this project.'
        });
      }

      const updateData: any = {};
      if (allowCollaboration !== undefined) {
        updateData['settings.allowCollaboration'] = allowCollaboration;
      }
      if (isPublic !== undefined) {
        updateData['settings.isPublic'] = isPublic;
      }

      const project = await this.getProjectRepository().updateProject(id, updateData);

      res.json({
        success: true,
        data: project,
        message: 'Collaboration settings updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}