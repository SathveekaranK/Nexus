import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Music, Copy, LogOut, Search, Mic, Radio } from 'lucide-react';
import { createRoom, joinRoom, leaveRoom } from '@/services/room/roomSlice';
import VoiceChat from '@/components/room/voice-chat';
import RoomManager from '@/components/room/room-manager';
import YouTubePlayer from '@/components/room/youtube-player';
import MediaSearch from '@/components/room/media-search';
import { toast } from '@/hooks/use-toast';


import { ScrollArea } from '@/components/ui/scroll-area';

export default function MusicPage() {
    const dispatch = useDispatch();
    const { roomId, members, currentMedia } = useSelector((state: RootState) => state.room);
    const { user } = useSelector((state: RootState) => state.auth);
    const [joinInput, setJoinInput] = useState('');

    const handleCreateRoom = async () => {
        try {
            await dispatch(createRoom() as any).unwrap();
            toast({ title: "Room created!", description: "Welcome to your new music lounge." });
        } catch (error) {
            toast({ title: "Failed to create room", variant: "destructive" });
        }
    };

    const handleJoinRoom = async () => {
        if (!joinInput) return;
        try {
            await dispatch(joinRoom(joinInput) as any).unwrap();
            toast({ title: "Joined room!", description: "Syncing playback..." });
        } catch (error) {
            toast({ title: "Failed to join room", variant: "destructive" });
        }
    };

    const handleLeaveRoom = () => {
        dispatch(leaveRoom());
    };

    const copyRoomId = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            toast({ title: "Room ID copied!" });
        }
    };

    if (roomId) {
        return (
            <RoomManager>
                <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background/95 to-secondary/20 flex flex-col">
                    {/* Glass Header */}
                    <header className="h-16 border-b bg-background/60 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Music className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight">Music Lounge</h1>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">{roomId}</span>
                                    <Button variant="ghost" size="icon" onClick={copyRoomId} className="h-5 w-5 hover:bg-transparent hover:text-primary">
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-border/50">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-xs font-medium">{members.length} Online</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLeaveRoom} className="text-muted-foreground hover:text-destructive transition-colors">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </header>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Main Stage (Player) */}
                        <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center bg-black/5">
                            <div className="w-full max-w-4xl space-y-6">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                    <div className="relative">
                                        <YouTubePlayer />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tight">{currentMedia.title}</h2>
                                    <p className="text-muted-foreground">Now Playing</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar (Glassmorphism) */}
                        <div className="w-96 border-l bg-background/40 backdrop-blur-sm flex flex-col">

                            {/* Voice Chat Section */}
                            <div className="p-4 border-b">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Mic className="h-4 w-4 text-primary" />
                                    Voice Channel
                                </h3>
                                {user && <VoiceChat />}
                            </div>

                            {/* Search Section */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="p-4 pb-2">
                                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <Search className="h-4 w-4" />
                                        Find Music
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Search YouTube and click to play immediately.
                                    </p>
                                    <MediaSearch />
                                </div>
                            </div>

                            {/* Members Section */}
                            <div className="p-4 border-t bg-secondary/10">
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Members
                                </h3>
                                <ScrollArea className="h-32">
                                    <div className="space-y-2">
                                        {members.map((memberId, i) => (
                                            <div key={memberId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                                                <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">User {memberId.slice(-4)}</p>
                                                    <p className="text-xs text-muted-foreground">{i === 0 ? 'Host' : 'Listener'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </div>
            </RoomManager>
        );
    }

    // Modern Landing Page
    return (
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

            <Card className="w-full max-w-lg relative border-primary/20 shadow-2xl">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <Radio className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Nexus Music</CardTitle>
                        <CardDescription className="text-lg mt-2">Listen together in real-time.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 px-8 pb-8">
                    <Button className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-primary/25 transition-all" onClick={handleCreateRoom}>
                        Start a Listening Room
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-4 text-muted-foreground font-semibold">Or join a friend</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Input
                            placeholder="Paste Room ID here..."
                            value={joinInput}
                            onChange={(e) => setJoinInput(e.target.value)}
                            className="h-11 bg-secondary/50"
                        />
                        <Button variant="secondary" onClick={handleJoinRoom} className="h-11 px-6">
                            Join
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
