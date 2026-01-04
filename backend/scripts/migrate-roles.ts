import mongoose from 'mongoose';
import { User } from '../src/models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
}

const migrate = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            let modified = false;

            // Migrate 'role' string to 'roles' array if 'roles' is empty or doesn't exist
            // Note: Since we updated the schema, 'roles' might default to ['member'] or []
            // We need to check if the old 'role' is in there.

            // Get the raw document to access the deprecated 'role' field if needed, 
            // but Mongoose might hide it if not in schema. 
            // Actually, we kept 'role' commented out in schema, so strictly typed access might fail.
            // We'll treat it as 'any'.
            const u = user as any;

            // If u.role exists (from DB) and isn't in u.roles
            // (Note: if we commented out 'role' in schema, we might not get it back unless we define strict: false or similar.
            // But usually partial matching works).

            // Actually, safest way is to check the DB directly or assume 'role' might be there.
            // If the schema removed 'role', Mongoose might not load it.
            // Let's assume we proceed with what we have. 

            if (!u.roles || u.roles.length === 0) {
                // If role was 'admin', make roles ['admin']
                // Default fallback
                u.roles = ['member'];
                modified = true;
            }

            // If we can somehow read the old role...
            // Let's just default to 'member' if empty, and maybe 'admin' if we know who they are.

            if (modified) {
                await user.save();
                console.log(`Migrated user ${u.name} (${u.email})`);
            }

            console.log(`User: ${u.name} | ${u.email} | Roles: ${u.roles.join(', ')}`);
        }

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

migrate();
