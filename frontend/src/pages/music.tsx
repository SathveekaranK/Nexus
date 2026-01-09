// @ts-nocheck
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music as MusicIcon, LogOut } from 'lucide-react';
import RoomManager from '@/components/room/room-manager';
import MediaSearch from '@/components/room/media-search';
import YouTubePlayer from '@/components/room/youtube-player';
import VoiceChat from '@/components/room/voice-chat';
import ActiveUsersPanel from '@/components/music/active-users-panel';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { createRoom, joinRoom, leaveRoom } from '@/services/room/roomSlice';
import { useToast } from '@/hooks/use-toast';
import MusicLobby from '@/components/music/music-lobby';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Plus, ListMusic, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSocket } from '@/components/room/room-manager';

export default function MusicPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { roomId, members, currentMedia } = useSelector((state: RootState) => state.room);
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [queue, setQueue] = useState<string[]>([]);

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
                    // ALWAYS PLAY IMMEDIATELY per user request
                    const parseDuration = (str: string) => {
                        if (!str) return 0;
                        const p = str.split(':').map(Number);
                        if (p.length === 2) return p[0] * 60 + p[1];
                        return p[0] * 3600 + p[1] * 60 + p[2];
                    };

                    socket.emit('play_media', {
                        roomId,
                        media: {
                            ...currentMedia,
                            url: video.url,
                            title: video.title,
                            thumbnail: video.thumbnail,
                            isPlaying: true,
                            timestamp: 0,
                            duration: parseDuration(video.duration),
                            playedAt: Date.now()
                        }
                    });
                    toast({ title: "Now Playing", description: video.title });
                }
                setSearchQuery('');
            } else {
                toast({ title: "No results", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to search.", variant: "destructive" });
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
            <div className="flex-1 flex flex-col h-full bg-background p-4 md:p-6 mt-16 md:mt-0">
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
                        {/* DEBUG OVERLAY - Hidden when not in room, actually this block is for !roomId so socket is null anyway usually */}
                        {/* We only want debug overlay INSIDE the room or we need to handle it gracefully */}
                        <MusicLobby onJoinRoom={(id) => handleJoinRoom(id)} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 mt-4 md:mt-6 overflow-hidden relative">
                        {/* DEBUG OVERLAY - Only show when in room */}
                        <div className="absolute top-0 right-0 m-4 p-4 bg-black/80 text-green-400 font-mono text-xs rounded-lg z-50 pointer-events-none max-w-sm">
                            <h3 className="font-bold underline mb-2">DEBUG STATUS</h3>
                            <p>Room ID: {roomId}</p>
                            <p>Socket ID: {getSocket()?.id || 'Disconnected'}</p>
                            <p>Transport: {getSocket()?.io?.engine?.transport?.name || 'N/A'}</p>
                            <p>Media Title: {currentMedia?.title}</p>
                            <p>Is Playing: {String(currentMedia?.isPlaying)}</p>
                            <p>Members: {members.length}</p>
                            {!getSocket() && <p className="text-red-500 font-bold animate-pulse">SOCKET DISCONNECTED - ACTIONS FAILED</p>}
                        </div>

                        <div className="flex-1 flex flex-col gap-4">
                            <Card className="flex-1">
                                <CardHeader>
                                    <CardTitle className="text-lg md:text-xl">Now Playing</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <YouTubePlayer />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="w-full lg:w-96 flex flex-col gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                        <Users className="h-5 w-5" />
                                        Room Members ({members.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-32 md:h-40">
                                        <div className="space-y-2">
                                            {members.map((member, index) => (
                                                <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Users className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="text-sm font-medium">User {index + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            <Card className="flex-1">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                        <ListMusic className="h-5 w-5" />
                                        Queue
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Search YouTube..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddToQueue()}
                                            className="min-h-[44px]"
                                        />
                                        <Button onClick={handleAddToQueue} className="w-full min-h-[44px]">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add to Queue
                                        </Button>
                                        <ScrollArea className="h-48 md:h-64">
                                            <div className="space-y-2">
                                                {queue.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted">
                                                        <MusicIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs md:text-sm flex-1 truncate">{item}</span>
                                                    </div>
                                                ))}
                                                {queue.length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-4">No songs in queue</p>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Room View
    return (
        <RoomManager>
            <div className="h-full flex flex-col p-3 md:p-6 space-y-4 md:space-y-6 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 mt-16 md:mt-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass p-3 md:p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                        {/* DEBUG BUTTON */}
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                const socket = getSocket();
                                console.log("Debug Play Clicked. Socket:", socket?.id, "Room:", roomId);
                                if (socket && roomId) {
                                    socket.emit('play_media', {
                                        roomId,
                                        media: {
                                            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll for reliability
                                            title: 'Debug Test Video',
                                            thumbnail: '',
                                            isPlaying: true,
                                            timestamp: 0,
                                            duration: 212,
                                            playedAt: Date.now()
                                        }
                                    });
                                }
                            }}
                        >
                            DEBUG: FORCE PLAY
                        </Button>
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

                    {/* Left: Player */}
                    <div className="lg:col-span-2 flex flex-col overflow-hidden">
                        <Card className="overflow-hidden border-0 shadow-2xl bg-black/40 ring-1 ring-white/10 flex-1 relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none" />
                            <YouTubePlayer />
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
