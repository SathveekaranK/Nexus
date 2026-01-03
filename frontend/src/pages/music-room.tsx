import { useEffect, useState } from 'react';
import MusicRoomView from '@/components/music/music-room-view';
import { useParams } from 'react-router-dom';
import { MUSIC_ROOMS } from '@/lib/data';
import { MusicRoom, User } from '@/lib/types';

interface MusicRoomPageProps {
    currentUser: User;
}

export default function MusicRoomPage({ currentUser }: MusicRoomPageProps) {
    const { roomId } = useParams<{ roomId: string }>();
    const [room, setRoom] = useState<MusicRoom | null>(null);

    useEffect(() => {
        const roomData = MUSIC_ROOMS.find(r => r.id === roomId) || MUSIC_ROOMS[0];
        setRoom(roomData);
    }, [roomId]);

    if (!room) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Music room not found.</div>
    }

    return <MusicRoomView room={room} currentUser={currentUser} />;
}
