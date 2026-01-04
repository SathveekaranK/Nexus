import { Request, Response } from 'express';
import { Room } from '../models/Room';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async (req: Request | any, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const roomId = uuidv4().slice(0, 8); // Short ID
        const { name, genre } = req.body; // New: Accept name and genre

        const newRoom = new Room({
            roomId,
            hostId: userId,
            name: name || `${userId.slice(0, 4)}'s Room`,
            genre: genre || 'General',
            members: [userId],
            currentMedia: {
                timestamp: Date.now()
            }
        });

        await newRoom.save();

        res.status(201).json({ success: true, data: newRoom });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPublicRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        // Find rooms created in the last 24 hours (cleanup logic ideally needed)
        // Sort by newest first
        const rooms = await Room.find().sort({ createdAt: -1 }).limit(20);
        res.status(200).json({ success: true, data: rooms });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId });

        if (!room) {
            res.status(404).json({ success: false, message: 'Room not found' });
            return;
        }

        res.status(200).json({ success: true, data: room });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
