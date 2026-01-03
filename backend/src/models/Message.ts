import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For DMs
    channelId: { type: String }, // For Group Channels (future use)
    content: { type: String, required: true },
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);
