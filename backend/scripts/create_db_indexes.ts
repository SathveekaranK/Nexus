
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI missing in env.");
    process.exit(1);
}

async function run() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log("Connected to MongoDB.");

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("Database connection not established");
        }

        // 1. Text Index on Messages (Content)
        console.log("Creating Text Index on Messages...");
        await db.collection('messages').createIndex({ content: "text" });

        // 2. Index on Context Fields (for filtering)
        console.log("Creating Component Indexes...");
        await db.collection('messages').createIndex({ channelId: 1, createdAt: -1 });
        await db.collection('messages').createIndex({ "sentiment.label": 1 });
        await db.collection('messages').createIndex({ topics: 1 });

        // 3. Memory Index
        console.log("Creating Memory Text Index...");
        await db.collection('memories').createIndex({ content: "text", tags: "text" });

        // 3. TTL Index for Analytics Cache (Already in model, but ensuring)
        // await db.collection('analyticscaches').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

        console.log("All indexes created successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Error creating indexes:", error);
        process.exit(1);
    }
}

run();
