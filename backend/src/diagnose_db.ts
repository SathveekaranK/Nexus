import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus';
console.log('Testing connection to:', uri);

mongoose.connect(uri)
    .then(async () => {
        console.log('Successfully connected to MongoDB');

        // Force database creation by inserting a dummy document
        const db = mongoose.connection.db;
        if (db) {
            await db.collection('connection_tests').insertOne({ timestamp: new Date() });
            console.log('Dummy document inserted into "connection_tests" collection.');
            console.log('Database "nexus" should now be visible in your MongoDB tools.');
        }

        process.exit(0);
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });
