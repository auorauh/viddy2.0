import { Request, Response, NextFunction } from 'express';
import { dbDebugger } from '../../lib/database/debug-utils';

export class DebugController {
  /**
   * Debug a specific project ID
   */
  debugProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const result = await dbDebugger.debugProjectId(id);
      
      res.json({
        success: true,
        data: result,
        message: 'Project debug information retrieved'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all projects in the database
   */
  listAllProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dbDebugger.listAllProjects();
      
      res.json({
        success: true,
        data: result,
        message: 'All projects listed'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check database health
   */
  checkHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dbDebugger.checkDatabaseHealth();
      
      res.json({
        success: true,
        data: result,
        message: 'Database health check completed'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create sample data for testing
   */
  createSampleData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dbDebugger.createSampleData();
      
      res.json({
        success: true,
        data: result,
        message: 'Sample data created'
      });
    } catch (error) {
      next(error);
    }
  };
}