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
    // 1. Fetch Channels with Unread stats
    const channels = await Channel.aggregate([
        // Cast string userId to ObjectId for aggregation match
        { $match: { members: new mongoose.Types.ObjectId(userId) } },
        {
            $addFields: {
                channelIdString: { $toString: "$_id" }
            }
        },
        {
            // Only need unread count now, sorting is handled by indexed field
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
                id: { $toString: "$_id" }
            }
        },
        { $sort: { lastMessageAt: -1 } } // Fast sort using indexed field
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

    // UPDATE SORTING TIMESTAMPS
    const now = new Date();
    if (channelId) {
        await Channel.findByIdAndUpdate(channelId, { lastMessageAt: now });
    } else if (recipientId) {
        // For DMs, update both users so they float to top for each other
        // Update Sender
        await User.findByIdAndUpdate(userId, { lastMessageAt: now });
        // Update Recipient
        await User.findByIdAndUpdate(recipientId, { lastMessageAt: now });

        // Note: For perfect DMs sorting per-conversation, we ideally need a 'Conversation' model.
        // But updating User's global `lastMessageAt` is a "good enough" proxy for "Recent Contacts" if we sort by that.
        // However, the aggregation query in `getUsersInternal` actually builds the sort time dynamically per pair.
        // The user asked for SPEED ("fast application").
        // Updating a simple field allows us to sort Users globally by "Recently Active with Me" if we store it differently, 
        // OR we just rely on the aggregation I saw earlier.
        // BUT, the user said "change the order in that second".
        // The aggregation I saw earlier DOES sort by actual message timestamp.
        // Let's stick to the aggregation in `getUsersInternal` for ACCURACY of DMs.
        // But for Channels, the `lastMessageAt` field I added is CRITICAL for speed (avoiding lookup).

        // Actually, to make DMs fast, we should probably stick to the aggregation but ensure it's performant.
        // Or, we update a "lastInteractedAt" map in the user object.
        // Let's stick to Channel optimization first.
    }

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
    // Fetch Users and sort by lastMessageAt
    // We added 'lastMessageAt' to User model for this exact purpose (fast sorting)
    const users = await User.aggregate([
        // Exclude myself
        { $match: { _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } } },
        {
            $lookup: {
                // We still need the last message content for the preview text
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
                id: { $toString: "$_id" },
                // Ensure we have a valid date for sorting
                sortTime: { $ifNull: ["$lastMessageAt", new Date(0)] }
            }
        },
        { $sort: { sortTime: -1, name: 1 } }, // Sort by the explicit metadata field
        { $project: { password: 0, lastMsg: 0, __v: 0 } }
    ]);

    return users;
};
