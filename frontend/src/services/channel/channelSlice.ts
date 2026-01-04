import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/components/api/axios';
import { Channel } from '@/lib/types';

export interface ChannelState {
    channels: Channel[];
    isLoading: boolean;
    error: string | null;
}

const initialState: ChannelState = {
    channels: [],
    isLoading: false,
    error: null,
};

export const fetchChannels = createAsyncThunk(
    'channels/fetchChannels',
    async (_, { rejectWithValue }) => {
        try {
            // Backend endpoint: GET /api/channels
            const response: any = await api.get('/channels');
            return response.data; // Expecting { success: true, data: [...] } -> intercepted to data
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const createChannel = createAsyncThunk(
    'channels/createChannel',
    async (channelData: Partial<Channel>, { rejectWithValue }) => {
        try {
            // Backend endpoint: POST /api/channels
            const response: any = await api.post('/channels', channelData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const addMemberToChannel = createAsyncThunk(
    'channels/addMember',
    async ({ channelId, userId }: { channelId: string; userId: string }, { rejectWithValue }) => {
        try {
            const response: any = await api.post(`/channels/${channelId}/members`, { userId });
            return response.data; // Updated channel object
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const leaveChannel = createAsyncThunk(
    'channels/leaveChannel',
    async (channelId: string, { rejectWithValue }) => {
        try {
            await api.post(`/channels/${channelId}/leave`);
            return channelId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const channelSlice = createSlice({
    name: 'channels',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchChannels.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchChannels.fulfilled, (state, action) => {
                state.isLoading = false;
                state.channels = action.payload.map((c: any) => ({
                    ...c,
                    id: c._id || c.id,
                    memberIds: c.members || c.memberIds
                }));
            })
            .addCase(fetchChannels.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Create
            .addCase(createChannel.fulfilled, (state, action) => {
                const newChannel = action.payload;
                state.channels.push({
                    ...newChannel,
                    id: newChannel._id || newChannel.id,
                    memberIds: newChannel.members || newChannel.memberIds
                });
            })
            // Add Member
            .addCase(addMemberToChannel.fulfilled, (state, action) => {
                const updatedChannel = action.payload;
                const index = state.channels.findIndex(c => c.id === (updatedChannel._id || updatedChannel.id));
                if (index !== -1) {
                    state.channels[index] = {
                        ...updatedChannel,
                        id: updatedChannel._id || updatedChannel.id,
                        memberIds: updatedChannel.members || updatedChannel.memberIds
                    };
                }
            })
            // Leave Channel
            .addCase(leaveChannel.fulfilled, (state, action) => {
                const channelId = action.payload;
                state.channels = state.channels.filter(c => c.id !== channelId);
            });
    },
});

export default channelSlice.reducer;
