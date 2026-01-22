// @ts-nocheck
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music as MusicIcon, LogOut } from 'lucide-react';
import RoomManager from '@/components/room/room-manager';
import MediaSearch from '@/components/room/media-search';
import YouTubePlayer from '@/components/room/youtube-player';
// VoiceChat is now just the controls
import VoiceChat from '@/components/room/voice-chat';
import ActiveUsersPanel from '@/components/music/active-users-panel';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { createRoom, joinRoom, leaveRoom } from '@/services/room/roomSlice';
import { useToast } from '@/hooks/use-toast';
import MusicLobby from '@/components/music/music-lobby';
import QueueList from '@/components/music/queue-list';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Plus, ListMusic, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSocket } from '@/components/room/room-manager';
import Stage from '@/components/room/stage';

export default function MusicPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { roomId, members, currentMedia, queue } = useSelector((state: RootState) => state.room);
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');

    const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

    const handleAddToQueue = async () => {
        if (!searchQuery.trim()) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/youtube/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();

            if (data.success && data.data.length > 0) {
                const video = data.data[0];
                const socket = getSocket();

                if (socket) {
                    const parseDuration = (str: string) => {
                        if (!str) return 0;
                        const p = str.split(':').map(Number);
                        if (p.length === 2) return p[0] * 60 + p[1];
                        return p[0] * 3600 + p[1] * 60 + p[2];
                    };

                    const mediaItem = {
                        url: video.url,
                        title: video.title,
                        thumbnail: video.thumbnail,
                        duration: video.duration,
                        addedBy: 'User', // Should be current user name if available
                        isPlaying: false,
                        timestamp: 0,
                        playedAt: 0,
                        // Duration in seconds for logic if needed
                        durationSeconds: parseDuration(video.duration)
                    };

                    // Logic: If nothing playing, play immediately. Else add to queue.
                    if (!currentMedia.url || !currentMedia.isPlaying) {
                        socket.emit('play_media', {
                            roomId,
                            media: { ...mediaItem, isPlaying: true, playedAt: Date.now() }
                        });
                        toast({ title: "Now Playing", description: video.title });
                    } else {
                        socket.emit('add_to_queue', { roomId, item: mediaItem });
                        toast({ title: "Added to Queue", description: video.title });
                    }
                }
                setSearchQuery('');
            } else {
                toast({ title: "No results", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to search.", variant: "destructive" });
        }
    };

    // ... create/join/leave thunks ...

    const handleRemoveFromQueue = (index: number) => {
        const socket = getSocket();
        if (socket) {
            socket.emit('remove_from_queue', { roomId, index });
        }
    };

    // Fix: Explicitly pass undefined to satisfy the Thunk's signature if it expects an argument
    const handleCreateRoom = async () => {
        try {
            await dispatch(createRoom(undefined)).unwrap();
            toast({
                title: "Room Created",
                description: "Share the Room ID with friends to listen together!",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create room.",
                variant: "destructive"
            });
        }
    };

    const handleJoinRoom = async (id: string) => {
        if (!id.trim()) return;
        try {
            await dispatch(joinRoom(id)).unwrap();
            toast({
                title: "Joined Room",
                description: "Connected to music session.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to join room. Check the ID.",
                variant: "destructive"
            });
        }
    };

    const handleLeaveRoom = async () => {
        try {
            await dispatch(leaveRoom()).unwrap();
            toast({
                title: "Left Room",
                description: "You have left the music session.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to leave room.",
                variant: "destructive"
            });
        }
    };

    // If no room is joined, show the Lobby
    if (!roomId) {
        return (
            <div className="flex-1 flex flex-col h-full bg-background p-4 md:p-6">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-border gap-3 sm:gap-0">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Music Room</h1>
                        <p className="text-sm md:text-base text-muted-foreground">Enjoy music together in real-time</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {roomId && (
                            <Button onClick={handleLeaveRoom} variant="destructive" className="flex-1 sm:flex-none min-h-[44px]">
                                <LogOut className="mr-2 h-4 w-4" />
                                Leave Room
                            </Button>
                        )}
                    </div>
                </header>

                {!roomId ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                        <MusicLobby onJoinRoom={(id) => handleJoinRoom(id)} />
                    </div>
                ) : null}
            </div>
        );
    }

    // Room View
    return (
        <RoomManager>
            <div className="h-full flex flex-col p-3 md:p-6 space-y-4 md:space-y-6 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass p-3 md:p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg ring-2 ring-primary/10">
                            <MusicIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-bold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span>Music Lounge</span>
                                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-secondary w-fit">
                                    {roomId}
                                </span>
                            </h2>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                {currentMedia.isPlaying ? '🎵 Now Vibe-ing' : '💤 Chilling'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                        {/* NEW: Voice Controls embedded here */}
                        <VoiceChat />
                        <div className="h-8 w-px bg-border/50 mx-1 hidden sm:block" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive flex-1 sm:flex-none"
                            onClick={() => dispatch(leaveRoom())}
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Leave
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-1 min-h-0 overflow-hidden">

                    {/* Left: Player + Stage */}
                    <div className="lg:col-span-2 flex flex-col overflow-hidden">
                        <Card className="overflow-hidden border-0 shadow-2xl bg-black/40 ring-1 ring-white/10 flex-1 relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none" />
                            {/* WRAPPED WITH STAGE */}
                            <Stage>
                                <YouTubePlayer />
                            </Stage>
                        </Card>
                    </div>

                    {/* Right: Search & Active Users */}
                    <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
                        <Card className="glass-card border-white/5 p-3 md:p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-8 bg-primary rounded-full" />
                                <h3 className="font-semibold text-sm">Find Music</h3>
                            </div>
                            <MediaSearch />
                        </Card>

                        <Separator className="bg-white/5 lg:hidden" />

                        {/* Active Users Panel - Show on desktop or when plenty of space */}
                        <div className="flex-1 overflow-hidden min-h-[200px]">
                            <ActiveUsersPanel />
                        </div>
                    </div>
                </div>
            </div>
        </RoomManager>
    );
}
