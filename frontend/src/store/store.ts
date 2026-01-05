// @ts-nocheck
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/services/auth/authSlice';
import userReducer from '@/services/user/userSlice';
import messageReducer from '@/services/message/messageSlice';
import channelReducer from '../services/channel/channelSlice';
import roomReducer from '../services/room/roomSlice';
import notificationReducer from '../services/notification/notificationSlice';
import eventReducer from '../services/event/eventSlice';
import roleReducer from '../services/role/roleSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: userReducer,
        messages: messageReducer,
        channels: channelReducer,
        room: roomReducer,
        notifications: notificationReducer,
        events: eventReducer,
        roles: roleReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these paths in the state
                ignoredPaths: ['events.events'],
                // Ignore these action types
                ignoredActions: ['events/create/fulfilled', 'events/fetch/fulfilled', 'events/update/fulfilled'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
