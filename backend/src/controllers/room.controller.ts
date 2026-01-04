import { Request, Response } from 'express';
import { Room } from '../models/Room';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async (req: Request | any, res: Response): Promise<void> => {
    try {
        const userId = req.user.userId;
        const roomId = uuidv4().slice(0, 8); // Short ID

        const newRoom = new Room({
            roomId,
            hostId: userId,
            members: [userId],
            currentSong: {
                timestamp: Date.now()
            }
        });

        await newRoom.save();

        res.status(201).json({ success: true, data: newRoom });
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
