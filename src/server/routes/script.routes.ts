import { Router } from 'express';
import { z } from 'zod';
import { ScriptController } from '../controllers/script.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import {
  createScriptSchema,
  updateScriptSchema,
  updateScriptContentSchema,
  moveScriptSchema,
  bulkUpdateStatusSchema,
  revertToVersionSchema,
  scriptIdParamSchema,
  scriptQuerySchema,
  searchQuerySchema,
  folderScriptsQuerySchema
} from '../schemas/script.schemas';

const router = Router();
const scriptController = new ScriptController();

// All script routes require authentication
router.use(authenticateToken);

// Script CRUD operations
router.post('/', validateBody(createScriptSchema), scriptController.createScript);
router.get('/', validateQuery(scriptQuerySchema), scriptController.getUserScripts);
router.get('/recent', scriptController.getRecentScripts);
router.get('/search', validateQuery(searchQuerySchema), scriptController.searchScripts);
router.get('/stats', scriptController.getScriptStats);

// Individual script operations
router.get('/:id', validateParams(scriptIdParamSchema), scriptController.getScriptById);
router.put('/:id', validateParams(scriptIdParamSchema), validateBody(updateScriptSchema), scriptController.updateScript);
router.delete('/:id', validateParams(scriptIdParamSchema), scriptController.deleteScript);

// Script content and versioning
router.put('/:id/content', 
  validateParams(scriptIdParamSchema), 
  validateBody(updateScriptContentSchema), 
  scriptController.updateScriptContent
);
router.get('/:id/versions', validateParams(scriptIdParamSchema), scriptController.getVersionHistory);
router.post('/:id/revert', 
  validateParams(scriptIdParamSchema), 
  validateBody(revertToVersionSchema), 
  scriptController.revertToVersion
);

// Script management operations
router.post('/:id/move', 
  validateParams(scriptIdParamSchema), 
  validateBody(moveScriptSchema), 
  scriptController.moveScript
);
router.post('/bulk/status', validateBody(bulkUpdateStatusSchema), scriptController.bulkUpdateStatus);

// Project and folder specific script operations
router.get('/project/:projectId', 
  validateParams(z.object({ projectId: scriptIdParamSchema.shape.id })), 
  validateQuery(scriptQuerySchema), 
  scriptController.getProjectScripts
);
router.get('/project/:projectId/folder/:folderId', 
  validateParams(z.object({ 
    projectId: scriptIdParamSchema.shape.id, 
    folderId: z.string().min(1)
  })), 
  validateQuery(scriptQuerySchema), 
  scriptController.getFolderScripts
);

export { router as scriptRoutes };