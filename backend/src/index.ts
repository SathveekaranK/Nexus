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
import resourceRoutes from './routes/resource.routes';
import aiRoutes from './routes/ai.routes';
import roleRoutes from './routes/role.routes';
import youtubeRoutes from './routes/youtube.routes';
import userRoleRoutes from './routes/user-role.routes';
import notificationRoutes from './routes/notification.routes';
import eventRoutes from './routes/event.routes';
import { authMiddleware } from './middleware/auth';
import { roomSocketHandler } from './sockets/room.socket';
import { chatSocketHandler } from './sockets/chat.socket';
import { apiSocketHandler } from './sockets/api.socket';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://nexus-frontend-theta-kohl.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.set('io', io);

const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/channels', authMiddleware, channelRoutes);
app.use('/api/rooms', authMiddleware, roomRoutes);
app.use('/api/resources', authMiddleware, resourceRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/roles', authMiddleware, roleRoutes);
app.use('/api/youtube', authMiddleware, youtubeRoutes);
app.use('/api/user-roles', authMiddleware, userRoleRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/events', authMiddleware, eventRoutes);

// Socket.io Handlers
roomSocketHandler(io);
chatSocketHandler(io);
apiSocketHandler(io);

// Init Scheduled Tasks
import { DailyCleanup } from './services/DailyCleanup';
DailyCleanup.init();

// Start Server
connectDB().then(async () => {
    // Reset all users to offline on server startup
    try {
        const { User } = await import('./models/User');
        await User.updateMany({}, { status: 'offline' });
        console.log('All users reset to offline status');

        // Ensure Nexus Bot User Exists
        const botEmail = 'nexus@bot.com';
        let botUser = await User.findOne({ email: botEmail });
        if (!botUser) {
            botUser = await User.create({
                name: 'Nexus AI',
                email: botEmail,
                password: process.env.BOT_PASSWORD || 'nexus-ai-secure-password-123',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nexus',
                status: 'online',
                roles: ['admin', 'bot']
            });
            console.log('Nexus Bot User Created');
        } else {
            // Ensure bot is always online and has correct roles/avatar if updated
            botUser.status = 'online';
            if (!botUser.roles.includes('bot')) botUser.roles.push('bot');
            if (!botUser.roles.includes('admin')) botUser.roles.push('admin');
            await botUser.save();
            console.log('Nexus Bot User Verified');
        }

        // Ensure Default General Channel Exists
        const Channel = (await import('./models/Channel')).Channel;
        let generalChannel = await Channel.findOne({ name: 'general' });
        if (!generalChannel) {
            generalChannel = await Channel.create({
                name: 'general',
                description: 'General discussion',
                type: 'channel',
                creator: botUser._id,
                members: [botUser._id]
            });
            console.log('General Channel Created');
        } else {
            // Ensure Bot is in General
            if (!generalChannel.members.includes(botUser._id)) {
                generalChannel.members.push(botUser._id);
                await generalChannel.save();
            }
        }

    } catch (error) {
        console.error('Startup maintenance failed:', error);
    }

    server.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
});

