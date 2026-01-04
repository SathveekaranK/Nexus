// @ts-nocheck
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Users, Play, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import CreateRoomDialog from './create-room-dialog';
import { useDispatch } from 'react-redux';
import { createRoom, joinRoom } from '@/services/room/roomSlice';
import { AppDispatch } from '@/store/store';
import { useToast } from '@/hooks/use-toast';

interface MusicLobbyProps {
    onJoinRoom: (roomId: string) => void;
}

export default function MusicLobby({ onJoinRoom }: MusicLobbyProps) {
    const [rooms, setRooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();

    const fetchRooms = async () => {
        try {
            // Direct fetch for now until api-client is fully updated
            const res = await fetch(`${import.meta.env.VITE_API_URL}/rooms`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) {
                setRooms(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch rooms", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    const handleCreateRoom = async (name: string, genre: string) => {
        setIsCreating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/rooms/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, genre })
            });
            const data = await res.json();

            if (data.success) {
                dispatch(joinRoom(data.data.roomId)); // Sync Redux
                onJoinRoom(data.data.roomId); // Switch View
                setIsCreateOpen(false);
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to create room.", variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Music Lounge</h1>
                        <p className="text-muted-foreground">Discover active parties and join the vibe.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Start a Room
                    </Button>
                </div>

                {/* Room Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        [...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-[180px] rounded-xl bg-white/5" />
                        ))
                    ) : rooms.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No active parties right now. Be the first to start one!</p>
                        </div>
                    ) : (
                        rooms
                            .filter(room => room.members && room.members.length > 0)
                            .map((room, i) => (
                                <motion.div
                                    key={room.roomId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative overflow-hidden rounded-xl border border-white/5 bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer"
                                    onClick={() => {
                                        dispatch(joinRoom(room.roomId));
                                        onJoinRoom(room.roomId);
                                    }}
                                >
                                    {/* Thumbnail Background (Blurred) */}
                                    <div className="absolute inset-0 z-0">
                                        {room.currentMedia?.thumbnail ? (
                                            <img src={room.currentMedia.thumbnail} className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent" />
                                        )}
                                    </div>

                                    <div className="relative z-10 p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary-foreground border border-primary/20">
                                                {room.genre || 'General'}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-black/40 px-2 py-1 rounded-full">
                                                <Users className="h-3 w-3" />
                                                {room.members?.length || 0}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-lg text-white group-hover:text-primary transition-colors">{room.name}</h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {room.currentMedia?.title !== 'No Media Playing' ? room.currentMedia.title : 'Deep Focus • No Music'}
                                            </p>
                                        </div>

                                        <div className="pt-2 flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {/* Fake avatars for visual polish */}
                                                {[...Array(Math.min(3, room.members?.length || 1))].map((_, idx) => (
                                                    <div key={idx} className="h-6 w-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-black" />
                                                ))}
                                            </div>
                                            <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-0">
                                                Join <Play className="ml-2 h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                    )}
                </div>
            </div>

            <CreateRoomDialog
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreate={handleCreateRoom}
                isLoading={isCreating}
            />
        </div>
    );
}
