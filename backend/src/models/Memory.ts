import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If null, it's global knowledge
    content: { type: String, required: true },
    tags: [{ type: String }], // e.g., 'preference', 'tech-stack', 'deadline'
    sourceMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

// Text index for searching memories
memorySchema.index({ content: 'text', tags: 'text' });

export const Memory = mongoose.model('Memory', memorySchema);
