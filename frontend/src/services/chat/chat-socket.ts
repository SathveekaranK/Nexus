import { io, Socket } from 'socket.io-client';

let chatSocket: Socket | null = null;

export interface ChatMessage {
    _id?: string;
    senderId: string;
    channelId?: string;
    recipientId?: string;
    content: string;
    tempId?: string;
    type?: string;
    replyTo?: string;
    createdAt?: string;
}

export const connectChatSocket = (token: string) => {
    if (chatSocket?.connected) return chatSocket;

    chatSocket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
        transports: ['websocket'],
        auth: { token }
    });

    chatSocket.on('connect', () => {
        // Connected
    });

    chatSocket.on('disconnect', () => {
        // Disconnected
    });

    return chatSocket;
};

export const joinChannel = (channelId: string) => {
    chatSocket?.emit('join_channel', { channelId });
};

export const leaveChannel = (channelId: string) => {
    chatSocket?.emit('leave_channel', { channelId });
};

export const sendChatMessage = (message: ChatMessage) => {
    chatSocket?.emit('send_message', message);
};

export const emitTyping = (channelId: string, userId: string, userName: string) => {
    chatSocket?.emit('typing', { channelId, userId, userName });
};

export const emitStopTyping = (channelId: string, userId: string) => {
    chatSocket?.emit('stop_typing', { channelId, userId });
};

export const markMessageRead = (messageId: string, userId: string) => {
    chatSocket?.emit('mark_read', { messageId, userId });
};

export const onNewMessage = (callback: (message: any) => void) => {
    chatSocket?.on('new_message', callback);
    return () => chatSocket?.off('new_message', callback);
};

export const onUserTyping = (callback: (data: { userId: string; userName: string; channelId: string }) => void) => {
    chatSocket?.on('user_typing', callback);
    return () => chatSocket?.off('user_typing', callback);
};

export const onUserStopTyping = (callback: (data: { userId: string; channelId: string }) => void) => {
    chatSocket?.on('user_stop_typing', callback);
    return () => chatSocket?.off('user_stop_typing', callback);
};

export const onMessageSent = (callback: (data: { tempId?: string; message: any }) => void) => {
    chatSocket?.on('message_sent', callback);
    return () => chatSocket?.off('message_sent', callback);
};

export const disconnectChatSocket = () => {
    if (chatSocket) {
        chatSocket.disconnect();
        chatSocket = null;
    }
};

export const setupSocket = (userId: string) => {
    chatSocket?.emit('setup_socket', { userId });
};

export const onUserStatusChange = (callback: (data: { userId: string; status: string }) => void) => {
    chatSocket?.on('user_status_change', callback);
    return () => chatSocket?.off('user_status_change', callback);
};

export const getChatSocket = () => chatSocket;
