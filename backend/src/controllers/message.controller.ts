import { Response } from 'express';
import { Message } from '../models/Message';
import { AuthRequest } from '../middleware/auth';

// Get Messages
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.query;
        const myId = req.userId;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId query param required' });
        }

        const messages = await Message.find({
            $or: [
                { senderId: myId, recipientId: userId },
                { senderId: userId, recipientId: myId }
            ]
        }).sort({ createdAt: 1 });

        res.json({ success: true, data: messages });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send Message
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.userId;

        const message = new Message({
            senderId,
            recipientId,
            content
        });

        await message.save();

        res.status(201).json({ success: true, data: message });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
