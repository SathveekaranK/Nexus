import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check if user has 'admin' role
    // Assumes req.user is populated by authMiddleware and contains roles array
    // Backend User model has `roles: string[]`

    // Note: In token, we might store roles. If not, we might need to fetch user.
    // Let's assume roles are in the token for performance, OR we fetch.
    // Looking at authMiddleware, it decodes token.
    // Looking at User model (from earlier), it has roles.
    // Ideally authentication endpoint puts roles in JWT.

    // Safety check
    if (!req.user || !req.user.roles || !Array.isArray(req.user.roles)) {
        // Fallback: If roles not in token, maybe fetch user?
        // For now, deny if not present to enforce secure design
        return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    if (req.user.roles.includes('admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin role required' });
    }
};
