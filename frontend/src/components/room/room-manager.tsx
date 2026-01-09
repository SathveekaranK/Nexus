import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { AppDispatch, RootState } from '@/store/store';
import { updateMedia, updateMembers, updateMemberStatus } from '@/services/room/roomSlice';

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
        if (!roomId || !user) {
            return;
        }

        // Initialize Socket
        socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
            transports: ['websocket'],
            auth: {
                token: localStorage.getItem('token')
            }
        });

        socket.on('connect', () => {
            console.log("Socket Connected:", socket?.id);
            socket?.emit('join_room', {
                roomId,
                user // Send full user object (contains id, name, avatar, etc.)
            });
        });

        socket.on('disconnect', () => {
            console.warn("Socket Disconnected");
        });

        // Media Events
        socket.on('media_state_changed', (media) => {
            console.log("Socket: Media State Changed", media);
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

        socket.on('member_status_updated', (data) => {
            dispatch(updateMemberStatus(data)); // { userId, isMuted }
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
    }, [roomId, user?.id, dispatch]);

    return <>{children}</>;
};

export default RoomManager;
