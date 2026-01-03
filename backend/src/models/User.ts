import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        avatar: { type: String },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IUser>('User', UserSchema);
