import { Response } from 'express';
import { Message } from '../models/Message';
import { AuthRequest } from '../middleware/auth.middleware';

export const addReaction = async (req: AuthRequest, res: Response) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.userId;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions?.find(
            r => r.userId === userId && r.emoji === emoji
        );

        if (existingReaction) {
            // Remove reaction (toggle off)
            message.reactions = message.reactions?.filter(
                r => !(r.userId === userId && r.emoji === emoji)
            ) || [];
        } else {
            // Add reaction
            if (!message.reactions) message.reactions = [];
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        res.json({ success: true, data: message });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Only sender can edit
        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        message.content = content;
        message.edited = true;
        await message.save();

        res.json({ success: true, data: message });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.userId;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Only sender can delete
        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Message.findByIdAndDelete(messageId);

        res.json({ success: true, message: 'Message deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
