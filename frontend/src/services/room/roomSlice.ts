import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api-client';

export interface RoomState {
    roomId: string | null;
    members: string[];
    currentMedia: {
        url: string | null;
        title: string;
        thumbnail: string;
        isPlaying: boolean;
        timestamp: number;
        duration: number;
        playedAt: number;
    };
    voicePeers: string[];
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
    voicePeers: [],
    isLoading: false,
    error: null,
};

export const createRoom = createAsyncThunk(
    'room/createRoom',
    async (_, { rejectWithValue }) => {
        try {
            // Updated api-client required for this
            const response: any = await api.createRoom(); // We'll add this to api-client
            return response.data;
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
            const response: any = await api.getRoom(roomId); // We'll add this to api-client
            return response.data;
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
            state.members = action.payload;
        },
        addPeer: (state, action) => {
            if (!state.voicePeers.includes(action.payload)) {
                state.voicePeers.push(action.payload);
            }
        },
        removePeer: (state, action) => {
            state.voicePeers = state.voicePeers.filter(id => id !== action.payload);
        },
        leaveRoom: (state) => {
            state.roomId = null;
            state.members = [];
            state.currentMedia = initialState.currentMedia;
            state.voicePeers = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createRoom.fulfilled, (state, action) => {
                state.roomId = action.payload.roomId;
                state.members = action.payload.members;
                state.currentMedia = action.payload.currentMedia;
            })
            .addCase(joinRoom.fulfilled, (state, action) => {
                state.roomId = action.payload.roomId;
                state.members = action.payload.members;
                state.currentMedia = action.payload.currentMedia;
            });
    }
});

export const { setRoomId, updateMedia, updateMembers, addPeer, removePeer, leaveRoom } = roomSlice.actions;
export default roomSlice.reducer;
