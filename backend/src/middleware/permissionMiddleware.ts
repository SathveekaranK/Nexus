import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import Role from '../models/Role';

/**
 * Granular Permission Constants
 * Defined broadly to allow flexibility in checking.
 */
export const PERMISSIONS = {
    AI: {
        EXECUTE_QUERIES: 'ai:execute_queries',
        VIEW_ANALYTICS: 'ai:view_analytics',
        MANAGE_AUTOMATION: 'ai:manage_automation'
    },
    CHANNEL: {
        CREATE: 'channel:create',
        DELETE: 'channel:delete',
        MANAGE: 'channel:manage'
    }
};

/**
 * Middleware to check for specific granular permissions.
 * Usage: router.post('/ask', checkPermission(PERMISSIONS.AI.EXECUTE_QUERIES), ...)
 */
export const checkPermission = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.userId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const user = await User.findById(userId);
            if (!user) return res.status(401).json({ error: 'User not found' });

            // If user has no roles, deny
            if (!user.roles || user.roles.length === 0) {
                return res.status(403).json({ error: `Permission denied: Missing ${requiredPermission}` });
            }

            // Fetch generic strings from Role model
            // user.roles is an array of strings like ['admin', 'member'] or IDs?
            // Checking User model: roles: [{ type: String, default: 'member' }] -> It's an array of strings (names).

            // Find Permission Roles in DB that match the user's role names
            const userRoles = await Role.find({ name: { $in: user.roles } });

            // Flatten all permissions from all roles the user has
            const allPermissions = userRoles.reduce<string[]>((acc, role) => {
                return acc.concat(role.permissions || []);
            }, []);

            // Check if Super Admin or has specific permission
            if (allPermissions.includes('*') || allPermissions.includes(requiredPermission)) {
                return next();
            }

            return res.status(403).json({ error: `Permission denied: Requires ${requiredPermission}` });

        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({ error: 'Internal Server Error during permission check' });
        }
    };
};
