import mongoose, { Schema, Document } from 'mongoose';

export interface IChannel extends Document {
    name: string;
    type: 'channel' | 'direct';
    workspaceId: mongoose.Schema.Types.ObjectId;
    memberIds: mongoose.Schema.Types.ObjectId[];
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ChannelSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['channel', 'direct'], default: 'channel' },
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
        memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        description: { type: String },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IChannel>('Channel', ChannelSchema);
