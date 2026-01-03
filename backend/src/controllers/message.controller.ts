import { Response } from 'express';
import { Message } from '../models/Message';
import { AuthRequest } from '../middleware/auth.middleware';

// Get Messages
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, channelId } = req.query;
        const myId = req.user.userId;

        let query: any = {};

        if (channelId) {
            // Group Channel Messages
            query = { channelId };
        } else if (userId) {
            // Direct Messages
            query = {
                $or: [
                    { senderId: myId, recipientId: userId },
                    { senderId: userId, recipientId: myId }
                ]
            };
        } else {
            return res.status(400).json({ success: false, message: 'userId or channelId query param required' });
        }

        const messages = await Message.find(query).sort({ createdAt: 1 });

        res.json({ success: true, data: messages });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send Message
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { recipientId, channelId, content } = req.body;
        const senderId = req.user.userId;

        if (!recipientId && !channelId) {
            return res.status(400).json({ success: false, message: 'recipientId or channelId required' });
        }

        const message = new Message({
            senderId,
            recipientId,
            channelId,
            content
        });

        await message.save();

        res.status(201).json({ success: true, data: message });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
