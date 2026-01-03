import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDB } from './config/db';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;


import { router as apiRoutes } from './routes';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
