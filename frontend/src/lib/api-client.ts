import apiFromAxios from '@/components/api/axios';
import { User, Channel, Message } from './types';

// Adapting to match the 'api' object structure expected by ChatView and others for now.
// Note: apiFromAxios has an interceptor that returns response.data, so we cast the return type to T directly.
export const api = {
    // Auth
    login: (credentials: any) => apiFromAxios.post<{ token: string; user: User }>('/auth/login', credentials) as unknown as Promise<{ token: string; user: User }>,
    register: (userData: any) => apiFromAxios.post<{ token: string; user: User }>('/auth/register', userData) as unknown as Promise<{ token: string; user: User }>,
    getMe: () => apiFromAxios.get<User>('/auth/me') as unknown as Promise<User>,

    // Users
    getUsers: () => apiFromAxios.get<User[]>('/users') as unknown as Promise<User[]>,

    // Channels (Placeholder logic, assuming backend has these routes eventually)
    getChannels: (workspaceId?: string) => apiFromAxios.get<Channel[]>(`/channels${workspaceId ? `?workspaceId=${workspaceId}` : ''}`) as unknown as Promise<Channel[]>,
    createChannel: (data: Partial<Channel>) => apiFromAxios.post<Channel>('/channels', data) as unknown as Promise<Channel>,

    // Messages
    getMessages: (channelId: string) => apiFromAxios.get<Message[]>(`/messages?channelId=${channelId}`) as unknown as Promise<Message[]>,
    createMessage: (data: any) => apiFromAxios.post<Message>('/messages', data) as unknown as Promise<Message>,

    // File Upload (Adapting old logic)
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiFromAxios.post<{ url: string }>('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }) as unknown as Promise<{ url: string }>;
    },

    // AI Chat
    chatAi: (query: string, contextMessages: string[]) => apiFromAxios.post<{ message: string }>('/ai/chat', { query, contextMessages }) as unknown as Promise<{ message: string }>,

    // Other legacy endpoints can be added here
    uploadExcel: (dataUri: string) => apiFromAxios.post<{ message: string; success: boolean }>('/files/upload-excel', { dataUri }) as unknown as Promise<{ message: string; success: boolean }>,
    deleteMessage: (messageId: string) => apiFromAxios.delete(`/messages/${messageId}`) as unknown as Promise<void>,
    reactToMessage: (messageId: string, emoji: string) => apiFromAxios.post(`/messages/${messageId}/reactions`, { emoji }) as unknown as Promise<void>,
    pinMessage: (messageId: string) => apiFromAxios.post(`/messages/${messageId}/pin`) as unknown as Promise<void>,
    addSong: (roomId: string, song: any) => apiFromAxios.post(`/music/${roomId}/songs`, song) as unknown as Promise<any>,

    // Rooms
    createRoom: () => apiFromAxios.post<{ roomId: string; members: string[]; currentSong: any }>('/rooms/create') as unknown as Promise<{ roomId: string; members: string[]; currentSong: any }>,
    getRoom: (roomId: string) => apiFromAxios.get<{ roomId: string; members: string[]; currentSong: any }>(`/rooms/${roomId}`) as unknown as Promise<{ roomId: string; members: string[]; currentSong: any }>,
};
