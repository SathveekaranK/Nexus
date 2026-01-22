import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { Channel } from '../models/Channel';

export const globalSearch = async (req: any, res: Response) => {
    try {
        const query = req.query.q as string;
        const type = req.query.type as string || 'all'; // all, messages, users, files
        const { id: userId } = req.user as any;

        if (!query || query.length < 2) {
            return res.status(400).json({ success: false, message: "Query too short" });
        }

        const limit = 20;
        const results: any = {
            messages: [],
            users: [],
            channels: []
        };

        // 1. Search Messages (Text Search)
        // Ensure user can only search messages where they are sender, recipient, or in that channel
        if (type === 'all' || type === 'messages') {
            // Find channels user is in
            const userChannels = await Channel.find({ members: userId }).select('id');
            const channelIds = userChannels.map(c => (c as any).id || c._id); // Handle both

            results.messages = await Message.find({
                $text: { $search: query },
                $or: [
                    { senderId: userId },
                    { recipientId: userId },
                    { channelId: { $in: channelIds } }
                ]
            })
                .sort({ score: { $meta: "textScore" }, createdAt: -1 })
                .limit(limit)
                .populate('senderId', 'name avatar')
                .select('content senderId createdAt channelId recipientId');
        }

        // 2. Search Users
        if (type === 'all' || type === 'users') {
            results.users = await User.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ]
            })
                .select('name avatar email status')
                .limit(limit);
        }

        // 3. Search Channels
        if (type === 'all' || type === 'channels') {
            results.channels = await Channel.find({
                name: { $regex: query, $options: 'i' },
                $or: [
                    { type: 'public' },
                    { members: userId }
                ]
            })
                .select('name type description')
                .limit(limit);
        }

        res.json({ success: true, data: results });
    } catch (error: any) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Search failed' });
    }
};

export const searchMessages = async (req: Request, res: Response) => {
    // Specific message search within a context (channel/dm)
    // To be implemented if specialized route needed
};
