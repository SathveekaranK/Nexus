import { Request, Response } from 'express';
import Message from '../models/Message';

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { channelId } = req.query;
        if (!channelId) {
            return res.status(400).json({ message: 'Channel ID is required' });
        }
        const messages = await Message.find({ channelId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

export const createMessage = async (req: Request, res: Response) => {
    try {
        const message = new Message(req.body);
        await message.save();
        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ message: 'Error creating message' });
    }
};
