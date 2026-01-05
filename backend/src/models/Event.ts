import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    type: {
        type: String,
        enum: ['meeting', 'event', 'planning'],
        default: 'event'
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    meetingUrl: { type: String },
    location: { type: String },
    reminders: [{
        time: { type: Number, required: true },
        sent: { type: Boolean, default: false }
    }]
}, { timestamps: true });

eventSchema.index({ startDate: 1, participants: 1 });
eventSchema.index({ creatorId: 1, startDate: -1 });

export const Event = mongoose.model('Event', eventSchema);
