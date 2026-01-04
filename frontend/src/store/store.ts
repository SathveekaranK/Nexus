import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/services/auth/authSlice';
import userReducer from '@/services/user/userSlice';
import messageReducer from '@/services/message/messageSlice';
import channelReducer from '@/services/channel/channelSlice';
import roomReducer from '@/services/room/roomSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: userReducer,
        messages: messageReducer,
        channels: channelReducer,
        room: roomReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
