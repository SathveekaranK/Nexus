
import mongoose from 'mongoose';
import { Room } from './models/Room';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log("Connected to DB");

    const rooms = await Room.find({});
    console.log(`Found ${rooms.length} rooms.`);

    for (const room of rooms) {
        room.currentMedia = {
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Rick Astley - Never Gonna Give You Up',
            thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
            isPlaying: true,
            timestamp: 0,
            duration: 212,
            playedAt: Date.now()
        };
        await room.save();
        console.log(`Updated room ${room.roomId} with media.`);
    }

    console.log("Done");
    process.exit(0);
};

run().catch(console.error);
