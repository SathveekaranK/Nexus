// @ts-nocheck
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Music as MusicIcon, Users, LogOut } from 'lucide-react';
import RoomManager from '@/components/room/room-manager';
import MediaSearch from '@/components/room/media-search';
import YouTubePlayer from '@/components/room/youtube-player';
import VoiceChat from '@/components/room/voice-chat';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { createRoom, joinRoom, leaveRoom } from '@/services/room/roomSlice';
import { useToast } from '@/hooks/use-toast';
import MusicLobby from '@/components/music/music-lobby';

export default function MusicPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { roomId, members, currentMedia } = useSelector((state: RootState) => state.room);
    const { toast } = useToast();

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

    // If no room is joined, show the Lobby
    if (!roomId) {
        return (
            <div className="h-full bg-gradient-to-br from-background via-background/95 to-secondary/20 flex flex-col items-center justify-center p-4">
                <MusicLobby onJoinRoom={(id) => handleJoinRoom(id)} />
            </div>
        );
    }

    // Room View
    return (
        <RoomManager>
            <div className="h-full flex flex-col p-4 md:p-6 space-y-6 overflow-hidden bg-gradient-to-br from-background to-background/50">
                {/* Header */}
                <div className="flex items-center justify-between glass p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <MusicIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                Music Lounge
                                <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                    {roomId}
                                </span>
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {currentMedia.isPlaying ? 'Now Vibe-ing' : 'Chilling'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <VoiceChat />
                        <div className="h-8 w-px bg-border/50 mx-1" />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 rounded-full border border-white/5">
                            <Users className="h-4 w-4 text-green-400" />
                            <span className="text-sm font-medium">{members.length} Online</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => dispatch(leaveRoom())}
                        >
                            <LogOut className="mr-2 h-4 w-4" /> Leave
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                    {/* Left: Player & Visuals */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col">
                        <Card className="overflow-hidden border-0 shadow-2xl bg-black/40 ring-1 ring-white/10 flex-1 relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                            <YouTubePlayer />
                        </Card>
                    </div>

                    {/* Right: Search & Queue */}
                    <div className="lg:col-span-1 flex flex-col gap-4 h-full min-h-[400px]">
                        <Card className="flex-1 glass border-white/5 p-4 flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1 w-8 bg-primary rounded-full" />
                                <h3 className="font-semibold text-sm">Find Music</h3>
                            </div>

                            <MediaSearch />

                            <Separator className="bg-white/5" />
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Up Next</h4>
                                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic border-2 border-dashed border-white/5 rounded-lg bg-white/5">
                                    Queue system coming soon...
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </RoomManager>
    );
}
