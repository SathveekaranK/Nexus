import { Request, Response } from 'express';
import { User } from '../models/User';

// Get All Users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}


export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body; // Legacy single role from frontend

        // Overwrite roles with single selected role. 
        // To support multi-role via UI, we'd need a multi-select component.
        // For now, this maintains compatibility.
        const user = await User.findByIdAndUpdate(id, { roles: [role] }, { new: true }).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}


export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const { name, bio, status, avatar } = req.body;

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        if (status !== undefined) updates.status = status;
        if (avatar !== undefined) updates.avatar = avatar;

        const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
