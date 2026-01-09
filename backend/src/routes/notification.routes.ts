import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications management
 */

router.get('/', authMiddleware, getNotifications);
router.put('/:id/read', authMiddleware, markAsRead);
router.put('/read-all', authMiddleware, markAllAsRead);

export default router;
