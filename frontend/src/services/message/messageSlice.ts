import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/components/api/axios';
import { Message } from '@/lib/types';

export interface MessageState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

const initialState: MessageState = {
    messages: [],
    isLoading: false,
    error: null,
};

export const fetchMessages = createAsyncThunk(
    'messages/fetchMessages',
    async (params: { userId?: string; channelId?: string }, { rejectWithValue }) => {
        try {
            const { userId, channelId } = params;
            let url = '/messages?';
            if (channelId) url += `channelId=${channelId}`;
            else if (userId) url += `userId=${userId}`;

            const response: any = await api.get(url);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const sendMessage = createAsyncThunk(
    'messages/sendMessage',
    async (data: { recipientId?: string; channelId?: string; content: string }, { rejectWithValue }) => {
        try {
            const response: any = await api.post('/messages', data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const messageSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        clearMessages: (state) => {
            state.messages = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchMessages.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.isLoading = false;
                // action.payload is messages array
                state.messages = action.payload.map((msg: any) => ({
                    ...msg,
                    id: msg._id || msg.id,
                    timestamp: msg.createdAt
                }));
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Send
            .addCase(sendMessage.fulfilled, (state, action) => {
                const msg = action.payload;
                state.messages.push({
                    ...msg,
                    id: msg._id || msg.id,
                    timestamp: msg.createdAt
                });
            });
    },
});

export const { clearMessages } = messageSlice.actions;
export default messageSlice.reducer;
