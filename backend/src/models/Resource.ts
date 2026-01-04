import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
    title: string;
    type: 'snippet' | 'link' | 'doc' | 'env';
    content: string; // The code, URL, or text
    description?: string;
    tags: string[];
    metadata?: Record<string, any>; // e.g., { language: 'typescript' }
    isPublic: boolean;
    createdBy: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ResourceSchema: Schema = new Schema({
    title: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['snippet', 'link', 'doc', 'env'],
        default: 'link'
    },
    content: { type: String, required: true },
    description: { type: String },
    tags: [{ type: String }],
    metadata: { type: Map, of: Schema.Types.Mixed },
    isPublic: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Text index for searching
ResourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IResource>('Resource', ResourceSchema);
