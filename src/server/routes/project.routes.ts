import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  projectQuerySchema,
  createFolderSchema,
  updateFolderSchema,
  folderIdParamSchema,
  shareProjectSchema,
  collaborationSettingsSchema
} from '../schemas/project.schemas';

const router = Router();
const projectController = new ProjectController();

// All project routes require authentication
router.use(authenticateToken);

// Project CRUD operations
router.post('/', validateBody(createProjectSchema), projectController.createProject);
router.get('/', validateQuery(projectQuerySchema), projectController.getUserProjects);
router.get('/recent', projectController.getRecentProjects);
router.get('/:id', validateParams(projectIdParamSchema), projectController.getProjectById);
router.put('/:id', validateParams(projectIdParamSchema), validateBody(updateProjectSchema), projectController.updateProject);
router.delete('/:id', validateParams(projectIdParamSchema), projectController.deleteProject);

// Project statistics
router.get('/:id/stats', validateParams(projectIdParamSchema), projectController.getProjectStats);

// Folder management within projects
router.get('/:id/folders', validateParams(projectIdParamSchema), projectController.getProjectFolders);
router.post('/:id/folders', validateParams(projectIdParamSchema), validateBody(createFolderSchema), projectController.createFolder);
router.put('/:id/folders/:folderId', 
  validateParams(projectIdParamSchema.merge(folderIdParamSchema)), 
  validateBody(updateFolderSchema), 
  projectController.updateFolder
);
router.delete('/:id/folders/:folderId', 
  validateParams(projectIdParamSchema.merge(folderIdParamSchema)), 
  projectController.deleteFolder
);

// Project sharing and collaboration
router.post('/:id/share', validateParams(projectIdParamSchema), validateBody(shareProjectSchema), projectController.shareProject);
router.put('/:id/collaboration', 
  validateParams(projectIdParamSchema), 
  validateBody(collaborationSettingsSchema), 
  projectController.updateCollaborationSettings
);

export { router as projectRoutes };