import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import http from 'http';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import messageRoutes from './routes/message.routes';
import channelRoutes from './routes/channel.routes';
import roomRoutes from './routes/room.routes';
import youtubeRoutes from './routes/youtube.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { roomSocketHandler } from './sockets/room.socket';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes); // Protect users
app.use('/api/messages', authMiddleware, messageRoutes); // Protect messages
app.use('/api/channels', authMiddleware, channelRoutes); // Protect channels
app.use('/api/rooms', authMiddleware, roomRoutes); // Protect rooms
app.use('/api/youtube', authMiddleware, youtubeRoutes); // Generic Media Search

// Socket.io Handler
roomSocketHandler(io);

// Start Server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
});
