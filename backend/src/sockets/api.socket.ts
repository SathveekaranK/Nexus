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
                if (typeof callback === 'function') {
                    callback({ success: true, data });
                }
            } catch (error: any) {
                console.error("Socket API Error:", error);
                if (callback) {
                    callback({ success: false, message: error.message });
                }
            }
        };

        // --- Users ---
        socket.on('user:list', (data, callback) => {
            handleRequest(() => getUsersInternal(userId), callback);
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
                if (typeof callback === 'function') {
                    callback({ success: true, data: message });
                }

                // Real-time broadcast
                if (message.channelId) {
                    io.to(message.channelId).emit('message:new', message);
                } else if (message.recipientId) {
                    // For DMs, emit to both sender and recipient
                    const recipientIdStr = message.recipientId?._id?.toString() || message.recipientId?.toString();
                    const senderIdStr = message.senderId?._id?.toString() || message.senderId?.toString();

                    if (recipientIdStr) io.to(`user:${recipientIdStr}`).emit('message:new', message);
                    if (senderIdStr) io.to(`user:${senderIdStr}`).emit('message:new', message);
                }

            } catch (error: any) {
                console.error('Socket Message Error:', error);
                if (typeof callback === 'function') {
                    callback({ success: false, message: error.message });
                }
            }
        });

        // Join User Room to receive DM events
        const userRoom = `user:${userId}`;
        socket.join(userRoom);

        // Join Channel Rooms
        // We need to fetch user channels and join them
        // This is async, so we do it on connect
        getUserChannelsInternal(userId).then(channels => {
            channels.forEach((c: any) => {
                socket.join(c._id.toString());
            });
        });



        // --- Room Management ---
        socket.on('channel:join', (data) => {
            const { channelId } = data;
            if (channelId) socket.join(channelId);
        });

        socket.on('channel:leave', (data) => {
            const { channelId } = data;
            if (channelId) socket.leave(channelId);
        });

        // --- Typing ---
        socket.on('message:typing', (data) => {
            const { channelId } = data;
            // Broadcast to room except sender
            socket.to(channelId).emit('message:typing', data);
        });

        socket.on('message:typing_stop', (data) => {
            const { channelId } = data;
            socket.to(channelId).emit('message:typing_stop', data);
        });

        // --- Setup ---
        socket.on('user:setup', (data) => {
            // Already setup on connection, but can be used for status override
        });

        socket.on('disconnect', () => {
            // console.log('User disconnected from API Socket');
        });
    });

    // Listen to internal events
    const { socketEvents } = require('../services/socketEvents');

    socketEvents.on('notification:new', (data: any) => {
        const { userId, notification } = data;
        // Broadcast to user's room
        io.to(`user:${userId}`).emit('notification:new', notification);
    });
};
