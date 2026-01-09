import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api-client';

export interface RoomState {
    roomId: string | null;
    members: any[]; // Array of user objects with name, avatar, email, roles
    currentMedia: {
        url: string | null;
        title: string;
        thumbnail: string;
        isPlaying: boolean;
        timestamp: number;
        duration: number;
        playedAt: number;
    };
    isLoading: boolean;
    error: string | null;
}

const initialState: RoomState = {
    roomId: null,
    members: [],
    currentMedia: {
        url: null,
        title: 'No Media Playing',
        thumbnail: '',
        isPlaying: false,
        timestamp: 0,
        duration: 0,
        playedAt: 0
    },
    isLoading: false,
    error: null,
};

export const createRoom = createAsyncThunk(
    'room/createRoom',
    async (data: { name?: string; genre?: string } | undefined, { rejectWithValue }) => {
        try {
            // Updated api-client required for this
            const response: any = await api.createRoom(data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const joinRoom = createAsyncThunk(
    'room/joinRoom',
    async (roomId: string, { rejectWithValue }) => {
        try {
            // Fetch room state
            const response: any = await api.getRoom(roomId);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {
        setRoomId: (state, action) => {
            state.roomId = action.payload;
        },
        updateMedia: (state, action) => {
            state.currentMedia = {
                ...state.currentMedia,
                ...action.payload
            };
        },
        updateMembers: (state, action) => {
            // Merge new members with existing state to preserve ephemeral 'isMuted' property
            const newMembers = action.payload;
            state.members = newMembers.map((newM: any) => {
                const existing = state.members.find((cur: any) =>
                    (cur._id === newM._id) || (cur.id === newM._id)
                );
                // Default to true (Muted) if new, or preserve existing
                return {
                    ...newM,
                    isMuted: existing ? existing.isMuted : true
                };
            });
        },
        updateMemberStatus: (state, action) => {
            const { userId, isMuted } = action.payload;
            state.members = state.members.map(m =>
                (m._id === userId || m.id === userId) ? { ...m, isMuted } : m
            );
        },
        leaveRoom: (state) => {
            state.roomId = null;
            state.members = [];
            state.currentMedia = initialState.currentMedia;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createRoom.fulfilled, (state, action) => {
                const room = action.payload.data || action.payload; // Handle wrapper
                state.roomId = room.roomId;
                state.members = room.members || [];
                state.currentMedia = room.currentMedia || initialState.currentMedia;
            })
            .addCase(joinRoom.fulfilled, (state, action) => {
                const room = action.payload.data || action.payload; // Handle wrapper
                state.roomId = room.roomId;
                state.members = room.members || [];
                state.currentMedia = room.currentMedia || initialState.currentMedia;
            });
    }
});

export const { setRoomId, updateMedia, updateMembers, updateMemberStatus, leaveRoom } = roomSlice.actions;
export default roomSlice.reducer;
