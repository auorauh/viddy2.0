import { Router } from 'express';
import { DebugController } from '../controllers/debug.controller';

const router = Router();
const debugController = new DebugController();

// Only enable debug routes in development
if (process.env.NODE_ENV !== 'production') {
  router.get('/health', debugController.checkHealth);
  router.get('/projects', debugController.listAllProjects);
  router.get('/projects/:id', debugController.debugProject);
  router.post('/sample-data', debugController.createSampleData);
}

export { router as debugRoutes };