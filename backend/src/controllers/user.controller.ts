import { Request, Response } from 'express';
import { User } from '../models/User';
import mongoose from 'mongoose';

// Get All Users
export const getUsers = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const currentUserId = req.user.userId;

        // Fetch Users and sort by lastMessageAt
        const users = await User.aggregate([
            // Exclude myself
            { $match: { _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } } },
            {
                $lookup: {
                    from: "messages",
                    let: { uid: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: [{ $toString: "$senderId" }, currentUserId] },
                                                { $eq: [{ $toString: "$recipientId" }, { $toString: "$$uid" }] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: [{ $toString: "$senderId" }, { $toString: "$$uid" }] },
                                                { $eq: [{ $toString: "$recipientId" }, currentUserId] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: "lastMsg"
                }
            },
            {
                $addFields: {
                    lastMessage: { $arrayElemAt: ["$lastMsg", 0] },
                    // Ensure we have a valid date for sorting
                    sortTime: { $ifNull: ["$lastMessageAt", new Date(0)] }
                }
            },
            { $sort: { sortTime: -1, name: 1 } },
            { $project: { password: 0, lastMsg: 0, __v: 0 } }
        ]);

        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};


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
