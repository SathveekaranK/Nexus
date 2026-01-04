import mongoose from 'mongoose';
import { User } from '../src/models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

const promoteToAdmin = async (email: string) => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        // Add admin role if not present
        if (!user.roles.includes('admin')) {
            user.roles.push('admin');
            await user.save();
            console.log(`Successfully promoted ${user.name} (${email}) to ADMIN.`);
        } else {
            console.log(`User ${user.name} is already an ADMIN.`);
        }

    } catch (error) {
        console.error('Error promoting user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

// Usage: tsx scripts/make-admin.ts <email>
const emailArg = process.argv[2];

if (!emailArg) {
    console.log('No email provided. Listing all users:');
    const listUsers = async () => {
        try {
            await mongoose.connect(MONGODB_URI);
            const users = await User.find({});
            users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.roles.join(', ')}]`));

            if (users.length > 0) {
                console.log('\nRun usage: tsx scripts/make-admin.ts <email> OR tsx scripts/make-admin.ts first');
            } else {
                console.log('No users found.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            await mongoose.disconnect();
            process.exit(0);
        }
    };
    listUsers();
} else if (emailArg === 'first') {
    const promoteFirst = async () => {
        try {
            await mongoose.connect(MONGODB_URI);
            const user = await User.findOne({});
            if (user) {
                if (!user.roles.includes('admin')) {
                    user.roles.push('admin');
                    await user.save();
                    console.log(`Successfully promoted ${user.name} (${user.email}) to ADMIN.`);
                } else {
                    console.log(`User ${user.name} is already an ADMIN.`);
                }
            } else {
                console.error('No users found to promote.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            await mongoose.disconnect();
            process.exit(0);
        }
    };
    promoteFirst();
} else {
    promoteToAdmin(emailArg);
}
