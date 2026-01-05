import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api-client';

export interface Role {
    _id: string;
    name: string;
    permissions: string[];
}

interface RoleState {
    roles: Role[];
    loading: boolean;
    error: string | null;
}

const initialState: RoleState = {
    roles: [],
    loading: false,
    error: null,
};

export const fetchRoles = createAsyncThunk(
    'roles/fetchRoles',
    async () => {
        const response: any = await api.getRoles();
        // Handle potential different response structures
        if (response.data) return response.data;
        return response;
    }
);

const roleSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoles.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.loading = false;
                state.roles = action.payload;
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch roles';
            });
    },
});

export default roleSlice.reducer;
