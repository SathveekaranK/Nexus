import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspace extends Document {
    name: string;
    description?: string;
    ownerId: mongoose.Schema.Types.ObjectId;
    members: mongoose.Schema.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
