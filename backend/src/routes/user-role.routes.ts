import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { assignUserRoles, getUserRoles, removeUserRole } from '../controllers/user-role.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User Roles
 *   description: User role management (Admin only)
 */

router.post('/assign', authMiddleware, assignUserRoles);
router.get('/:userId', authMiddleware, getUserRoles);
router.delete('/remove', authMiddleware, removeUserRole);

export default router;
