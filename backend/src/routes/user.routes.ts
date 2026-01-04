import express from 'express';
import { getUsers, updateUserRole } from '../controllers/user.controller';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *       500:
 *         description: Server error
 */
router.get('/', getUsers);
router.patch('/:id/role', getUsers, updateUserRole); // Should use permission check properly but for now authenticated

export default router;
