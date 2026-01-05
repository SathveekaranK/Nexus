import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For DMs
    channelId: { type: String }, // For Group Channels
    content: { type: String, required: true },
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'file', 'voice', 'bot'],
        default: 'text'
    },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    reactions: [{
        userId: { type: String },
        emoji: { type: String }
    }],
    edited: { type: Boolean, default: false },
    attachments: [{
        name: { type: String },
        url: { type: String },
        type: { type: String }
    }],
    readBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);
