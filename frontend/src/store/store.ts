import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/services/auth/authSlice';
import userReducer from '@/services/user/userSlice';
import messageReducer from '@/services/message/messageSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: userReducer,
        messages: messageReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
