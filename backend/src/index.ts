import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import messageRoutes from './routes/message.routes';
import channelRoutes from './routes/channel.routes';
import { authMiddleware } from './middleware/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes); // Protect users
app.use('/api/messages', authMiddleware, messageRoutes); // Protect messages
app.use('/api/channels', authMiddleware, channelRoutes); // Protect channels

// Start Server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
});
