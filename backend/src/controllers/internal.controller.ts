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
    // 1. Fetch Channels with Unread/LastMessage stats using Aggregation
    const channels = await Channel.aggregate([
        // CRITICAL: Cast string userId to ObjectId for aggregation match
        { $match: { members: new mongoose.Types.ObjectId(userId) } },
        {
            $addFields: {
                channelIdString: { $toString: "$_id" }
            }
        },
        {
            $lookup: {
                from: "messages",
                let: { cid: "$channelIdString" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$channelId", "$$cid"] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    {
                        $group: {
                            _id: "$channelId",
                            lastMessageAt: { $first: "$createdAt" }
                        }
                    }
                ],
                as: "lastMsgStat"
            }
        },
        {
            // Separate lookup for unread count to be simpler/safer
            $lookup: {
                from: "messages",
                let: { cid: "$channelIdString" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$channelId", "$$cid"] } } },
                    { $match: { "readBy.userId": { $ne: new mongoose.Types.ObjectId(userId) } } },
                    { $count: "count" }
                ],
                as: "unreadStat"
            }
        },
        {
            $addFields: {
                unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadStat.count", 0] }, 0] },
                lastMessageAt: {
                    $ifNull: [
                        { $arrayElemAt: ["$lastMsgStat.lastMessageAt", 0] },
                        "$createdAt"
                    ]
                },
                id: { $toString: "$_id" }
            }
        },
        { $sort: { lastMessageAt: -1 } }
    ]);

    return channels;
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

export const getUsersInternal = async (currentUserId?: string) => {
    // If no userId provided, just return raw list (fallback)
    if (!currentUserId) {
        return await User.find().select('-password');
    }

    // Fetch Users with DM Stats
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
                    { $limit: 1 }, // Just need the last one
                ],
                as: "lastMsg"
            }
        },
        {
            $addFields: {
                lastMessage: { $arrayElemAt: ["$lastMsg", 0] },
                id: { $toString: "$_id" }
            }
        },
        {
            $addFields: {
                // Sort Value: timestamp of last message OR default (0)
                sortTime: { $ifNull: ["$lastMessage.createdAt", new Date(0)] }
            }
        },
        { $sort: { sortTime: -1, name: 1 } }, // Most recent DMs first
        { $project: { password: 0, lastMsg: 0, sortTime: 0, __v: 0 } }
    ]);

    return users;
};
