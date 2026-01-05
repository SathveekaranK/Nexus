import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api-client';

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'resource_added' | 'mention' | 'message' | 'meeting_reminder' | 'role_mention' | 'event_created';
    title: string;
    message: string;
    timestamp?: string;
    createdAt?: string;
    resourceId?: string;
    relatedMessageId?: string;
    relatedEventId?: string;
    channelId?: string;
    read: boolean;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetch',
    async () => {
        const response: any = await api.getNotifications();
        return response;
    }
);

export const markNotificationAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId: string) => {
        await api.markNotificationAsRead(notificationId);
        return notificationId;
    }
);

export const markAllNotificationsAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async () => {
        await api.markAllNotificationsAsRead();
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Omit<Notification, 'read' | 'id' | 'timestamp'>>) => {
            const newNotification: Notification = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                read: false,
                ...action.payload,
            };
            state.notifications.unshift(newNotification);
            state.unreadCount += 1;
        },
        markAsRead: (state, action: PayloadAction<string>) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification && !notification.read) {
                notification.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllAsRead: (state) => {
            state.notifications.forEach(n => n.read = true);
            state.unreadCount = 0;
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload as any;
                state.notifications = payload.data || [];
                state.unreadCount = payload.unreadCount || 0;
            })
            .addCase(fetchNotifications.rejected, (state) => {
                state.loading = false;
            })
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const notification = state.notifications.find(n => n.id === action.payload);
                if (notification && !notification.read) {
                    notification.read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                state.notifications.forEach(n => n.read = true);
                state.unreadCount = 0;
            });
    },
});

export const { addNotification, markAsRead, markAllAsRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
