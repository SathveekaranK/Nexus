import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let pendingRequests = new Map<string, { resolve: (data: any) => void, reject: (err: any) => void }>();

export const connectSocket = (token: string) => {
    if (socket?.connected) return socket;

    const url = import.meta.env.VITE_API_URL.replace('/api', '');

    socket = io(url, {
        transports: ['websocket'],
        auth: { token },
        reconnectionAttempts: 5,
        timeout: 10000
    });

    socket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err.message);
    });

    socket.on('connect', () => {
        console.log('Socket Connected');
    });

    socket.on('disconnect', () => {
        console.log('Socket Disconnected');
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// Generic Request Wrapper
export const socketRequest = <T>(event: string, data?: any): Promise<T> => {
    return new Promise((resolve, reject) => {
        if (!socket) {
            return reject(new Error('Socket not connected'));
        }

        // Timeout fallback
        const timeout = setTimeout(() => {
            reject(new Error('Request timed out'));
        }, 5000);

        socket.emit(event, data, (response: any) => {
            clearTimeout(timeout);
            if (response?.success) {
                resolve(response.data);
            } else {
                reject(new Error(response?.message || 'Socket request failed'));
            }
        });
    });
};
