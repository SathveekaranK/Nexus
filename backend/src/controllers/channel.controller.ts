import { Request, Response } from 'express';
import { Channel } from '../models/Channel';
import { User } from '../models/User';
import { Message } from '../models/Message';

export const createChannel = async (req: Request | any, res: Response): Promise<void> => {
    try {
        const { name, description, type = 'channel', memberIds = [] } = req.body;
        const creatorId = req.user.userId;

        // Ensure creator is in members
        const members = [...new Set([...memberIds, creatorId])];

        const newChannel = new Channel({
            name,
            description,
            type,
            members,
            creator: creatorId
        });

        await newChannel.save();

        // Update all members to have this channel in their list
        await User.updateMany(
            { _id: { $in: members } },
            { $push: { channels: newChannel._id } }
        );

        res.status(201).json({ success: true, data: newChannel });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserChannels = async (req: Request | any, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const channels = await Channel.find({ members: userId }).sort({ createdAt: -1 });

        // Get unread counts and last message timestamp
        const channelsWithData = await Promise.all(channels.map(async (c) => {
            const unreadCount = await Message.countDocuments({
                channelId: c._id.toString(),
                "readBy.userId": { $ne: userId }
            });

            const lastMessage = await Message.findOne({ channelId: c._id.toString() })
                .sort({ createdAt: -1 })
                .select('createdAt');

            return {
                ...c.toObject(),
                unreadCount,
                lastMessageAt: lastMessage ? lastMessage.createdAt : c.createdAt
            };
        }));

        // Sort by lastMessageAt descending
        channelsWithData.sort((a: any, b: any) => {
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });

        res.status(200).json({ success: true, data: channelsWithData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markRead = async (req: Request | any, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const { channelId } = req.params;

        await Message.updateMany(
            { channelId: channelId, "readBy.userId": { $ne: userId } },
            { $addToSet: { readBy: { userId: userId, readAt: new Date() } } }
        );

        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addMember = async (req: Request | any, res: Response): Promise<void> => {
    try {
        const { channelId } = req.params;
        const { userId } = req.body; // ID of user to add

        if (!userId) {
            res.status(400).json({ success: false, message: 'User ID is required' });
            return;
        }

        const channel = await Channel.findById(channelId);
        if (!channel) {
            res.status(404).json({ success: false, message: 'Channel not found' });
            return;
        }

        if (channel.members.includes(userId)) {
            res.status(400).json({ success: false, message: 'User is already a member' });
            return;
        }

        channel.members.push(userId);
        await channel.save();

        // Update User
        await User.findByIdAndUpdate(userId, { $addToSet: { channels: channelId } });

        res.status(200).json({ success: true, data: channel });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const leaveChannel = async (req: Request | any, res: Response): Promise<void> => {
    try {
        const { channelId } = req.params;
        const userId = req.user.userId;

        const channel = await Channel.findById(channelId);
        if (!channel) {
            res.status(404).json({ success: false, message: 'Channel not found' });
            return;
        }

        if (!channel.members.includes(userId)) {
            res.status(400).json({ success: false, message: 'User is not a member of this channel' });
            return;
        }

        // Remove from Channel
        channel.members = channel.members.filter(id => id.toString() !== userId);
        await channel.save();

        // Remove from User
        await User.findByIdAndUpdate(userId, { $pull: { channels: channelId } });

        res.status(200).json({ success: true, message: 'Successfully left the channel' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

