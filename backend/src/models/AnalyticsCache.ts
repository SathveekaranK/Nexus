import mongoose from 'mongoose';

const analyticsCacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g. "workspace_123_weekly_sentiment_2024_01"
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // The computed result
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// TTL Index for auto-deletion
analyticsCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AnalyticsCache = mongoose.model('AnalyticsCache', analyticsCacheSchema);
