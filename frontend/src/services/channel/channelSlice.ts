import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api-client';
import { Channel } from '@/lib/types';

export interface ChannelState {
    channels: Channel[];
    isLoading: boolean;
    error: string | null;
    unreadCounts: Record<string, number>;
    lastActivity: Record<string, string>;
}

const initialState: ChannelState = {
    channels: [],
    isLoading: false,
    error: null,
    unreadCounts: {},
    lastActivity: {},
};

export const fetchChannels = createAsyncThunk(
    'channels/fetchChannels',
    async (_, { rejectWithValue }) => {
        try {
            // Backend endpoint: GET /api/channels
            const response = await api.getChannels();
            return response;
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
            const response = await api.createChannel(channelData);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const addMemberToChannel = createAsyncThunk(
    'channels/addMember',
    async ({ channelId, userId }: { channelId: string; userId: string }, { rejectWithValue }) => {
        try {
            const response = await api.addMemberToChannel(channelId, userId);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const leaveChannel = createAsyncThunk(
    'channels/leaveChannel',
    async (channelId: string, { rejectWithValue }) => {
        try {
            await api.leaveChannel(channelId);
            return channelId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const markChannelRead = createAsyncThunk(
    'channels/markRead',
    async (channelId: string) => {
        try {
            await api.markChannelRead(channelId);
            return channelId;
        } catch (error: any) {
            console.error('Failed to mark read:', error);
            return channelId;
        }
    }
);

const channelSlice = createSlice({
    name: 'channels',
    initialState,
    reducers: {
        handleNewMessage: (state, action) => {
            const { channelId, senderId, timestamp, currentUserId, activeChannelId } = action.payload;

            // Update last activity for sorting
            if (channelId) {
                state.lastActivity[channelId] = timestamp || new Date().toISOString();
            }

            // Increment unread count if:
            // 1. It's not my own message
            // 2. I am NOT currently looking at this channel
            if (senderId !== currentUserId && channelId !== activeChannelId && channelId) {
                state.unreadCounts[channelId] = (state.unreadCounts[channelId] || 0) + 1;
            }
        },
        // Optimistic local update (called by MainLayout before API)
        markChannelReadLocal: (state, action) => {
            const channelId = action.payload;
            if (channelId) {
                state.unreadCounts[channelId] = 0;
            }
        }
    },
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
                // Map unread counts and last activity from backend
                action.payload.forEach((c: any) => {
                    const id = c._id || c.id;
                    if (c.unreadCount !== undefined) {
                        state.unreadCounts[id] = c.unreadCount;
                    }
                    if (c.lastMessageAt) {
                        state.lastActivity[id] = c.lastMessageAt;
                    }
                });
            })
            .addCase(fetchChannels.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Create
            .addCase(createChannel.fulfilled, (state, action) => {
                const newChannel: any = action.payload;
                state.channels.push({
                    ...newChannel,
                    id: newChannel._id || newChannel.id,
                    memberIds: newChannel.members || newChannel.memberIds
                });
            })
            // Add Member
            .addCase(addMemberToChannel.fulfilled, (state, action) => {
                const updatedChannel: any = action.payload;
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
            })
            // Mark Read
            .addCase(markChannelRead.fulfilled, (state, action) => {
                const channelId = action.payload;
                if (channelId) state.unreadCounts[channelId] = 0;
            });
    },
});

export const { handleNewMessage, markChannelReadLocal } = channelSlice.actions;
export default channelSlice.reducer;
