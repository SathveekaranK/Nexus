import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api-client';
import { toBackendEvent, toFrontendEvent, type BackendEvent, type FrontendEvent } from '@/utils/event-adapter';

export interface Event {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    type: 'meeting' | 'event' | 'planning';
    participants: string[];
    creatorId: string;
    meetingUrl?: string;
    location?: string;
    reminders?: Array<{ time: number; sent: boolean }>;
}

export interface EventState {
    events: FrontendEvent[];
    loading: boolean;
    error: string | null;
}

const initialState: EventState = {
    events: [],
    loading: false,
    error: null,
};

export const fetchEvents = createAsyncThunk(
    'events/fetch',
    async (month?: string) => {
        const response: any = await api.getEvents(month);
        return response;
    }
);

export const createEvent = createAsyncThunk(
    'events/create',
    async (eventData: Partial<FrontendEvent>) => {
        const backendData = toBackendEvent(eventData as FrontendEvent);
        const response: any = await api.createEvent(backendData);
        return response;
    }
);

export const updateEvent = createAsyncThunk(
    'events/update',
    async ({ eventId, updates }: { eventId: string; updates: Partial<FrontendEvent> }) => {
        const backendData = toBackendEvent(updates as FrontendEvent);
        const response: any = await api.updateEvent(eventId, backendData);
        return response;
    }
);

export const deleteEvent = createAsyncThunk(
    'events/delete',
    async (eventId: string) => {
        await api.deleteEvent(eventId);
        return eventId;
    }
);

export const addEventParticipant = createAsyncThunk(
    'events/addParticipant',
    async ({ eventId, userId }: { eventId: string; userId: string }) => {
        const response: any = await api.addEventParticipant(eventId, userId);
        return response;
    }
);

export const removeEventParticipant = createAsyncThunk(
    'events/removeParticipant',
    async ({ eventId, userId }: { eventId: string; userId: string }) => {
        const response: any = await api.removeEventParticipant(eventId, userId);
        return response;
    }
);

const eventSlice = createSlice({
    name: 'events',
    initialState,
    reducers: {
        clearEvents: (state) => {
            state.events = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEvents.fulfilled, (state, action) => {
                state.loading = false;
                // Axios interceptor returns the data directly (array of events)
                const payload = action.payload as any;
                const backendEvents = Array.isArray(payload) ? payload : (payload.data || []);
                state.events = backendEvents.map((be: BackendEvent) => toFrontendEvent(be));
            })
            .addCase(fetchEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch events';
            })
            .addCase(createEvent.fulfilled, (state, action) => {
                // Payload is the single event object
                const payload = action.payload as any;
                const eventData = payload.data || payload;
                const frontendEvent = toFrontendEvent(eventData);
                state.events.push(frontendEvent);
            })
            .addCase(updateEvent.fulfilled, (state, action) => {
                const payload = action.payload as any;
                const eventData = payload.data || payload;
                const updated = toFrontendEvent(eventData);
                const index = state.events.findIndex(e => e.id === updated.id || e._id === updated._id);
                if (index !== -1) {
                    state.events[index] = updated;
                }
            })
            .addCase(deleteEvent.fulfilled, (state, action) => {
                state.events = state.events.filter(e => e.id !== action.payload && e._id !== action.payload);
            })
            .addCase(addEventParticipant.fulfilled, (state, action) => {
                const payload = action.payload as any;
                const eventData = payload.data || payload;
                const updated = toFrontendEvent(eventData);
                const index = state.events.findIndex(e => e.id === updated.id || e._id === updated._id);
                if (index !== -1) {
                    state.events[index] = updated;
                }
            })
            .addCase(removeEventParticipant.fulfilled, (state, action) => {
                const payload = action.payload as any;
                const eventData = payload.data || payload;
                const updated = toFrontendEvent(eventData);
                const index = state.events.findIndex(e => e.id === updated.id || e._id === updated._id);
                if (index !== -1) {
                    state.events[index] = updated;
                }
            });
    },
});

export const { clearEvents } = eventSlice.actions;
export default eventSlice.reducer;
