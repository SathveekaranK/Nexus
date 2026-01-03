import apiFromAxios from '@/components/api/axios';
import { User, Channel, Message } from './types';

// Adapting to match the 'api' object structure expected by ChatView and others for now.
export const api = {
    // Auth
    login: (credentials: any) => apiFromAxios.post<{ token: string; user: User }>('/auth/login', credentials),
    register: (userData: any) => apiFromAxios.post<{ token: string; user: User }>('/auth/register', userData),
    getMe: () => apiFromAxios.get<User>('/auth/me'),

    // Users
    getUsers: () => apiFromAxios.get<User[]>('/users'),

    // Channels (Placeholder logic, assuming backend has these routes eventually)
    getChannels: (workspaceId?: string) => apiFromAxios.get<Channel[]>(`/channels${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
    createChannel: (data: Partial<Channel>) => apiFromAxios.post<Channel>('/channels', data),

    // Messages
    getMessages: (channelId: string) => apiFromAxios.get<Message[]>(`/messages?channelId=${channelId}`),
    createMessage: (data: any) => apiFromAxios.post<Message>('/messages', data),

    // File Upload (Adapting old logic)
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiFromAxios.post<{ url: string }>('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // AI Chat
    chatAi: (query: string, contextMessages: string[]) => apiFromAxios.post<{ message: string }>('/ai/chat', { query, contextMessages }),

    // Other legacy endpoints can be added here
    uploadExcel: (dataUri: string) => apiFromAxios.post<{ message: string; success: boolean }>('/files/upload-excel', { dataUri }),
    deleteMessage: (messageId: string) => apiFromAxios.delete(`/messages/${messageId}`),
    reactToMessage: (messageId: string, emoji: string) => apiFromAxios.post(`/messages/${messageId}/reactions`, { emoji }),
    pinMessage: (messageId: string) => apiFromAxios.post(`/messages/${messageId}/pin`),
    addSong: (roomId: string, song: any) => apiFromAxios.post(`/music/${roomId}/songs`, song),
};
