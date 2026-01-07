import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import {
    createChannelInternal,
    getUserChannelsInternal,
    getMessagesInternal,
    sendMessageInternal,
    getUsersInternal
} from '../controllers/internal.controller';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback-secret-dont-use-in-prod';

export const apiSocketHandler = (io: Server) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            // @ts-ignore
            socket.user = decoded;
            next();
        } catch (e) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        // @ts-ignore
        const userId = socket.user.userId;
        console.log(`User connected to API Socket: ${userId}`);

        // Helper to handle requests
        const handleRequest = async (handler: () => Promise<any>, callback: any) => {
            try {
                const data = await handler();
                callback({ success: true, data });
            } catch (error: any) {
                console.error("Socket API Error:", error);
                callback({ success: false, message: error.message });
            }
        };

        // --- Users ---
        socket.on('user:list', (data, callback) => {
            handleRequest(() => getUsersInternal(), callback);
        });

        // --- Channels ---
        socket.on('channel:list', (data, callback) => {
            handleRequest(() => getUserChannelsInternal(userId), callback);
        });

        socket.on('channel:create', (data, callback) => {
            handleRequest(() => createChannelInternal(userId, data), callback);
        });

        // --- Messages ---
        socket.on('message:list', (queryParams, callback) => {
            handleRequest(() => getMessagesInternal(userId, queryParams), callback);
        });

        socket.on('message:send', async (data, callback) => {
            // We need custom handling here to emit events to room
            try {
                const message = await sendMessageInternal(userId, data);
                callback({ success: true, data: message });

                // Real-time broadcast
                if (message.channelId) {
                    io.to(message.channelId).emit('message:new', message);
                } else if (message.recipientId) {
                    // For DMs, emit to both sender and recipient
                    // We need to map userIds to socketIds or emit to a room named by userId
                    // Assuming we have a room per user (common pattern) or we broadcast to all sockets of that user
                    // For now, let's assume we don't have user-specific rooms set up in *this* file, 
                    // but chat.socket.ts might have them. 
                    // Actually, usually users join a room named `user:${userId}`
                    io.to(`user:${message.recipientId.toString()}`).emit('message:new', message);
                    io.to(`user:${message.senderId.toString()}`).emit('message:new', message);
                }

            } catch (error: any) {
                callback({ success: false, message: error.message });
            }
        });

        // Join User Room to receive DM events
        socket.join(`user:${userId}`);

        // Join Channel Rooms
        // We need to fetch user channels and join them
        // This is async, so we do it on connect
        getUserChannelsInternal(userId).then(channels => {
            channels.forEach((c: any) => {
                socket.join(c._id.toString());
            });
        });

        socket.on('disconnect', () => {
            // console.log('User disconnected from API Socket');
        });
    });
};
