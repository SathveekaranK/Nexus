import mongoose from 'mongoose';
import { Response } from 'express';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { createNotification } from './notification.controller';
import { MessageEnricher } from '../services/ai/MessageEnricher';

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, channelId } = req.query;
        const myId = req.user.userId;

        let query: any = {};

        if (channelId) {
            // Channel messages
            query = { channelId };
        } else if (userId) {
            // DM messages - handle both actual user IDs and dm-prefixed IDs
            const actualUserId = typeof userId === 'string' && userId.startsWith('dm-')
                ? userId.replace('dm-', '')
                : userId;

            // Strict ObjectId validation to prevent Mongoose CastError (500)
            const userIdStr = String(actualUserId);
            if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
                return res.json({ success: true, data: [] });
            }

            query = {
                $or: [
                    { senderId: myId, recipientId: userIdStr },
                    { senderId: userIdStr, recipientId: myId }
                ]
            };
        } else {
            return res.status(400).json({ success: false, message: 'userId or channelId query param required' });
        }

        const messages = await Message.find(query)
            .populate('senderId', 'name avatar email roles')
            .populate('replyTo')
            .sort({ createdAt: 1 });

        res.json({ success: true, data: messages });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { recipientId, channelId, content, type, replyTo } = req.body;
        const senderId = req.user.userId;

        if (!recipientId && !channelId) {
            return res.status(400).json({ success: false, message: 'recipientId or channelId required' });
        }

        const message = new Message({
            senderId,
            channelId,
            recipientId,
            content,
            type: type || 'text',
            replyTo,
            readBy: [{ userId: senderId, readAt: new Date() }]
        });
        await message.save();

        // [AI Pipeline] Async Enrichment (Non-blocking)
        if (type === 'text') {
            MessageEnricher.enrich(message._id.toString(), content);
        }

        const sender = await User.findById(senderId).select('name');
        const senderName = sender?.name || 'Someone';

        const mentionMatches = content.match(/@(\w+)/g);
        if (mentionMatches) {
            const usernames = mentionMatches.map((m: string) => m.substring(1));
            const mentionedUsers = await User.find({ name: { $in: usernames } });

            for (const user of mentionedUsers) {
                if (user._id.toString() !== senderId) {
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

        const allUsers = await User.find();
        for (const user of allUsers) {
            if (user._id.toString() !== senderId &&
                content.toLowerCase().includes(user.name.toLowerCase())) {
                await createNotification(
                    user._id.toString(),
                    'message',
                    `${senderName} mentioned your name`,
                    content.substring(0, 100),
                    { relatedMessageId: message._id, channelId }
                );
            }
        }

        // Dynamic Role Mention: Matches @RoleName (case insensitive)
        const roleMatches = content.match(/@([a-zA-Z0-9_]+)/g);
        if (roleMatches) {
            // Filter out things that are definitely user mentions if handled above, 
            // but effectively we can just check if the captured string matches a Role name.

            // Extract potential role names (remove @)
            const potentialRoles = roleMatches.map((m: string) => m.substring(1));

            // Find which of these are actually valid roles in the DB or System
            // Since we don't have a direct "Role" model import here yet (maybe), let's assume we match against User roles or basic set
            // Ideally we query the Role model. 
            // For now, let's query Users who have these strings in their roles array.

            const roleUsers = await User.find({ roles: { $in: potentialRoles } });

            // Deduplicate notifications if user was already notified by user-mention
            // (Logic simplified: just send, client/user can handle or we just accept double ping for now as 'feature')

            for (const user of roleUsers) {
                if (user._id.toString() !== senderId) {
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


        res.status(201).json({ success: true, data: message });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   post:
 *     summary: Mark a message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as read
 */
export const markMessageRead = async (req: AuthRequest, res: Response) => {
    try {
        const messageId = req.params.messageId;
        const userId = req.user.userId;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Check if already read
        const alreadyRead = message.readBy.some((r: any) => r.userId.toString() === userId);
        if (!alreadyRead) {
            message.readBy.push({ userId, readAt: new Date() });
            await message.save();
        }

        res.json({ success: true, data: message });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
