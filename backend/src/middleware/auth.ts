import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: any;
    userId?: string; // Keep for backward compatibility if needed, but prefer user.userId
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Handle both header formats
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback-secret-dont-use-in-prod';
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Debug log to verify token content
        console.log("Auth Middleware Decoded:", decoded);

        // Set BOTH for maximum compatibility during refactor
        req.user = decoded;
        req.userId = decoded.userId;

        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
