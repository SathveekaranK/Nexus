import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { User } from '../models/User';

export const checkPermission = (requiredPermission: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Super-admin check: 'owner' or 'admin' gets everything
            // Note: In real system, we'd check Role model permissions.
            // For now, hardcode: admin/owner has all permissions.
            const userRoles = user.roles || [];

            if (userRoles.includes('owner') || userRoles.includes('admin')) {
                return next();
            }

            // If we had granular permissions, we would fetch roles from DB and check their permissions array.
            // Example stub:
            // const roles = await Role.find({ name: { $in: userRoles } });
            // const allPermissions = roles.flatMap(r => r.permissions);
            // if (allPermissions.includes(requiredPermission)) return next();

            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });

        } catch (error) {
            res.status(500).json({ message: 'Server error checking permissions' });
        }
    };
};
