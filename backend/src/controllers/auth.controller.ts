import { Request, Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not defined in environment variables. Using a temporary secret for development.');
}

const FINAL_JWT_SECRET = JWT_SECRET || 'dev-fallback-secret-dont-use-in-prod';

// Register
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, avatar } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Default role logic can stay simple for now, 'member' is default in schema
        const user = new User({ name, email, password, avatar });
        await user.save();

        const token = jwt.sign({ userId: user._id }, FINAL_JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    roles: (user as any).roles // Return roles array
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await (user as any).comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, FINAL_JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    roles: (user as any).roles // Return roles array
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Me
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
