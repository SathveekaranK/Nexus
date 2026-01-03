import { Request, Response } from 'express';
import Channel from '../models/Channel';

export const getChannels = async (req: Request, res: Response) => {
    try {
        const { workspaceId } = req.query;
        const query = workspaceId ? { workspaceId } : {};
        const channels = await Channel.find(query);
        res.json(channels);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching channels' });
    }
};

export const createChannel = async (req: Request, res: Response) => {
    try {
        const channel = new Channel(req.body);
        await channel.save();
        res.status(201).json(channel);
    } catch (error) {
        res.status(400).json({ message: 'Error creating channel' });
    }
};
