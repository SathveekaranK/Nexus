import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { AppDispatch, RootState } from '@/store/store';
import { updateMedia, updateMembers } from '@/services/room/roomSlice';

let socket: Socket | null = null;

export const getSocket = () => socket;

interface RoomManagerProps {
    children: React.ReactNode;
}

const RoomManager = ({ children }: RoomManagerProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const roomId = useSelector((state: RootState) => state.room?.roomId);
    const user = useSelector((state: RootState) => state.auth?.user);

    useEffect(() => {
        if (!roomId || !user) return;

        // Initialize Socket
        socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            socket?.emit('join_room', {
                roomId,
                user // Send full user object (contains id, name, avatar, etc.)
            });
        });

        // Media Events
        socket.on('media_state_changed', (media) => {
            dispatch(updateMedia(media));
        });

        socket.on('media_seeked', (media) => {
            dispatch(updateMedia(media));
        });

        socket.on('sync_media', (media) => {
            dispatch(updateMedia(media));
        });

        // Member Updates
        socket.on('room_members_updated', (members) => {
            dispatch(updateMembers(members));
        });


        // Voice Events handled by Agora (voice-chat.tsx)

        const handleBeforeUnload = () => {
            if (socket) {
                socket.emit('leave_room', { roomId, userId: user.id });
                socket.disconnect();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (socket) {
                socket.emit('leave_room', { roomId, userId: user.id });
                socket.disconnect();
                socket = null;
            }
        };
    }, [roomId, user, dispatch]);

    return <>{children}</>;
};

export default RoomManager;
