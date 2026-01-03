import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    content: string;
    senderId: mongoose.Schema.Types.ObjectId;
    channelId: mongoose.Schema.Types.ObjectId;
    attachments?: string[];
    isPinned: boolean;
    aiResponse?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
    {
        content: { type: String, required: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
        attachments: [{ type: String }],
        isPinned: { type: Boolean, default: false },
        aiResponse: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
