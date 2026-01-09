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

const pendingListeners: Array<{ event: string, callback: any }> = [];

export const connectChatSocket = (token: string) => {
    if (chatSocket?.connected) return chatSocket;

    chatSocket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
        transports: ['websocket'],
        auth: { token }
    });

    chatSocket.on('connect', () => {
        // Connected
        // Attach pending listeners
        while (pendingListeners.length > 0) {
            const listener = pendingListeners.shift();
            if (listener) {
                chatSocket?.on(listener.event, listener.callback);
            }
        }
    });

    chatSocket.on('disconnect', () => {
        // Disconnected
    });

    return chatSocket;
};

const addListener = (event: string, callback: any) => {
    if (chatSocket) {
        chatSocket.on(event, callback);
    } else {
        pendingListeners.push({ event, callback });
    }
};

const removeListener = (event: string, callback: any) => {
    if (chatSocket) {
        chatSocket.off(event, callback);
    }
    // Remove from pending if exists
    const index = pendingListeners.findIndex(l => l.event === event && l.callback === callback);
    if (index !== -1) {
        pendingListeners.splice(index, 1);
    }
};

export const joinChannel = (channelId: string) => {
    chatSocket?.emit('channel:join', { channelId });
};

export const leaveChannel = (channelId: string) => {
    chatSocket?.emit('channel:leave', { channelId });
};

export const sendChatMessage = (message: ChatMessage) => {
    chatSocket?.emit('message:send', message);
};

export const emitTyping = (channelId: string, userId: string, userName: string) => {
    chatSocket?.emit('message:typing', { channelId, userId, userName });
};

export const emitStopTyping = (channelId: string, userId: string) => {
    chatSocket?.emit('message:typing_stop', { channelId, userId });
};

export const markMessageRead = (messageId: string, userId: string) => {
    chatSocket?.emit('message:read', { messageId, userId });
};

export const onNewMessage = (callback: (message: any) => void) => {
    addListener('message:new', callback);
    return () => removeListener('message:new', callback);
};

export const onUserTyping = (callback: (data: { userId: string; userName: string; channelId: string }) => void) => {
    addListener('message:typing', callback);
    return () => removeListener('message:typing', callback);
};

export const onUserStopTyping = (callback: (data: { userId: string; channelId: string }) => void) => {
    addListener('message:typing_stop', callback);
    return () => removeListener('message:typing_stop', callback);
};

export const onMessageSent = (callback: (data: { tempId?: string; message: any }) => void) => {
    addListener('message:sent', callback);
    return () => removeListener('message:sent', callback);
};

export const disconnectChatSocket = () => {
    if (chatSocket) {
        chatSocket.disconnect();
        chatSocket = null;
    }
};

export const setupSocket = (userId: string) => {
    chatSocket?.emit('user:setup', { userId });
};

export const onUserStatusChange = (callback: (data: { userId: string; status: string }) => void) => {
    addListener('user:status_change', callback);
    return () => removeListener('user:status_change', callback);
};

export const getChatSocket = () => chatSocket;
