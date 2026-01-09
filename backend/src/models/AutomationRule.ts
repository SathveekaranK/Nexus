import mongoose from 'mongoose';

const automationRuleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    trigger: {
        type: String,
        enum: ['message_created', 'daily_schedule', 'user_joined'],
        required: true
    },
    action: {
        type: String,
        enum: ['tag_message', 'summarize', 'welcome_user'],
        required: true
    },
    config: { type: mongoose.Schema.Types.Mixed }, // Flexible config for trigger/action
    isEnabled: { type: Boolean, default: true }
}, { timestamps: true });

export const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema);
