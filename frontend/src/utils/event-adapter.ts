import { addMinutes, differenceInMinutes, format } from 'date-fns';

export interface BackendEvent {
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
}

export interface FrontendEvent {
    id: string | number;
    _id?: string;
    title: string;
    date: Date;
    time: string;
    duration: string;
    type: 'meeting' | 'event' | 'planning';
    participants?: string[];
    creatorId: string;
    meetingUrl?: string;
    location?: string;
}

const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)(h|m)/);
    if (!match) return 60;
    const value = parseInt(match[1]);
    const unit = match[2];
    return unit === 'h' ? value * 60 : value;
};

const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
};

export const toBackendEvent = (fe: FrontendEvent): Partial<BackendEvent> => {
    // Check if input is already in backend format or close to it
    // If 'time' is missing but 'startDate' is present (which NewEventDialog provides), use it directly
    if (!fe.time && (fe as any).startDate) {
        return {
            title: fe.title,
            description: (fe as any).description,
            startDate: (fe as any).startDate,
            endDate: (fe as any).endDate,
            type: fe.type,
            participants: fe.participants || [],
            meetingUrl: fe.meetingUrl,
            location: fe.location,
            creatorId: fe.creatorId
        };
    }

    // Fallback: if 'time' is missing but 'date' is present, try to construct without time
    const timeStr = fe.time || '12:00 PM';
    const [timePart, period] = timeStr.split(' ');
    const [hours, minutes] = (timePart || '12:00').split(':').map(Number);

    let hour24 = hours || 12;
    if (period?.toUpperCase() === 'PM' && hours !== 12) hour24 += 12;
    if (period?.toUpperCase() === 'AM' && hours === 12) hour24 = 0;

    const startDate = new Date(fe.date || new Date());
    startDate.setHours(hour24, minutes || 0, 0, 0);

    const durationMinutes = parseDuration(fe.duration || '1h');
    const endDate = addMinutes(startDate, durationMinutes);

    return {
        title: fe.title,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: fe.type,
        participants: fe.participants || [],
        meetingUrl: fe.meetingUrl,
        location: fe.location,
    };
};

export const toFrontendEvent = (be: BackendEvent): FrontendEvent => {
    const startDate = new Date(be.startDate);
    const endDate = new Date(be.endDate);
    const durationMinutes = differenceInMinutes(endDate, startDate);

    // Helper to safely extract ID
    const getId = (obj: any): string => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj._id || obj.id || '';
    };

    // Helper to safely extract participants array
    const getParticipantIds = (list: any[]): string[] => {
        if (!Array.isArray(list)) return [];
        return list.map(getId);
    };

    return {
        id: be._id || be.id || '',
        _id: be._id,
        title: be.title,
        date: startDate,
        time: format(startDate, 'hh:mm a'),
        duration: formatDuration(durationMinutes),
        type: be.type,
        participants: getParticipantIds(be.participants), // Normalize to strings
        creatorId: getId(be.creatorId),                   // Normalize to string
        meetingUrl: be.meetingUrl,
        location: be.location,
    };
};
