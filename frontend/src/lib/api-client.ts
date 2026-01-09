import apiFromAxios from '@/components/api/axios';
import { User, Channel, Message } from './types';
import { socketRequest } from './socket-client';

// Keep legacy Axios for Auth / Uploads as per plan
const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || 'Request failed');
    }
    return res.json();
};

export const api = {
    // --- AUTH (Keep REST) ---
    login: (credentials: any) => apiFromAxios.post<{ token: string; user: User }>('/auth/login', credentials) as unknown as Promise<{ token: string; user: User }>,
    register: (userData: any) => apiFromAxios.post<{ token: string; user: User }>('/auth/register', userData) as unknown as Promise<{ token: string; user: User }>,
    getMe: () => apiFromAxios.get<User>('/auth/me') as unknown as Promise<User>,
    updateProfile: (data: { name?: string; bio?: string; status?: string; avatar?: string }) => apiFromAxios.put<User>('/users/profile', data) as unknown as Promise<User>,

    // --- USERS (Socket) ---
    getUsers: () => socketRequest<User[]>('user:list'),

    // --- CHANNELS (Socket) ---
    // Note: workspaceId is not yet used in backend socket handler but kept in signature for compatibility
    getChannels: (workspaceId?: string) => socketRequest<Channel[]>('channel:list', { workspaceId }),
    createChannel: (data: Partial<Channel>) => socketRequest<Channel>('channel:create', data),
    addMemberToChannel: (channelId: string, userId: string) => apiFromAxios.post(`/channels/${channelId}/members`, { userId }) as unknown as Promise<Channel>,
    leaveChannel: (channelId: string) => apiFromAxios.post(`/channels/${channelId}/leave`) as unknown as Promise<void>,
    markChannelRead: (channelId: string) => apiFromAxios.post(`/channels/${channelId}/read`) as unknown as Promise<void>,

    // --- MESSAGES (Socket) ---
    getMessages: (params: { channelId?: string; contactId?: string }) => socketRequest<Message[]>('message:list', params),
    // Note: api-client.ts creates a message then returns it. Socket sends and returns it.
    createMessage: (data: any) => socketRequest<Message>('message:send', data),

    // Fallback/Legacy/Specific REST endpoints
    markMessageRead: (messageId: string) => apiFromAxios.post(`/messages/${messageId}/read`),
    deleteMessage: (messageId: string) => apiFromAxios.delete(`/messages/${messageId}`) as unknown as Promise<void>,

    // --- FILES (REST) ---
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiFromAxios.post<{ url: string }>('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }) as unknown as Promise<{ url: string }>;
    },

    // --- AI (Keep REST for now as per plan, though could move) ---
    chatAi: (query: string, context: string[]) => apiFromAxios.post('/ai/chat', { query, context }),
    uploadExcel: (dataUri: string) => apiFromAxios.post('/ai/excel', { dataUri }),

    // --- NOTIFICATIONS (Keep REST or Move - Plan said move, let's keep REST for safely first, actually plan said move but I haven't implemented backend socket for it yet. Sticking to REST for notifications for this step to minimize breakage) ---
    getNotifications: (read?: boolean) => apiFromAxios.get(`/notifications${read !== undefined ? `?read=${read}` : ''}`),
    markNotificationAsRead: (notificationId: string) => apiFromAxios.put(`/notifications/${notificationId}/read`),
    markAllNotificationsAsRead: () => apiFromAxios.put('/notifications/read-all'),

    // --- EVENTS (Keep REST for now as backend socket not implemented for this specifically yet) ---
    createEvent: (eventData: any) => apiFromAxios.post('/events', eventData),
    getEvents: (month?: string) => apiFromAxios.get(`/events${month ? `?month=${month}` : ''}`),
    getEventById: (eventId: string) => apiFromAxios.get(`/events/${eventId}`),
    updateEvent: (eventId: string, updates: any) => apiFromAxios.put(`/events/${eventId}`, updates),
    deleteEvent: (eventId: string) => apiFromAxios.delete(`/events/${eventId}`),
    addEventParticipant: (eventId: string, userId: string) => apiFromAxios.post(`/events/${eventId}/participants`, { userId }),
    removeEventParticipant: (eventId: string, userId: string) => apiFromAxios.delete(`/events/${eventId}/participants/${userId}`),

    // --- ROLES & PERMISSIONS (Keep REST) ---
    assignUserRoles: (userId: string, roles: string[]) => apiFromAxios.post('/user-roles/assign', { userId, roles }),
    getUserRoles: (userId: string) => apiFromAxios.get(`/user-roles/${userId}`),
    removeUserRole: (userId: string, role: string) => apiFromAxios.delete('/user-roles/remove', { data: { userId, role } }),

    getRoles: () => apiFromAxios.get<{ _id: string; name: string; permissions: string[] }[]>('/roles') as unknown as Promise<{ _id: string; name: string; permissions: string[] }[]>,
    createRole: (name: string, permissions: string[]) => apiFromAxios.post<{ _id: string; name: string; permissions: string[] }>('/roles', { name, permissions }) as unknown as Promise<{ _id: string; name: string; permissions: string[] }>,
    deleteRole: (id: string) => apiFromAxios.delete(`/roles/${id}`) as unknown as Promise<void>,

    // --- REACTIONS & PIN (Keep REST) ---
    reactToMessage: (messageId: string, emoji: string) => apiFromAxios.post(`/messages/${messageId}/reactions`, { emoji }) as unknown as Promise<void>,
    pinMessage: (messageId: string) => apiFromAxios.post(`/messages/${messageId}/pin`) as unknown as Promise<void>,

    // --- MUSIC (Keep REST) ---
    addSong: (roomId: string, song: any) => apiFromAxios.post(`/music/${roomId}/songs`, song) as unknown as Promise<any>,

    // --- ROOMS (Keep REST) ---
    createRoom: (data?: { name?: string; genre?: string }) => apiFromAxios.post<{ roomId: string; members: string[]; currentMedia: any }>('/rooms/create', data) as unknown as Promise<{ roomId: string; members: string[]; currentMedia: any }>,
    getRoom: (roomId: string) => apiFromAxios.get<{ roomId: string; members: string[]; currentMedia: any }>(`/rooms/${roomId}`) as unknown as Promise<{ roomId: string; members: string[]; currentMedia: any }>,

    // --- RESOURCES (Fetch Wrapper - Keep REST) ---
    getResources: async (type?: string, tag?: string) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (tag) params.append('tag', tag);
        const res = await fetch(`${API_URL}/resources?${params.toString()}`, {
            headers: getHeaders(),
        });
        return handleResponse(res);
    },
    createResource: async (data: any) => {
        const res = await fetch(`${API_URL}/resources`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    deleteResource: async (id: string) => {
        const res = await fetch(`${API_URL}/resources/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(res);
    },

    // --- AI CHAT (Fetch Wrapper - Keep REST) ---
    chat: async (messages: any[]) => {
        const res = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ messages }),
        });
        return handleResponse(res);
    },
    getAiHistory: async () => {
        const res = await fetch(`${API_URL}/ai/history`, {
            headers: getHeaders(),
        });
        return handleResponse(res);
    }
};
