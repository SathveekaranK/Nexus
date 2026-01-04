import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { AppDispatch, RootState } from '@/store/store';
import { addPeer, removePeer, updateMedia } from '@/services/room/roomSlice';

let socket: Socket | null = null;

export const getSocket = () => socket;

interface RoomManagerProps {
    children: React.ReactNode;
}

const RoomManager = ({ children }: RoomManagerProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const { roomId } = useSelector((state: RootState) => state.room);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!roomId || !user) return;

        // Initialize Socket
        socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
            socket?.emit('join_room', {
                roomId,
                userId: user.id
                // Voice Join is handled separately by VoiceChat component
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

        // Voice Events
        socket.on('user_connected', (newPeerId) => {
            console.log('[RoomManager] Received user_connected event. Peer ID:', newPeerId);
            if (newPeerId) {
                dispatch(addPeer(newPeerId));
                console.log('[RoomManager] Dispatched addPeer for:', newPeerId);
            }
        });

        socket.on('user_disconnected', (peerId) => {
            dispatch(removePeer(peerId));
        });

        return () => {
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
