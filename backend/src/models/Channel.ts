import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['channel', 'dm'], default: 'channel' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

export const Channel = mongoose.model('Channel', channelSchema);
