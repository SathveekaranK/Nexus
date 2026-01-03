import { MUSIC_ROOMS, USERS, CURRENT_USER_ID } from '@/lib/data';
import MusicRoomView from '@/components/music/music-room-view';
import { useParams } from 'react-router-dom';

export default function MusicRoomPage() {
    const { roomId } = useParams<{ roomId: string }>();
    if (!roomId) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Room ID missing.</div>;
    }
    const room = MUSIC_ROOMS.find(r => r.id === roomId);
    const currentUser = USERS.find(u => u.id === CURRENT_USER_ID)!;

    if (!room) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Music room not found.</div>
    }

    return <MusicRoomView room={room} currentUser={currentUser} />;
}
