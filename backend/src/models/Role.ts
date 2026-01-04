import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
    name: string;
    permissions: string[];
    isSystem: boolean; // non-deletable
}

const RoleSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    permissions: [{ type: String }], // e.g. 'manage_users', 'delete_messages', 'view_secrets'
    isSystem: { type: Boolean, default: false }
});

export default mongoose.model<IRole>('Role', RoleSchema);
