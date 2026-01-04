import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia {
    url: string;
    title: string;
    thumbnail: string;
    isPlaying: boolean;
    timestamp: number;
    duration: number;
    playedAt: number;
}

export interface IRoom extends Document {
    roomId: string;
    hostId: string;
    members: string[];
    currentMedia: IMedia;
    createdAt: Date;
    updatedAt: Date;
}

const RoomSchema: Schema = new Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    hostId: {
        type: String,
        required: true
    },
    members: [{
        type: String
    }],
    currentMedia: {
        url: { type: String, default: '' },
        title: { type: String, default: 'No Media Playing' },
        thumbnail: { type: String, default: '' },
        isPlaying: { type: Boolean, default: false },
        timestamp: { type: Number, default: 0 },
        duration: { type: Number, default: 0 },
        playedAt: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
