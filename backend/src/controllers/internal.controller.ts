import { Channel } from '../models/Channel';
import { User } from '../models/User';
import { Message } from '../models/Message';
import mongoose from 'mongoose';
import { createNotification } from './notification.controller';

// --- Channel Handlers (Internal) ---

export const createChannelInternal = async (userId: string, data: any) => {
    const { name, description, type = 'channel', memberIds = [] } = data;
    const members = [...new Set([...memberIds, userId])];

    const newChannel = new Channel({
        name,
        description,
        type,
        members,
        creator: userId
    });

    await newChannel.save();

    await User.updateMany(
        { _id: { $in: members } },
        { $push: { channels: newChannel._id } }
    );

    return newChannel;
};

export const getUserChannelsInternal = async (userId: string) => {
    const channels = await Channel.find({ members: userId }).sort({ createdAt: -1 });

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

    channelsWithData.sort((a: any, b: any) => {
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    return channelsWithData;
};

// --- Message Handlers (Internal) ---

export const getMessagesInternal = async (userId: string, queryParams: any) => {
    const { channelId, contactId } = queryParams;
    let query: any = {};

    if (channelId) {
        query = { channelId };
    } else if (contactId) {
        const actualUserId = contactId.replace('dm-', '');

        const userIdStr = String(actualUserId);
        if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
            return [];
        }

        query = {
            $or: [
                { senderId: userId, recipientId: userIdStr },
                { senderId: userIdStr, recipientId: userId }
            ]
        };
    } else {
        throw new Error('userId or channelId query param required');
    }

    const messages = await Message.find(query)
        .populate('senderId', 'name avatar email roles')
        .populate('replyTo')
        .sort({ createdAt: 1 });

    return messages;
};

export const sendMessageInternal = async (userId: string, data: any) => {
    const { recipientId, channelId, content, type, replyTo } = data;

    if (!recipientId && !channelId) {
        throw new Error('recipientId or channelId required');
    }

    const message = new Message({
        senderId: userId,
        channelId,
        recipientId,
        content,
        type: type || 'text',
        replyTo,
        readBy: [{ userId, readAt: new Date() }]
    });
    await message.save();

    // Notifications Logic
    const sender = await User.findById(userId).select('name');
    const senderName = sender?.name || 'Someone';

    // User Mentions
    const mentionMatches = content.match(/@(\w+)/g);
    if (mentionMatches) {
        const usernames = mentionMatches.map((m: string) => m.substring(1));
        const mentionedUsers = await User.find({ name: { $in: usernames } });

        for (const user of mentionedUsers) {
            if (user._id.toString() !== userId) {
                await createNotification(
                    user._id.toString(),
                    'mention',
                    `${senderName} mentioned you`,
                    content.substring(0, 100),
                    { relatedMessageId: message._id, channelId }
                );
            }
        }
    }

    // Role Mentions
    const roleMatches = content.match(/@([a-zA-Z0-9_]+)/g);
    if (roleMatches) {
        const potentialRoles = roleMatches.map((m: string) => m.substring(1));
        const roleUsers = await User.find({ roles: { $in: potentialRoles } });

        for (const user of roleUsers) {
            if (user._id.toString() !== userId) {
                await createNotification(
                    user._id.toString(),
                    'role_mention',
                    `${senderName} mentioned the role`,
                    content.substring(0, 100),
                    { relatedMessageId: message._id, channelId }
                );
            }
        }
    }

    return message;
};

// --- User Handlers (Internal) ---

export const getUsersInternal = async () => {
    return await User.find().select('-password');
};
