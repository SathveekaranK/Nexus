import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

/**
 * @swagger
 * /api/user-roles/assign:
 *   post:
 *     summary: Assign roles to a user (Admin only)
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roles
 *             properties:
 *               userId:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Roles assigned successfully
 */
export const assignUserRoles = async (req: AuthRequest, res: Response) => {
    try {
        const requestingUser = await User.findById(req.user.userId);
        if (!requestingUser || !requestingUser.roles?.includes('admin')) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const { userId, roles } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.roles = roles;
        await user.save();

        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/user-roles/{userId}:
 *   get:
 *     summary: Get user roles
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User roles
 */
export const getUserRoles = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('roles name email avatar');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: { roles: user.roles, name: user.name, email: user.email } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/user-roles/remove:
 *   delete:
 *     summary: Remove a role from user (Admin only)
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role removed
 */
export const removeUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const requestingUser = await User.findById(req.user.userId);
        if (!requestingUser || !requestingUser.roles?.includes('admin')) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const { userId, role } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.roles = user.roles?.filter((r: string) => r !== role) || [];
        await user.save();

        res.json({ success: true, data: { roles: user.roles } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
