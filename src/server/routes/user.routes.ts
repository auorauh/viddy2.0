import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  userIdParamSchema,
  checkAvailabilitySchema
} from '../schemas/user.schemas';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/register', validateBody(registerSchema), userController.register);
router.post('/login', validateBody(loginSchema), userController.login);
router.post('/logout', userController.logout);
router.post('/check-availability', validateBody(checkAvailabilitySchema), userController.checkAvailability);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, validateBody(updateProfileSchema), userController.updateProfile);
router.put('/password', authenticateToken, validateBody(changePasswordSchema), userController.changePassword);
router.delete('/account', authenticateToken, userController.deleteAccount);
router.get('/stats', authenticateToken, userController.getStats);
router.post('/refresh-token', authenticateToken, userController.refreshToken);

export { router as userRoutes };