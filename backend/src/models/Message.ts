import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // For DMs
    channelId: { type: String, index: true }, // For Group Channels
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
    }],
    // AI Enrichment Fields (Optional)
    sentiment: {
        score: { type: Number },
        label: { type: String, enum: ['positive', 'neutral', 'negative'] }
    },
    topics: [{ type: String }],
    entities: [{
        type: { type: String }, // e.g., 'person', 'date', 'location'
        value: { type: String }
    }],
    embedding: [{ type: Number }], // For semantic search vectors
    isSystemMessage: { type: Boolean, default: false }
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);
