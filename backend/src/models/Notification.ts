import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['mention', 'message', 'meeting_reminder', 'role_mention', 'event_created'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    relatedEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    channelId: { type: String },
    read: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
