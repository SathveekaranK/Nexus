import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/components/api/axios';
import { User } from '@/lib/types';

export interface UserState {
    users: User[];
    isLoading: boolean;
    error: string | null;
}

const initialState: UserState = {
    users: [],
    isLoading: false,
    error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
    // api in components/api/axios already returns response.data if successful,
    // assuming the interceptor setup logic I wrote.
    // Checking lib/axios.ts (old) vs new definition.
    // The new definition: return response.data;
    // So 'response' here will be the data object (which has { success: true, data: [...] })
    const response: any = await api.get('/users');

    // Based on backend: { success: true, data: [...] }
    const users = response.data;

    return users.map((user: any) => ({
        ...user,
        id: user._id || user.id,
    }));
});

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch users';
            });
    },
});

export default userSlice.reducer;
