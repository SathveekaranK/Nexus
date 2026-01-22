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
    queue: any[];
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
    queue: [],
    isLoading: false,
    error: null,
};

export const createRoom = createAsyncThunk(
    'room/createRoom',
    async (data: { name?: string; genre?: string } | undefined, { rejectWithValue }) => {
        try {
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
        updateQueue: (state, action) => {
            state.queue = action.payload;
        },
        updateMembers: (state, action) => {
            const newMembers = action.payload;
            state.members = newMembers.map((newM: any) => {
                const existing = state.members.find((cur: any) =>
                    (cur._id === newM._id) || (cur.id === newM._id)
                );
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
            state.queue = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createRoom.fulfilled, (state, action) => {
                const room = action.payload.data || action.payload;
                state.roomId = room.roomId;
                state.members = room.members || [];
                state.currentMedia = room.currentMedia || initialState.currentMedia;
                state.queue = room.queue || [];
            })
            .addCase(joinRoom.fulfilled, (state, action) => {
                const room = action.payload.data || action.payload;
                state.roomId = room.roomId;
                state.members = room.members || [];
                state.currentMedia = room.currentMedia || initialState.currentMedia;
                state.queue = room.queue || [];
            });
    }
});

export const { setRoomId, updateMedia, updateQueue, updateMembers, updateMemberStatus, leaveRoom } = roomSlice.actions;
export default roomSlice.reducer;
