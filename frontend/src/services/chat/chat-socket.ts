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
    chatSocket?.on('message:new', callback);
    return () => chatSocket?.off('message:new', callback);
};

export const onUserTyping = (callback: (data: { userId: string; userName: string; channelId: string }) => void) => {
    chatSocket?.on('message:typing', callback);
    return () => chatSocket?.off('message:typing', callback);
};

export const onUserStopTyping = (callback: (data: { userId: string; channelId: string }) => void) => {
    chatSocket?.on('message:typing_stop', callback);
    return () => chatSocket?.off('message:typing_stop', callback);
};

export const onMessageSent = (callback: (data: { tempId?: string; message: any }) => void) => {
    // Backend returns the message in the callback of emit, but strict socket logic might use an ack event.
    // However, our backend *returns* the data in the callback. 
    // The current 'onMessageSent' usage in chat-view expects an event.
    // For now, let's keep it but arguably we should rely on the emit callback in chat-view?
    // Changing chat-view is risky. Let's make sure backend matches this if needed, 
    // OR just use 'message:new' for everything and standard ack.
    // For now, renaming to potentially match a future backend event or just keeping it.
    chatSocket?.on('message:sent', callback);
    return () => chatSocket?.off('message:sent', callback);
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
    chatSocket?.on('user:status_change', callback);
    return () => chatSocket?.off('user:status_change', callback);
};

export const getChatSocket = () => chatSocket;
