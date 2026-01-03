import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
};
