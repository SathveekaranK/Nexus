import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message';
import { Channel } from '../models/Channel';

interface TypingData {
    channelId: string;
    userId: string;
    userName: string;
}

interface MessageData {
    channelId?: string;
    recipientId?: string;
    content: string;
    senderId: string;
    type?: string;
    replyTo?: string;
}

export const chatSocketHandler = (io: Server) => {
    io.on('connection', (socket: Socket) => {

        // Join channel or DM room
        socket.on('join_channel', ({ channelId }) => {
            const roomName = channelId.startsWith('dm-')
                ? `dm:${channelId.replace('dm-', '')}`
                : `channel:${channelId}`;
            socket.join(roomName);
        });

        // Leave channel or DM room
        socket.on('leave_channel', ({ channelId }) => {
            const roomName = channelId.startsWith('dm-')
                ? `dm:${channelId.replace('dm-', '')}`
                : `channel:${channelId}`;
            socket.leave(roomName);
        });

        // Send message
        socket.on('send_message', async (data: MessageData & { tempId?: string }) => {
            try {
                const message = new Message({
                    senderId: data.senderId,
                    channelId: data.channelId,
                    recipientId: data.recipientId,
                    content: data.content,
                    type: data.type || 'text',
                    replyTo: data.replyTo,
                    readBy: [{ userId: data.senderId, readAt: new Date() }]
                });

                const savedMessage = await message.save();

                // Populate sender with full details
                const populatedMessage = await Message.findById(savedMessage._id)
                    .populate('senderId', 'name avatar email roles status')
                    .populate('replyTo')
                    .lean();

                // Emit to channel or DM
                if (data.channelId) {
                    io.to(`channel:${data.channelId}`).emit('new_message', populatedMessage);
                } else if (data.recipientId) {
                    // For DMs, emit to both sender and recipient
                    io.to(`dm:${data.recipientId}`).emit('new_message', populatedMessage);
                    io.to(`dm:${data.senderId}`).emit('new_message', populatedMessage);
                }

                // Send delivery confirmation with tempId
                socket.emit('message_sent', { tempId: data.tempId, message: populatedMessage });
            } catch (error) {
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Typing indicators
        socket.on('typing', ({ channelId, userId, userName }) => {
            const roomName = channelId.startsWith('dm-')
                ? `dm:${channelId.replace('dm-', '')}`
                : `channel:${channelId}`;
            socket.to(roomName).emit('user_typing', { userId, userName, channelId });
        });

        socket.on('stop_typing', ({ channelId, userId }) => {
            const roomName = channelId.startsWith('dm-')
                ? `dm:${channelId.replace('dm-', '')}`
                : `channel:${channelId}`;
            socket.to(roomName).emit('user_stop_typing', { userId, channelId });
        });

        // Message read status
        socket.on('mark_read', async ({ messageId, userId }) => {
            try {
                const message = await Message.findById(messageId);
                if (message) {
                    // Implement read receipts logic here if needed
                }
            } catch (error) {
                // Silent fail
            }
        });

        // Setup socket with user ID for presence
        socket.on('setup_socket', async ({ userId }) => {
            socket.data.userId = userId;
            socket.join(`user:${userId}`);

            try {
                // Update user status to online
                await import('../models/User').then(({ User }) =>
                    User.findByIdAndUpdate(userId, { status: 'online' })
                );

                // Broadcast online status
                io.emit('user_status_change', { userId, status: 'online' });
            } catch (error) {
                console.error('Error updating status to online:', error);
            }
        });

        socket.on('disconnect', async () => {
            const userId = socket.data.userId;
            if (userId) {
                try {
                    // Update user status to offline
                    await import('../models/User').then(({ User }) =>
                        User.findByIdAndUpdate(userId, { status: 'offline' })
                    );

                    // Broadcast offline status
                    io.emit('user_status_change', { userId, status: 'offline' });
                } catch (error) {
                    console.error('Error updating status to offline:', error);
                }
            }
        });
    });
};
