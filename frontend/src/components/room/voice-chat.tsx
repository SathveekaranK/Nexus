import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { Mic, MicOff, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { leaveRoom } from '@/services/room/roomSlice';
import AgoraRTC, {
    AgoraRTCProvider,
    useJoin,
    useLocalMicrophoneTrack,
    usePublish,
    useRemoteUsers,
    useRemoteAudioTracks,
} from "agora-rtc-react";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

// Inner Component handling the logic
function VoiceChatInner() {
    const dispatch = useDispatch<AppDispatch>();
    const roomId = useSelector((state: RootState) => state.room?.roomId);
    const user = useSelector((state: RootState) => state.auth?.user);
    const [isMuted, setIsMuted] = useState(false);

    // 1. Get Local Mic
    const { localMicrophoneTrack, isLoading: isMicLoading } = useLocalMicrophoneTrack(true);

    // Cleanup Mic on Unmount
    useEffect(() => {
        return () => {
            if (localMicrophoneTrack) {
                localMicrophoneTrack.stop();
                localMicrophoneTrack.close();
            }
        };
    }, [localMicrophoneTrack]);

    // 2. Join Channel
    // Channel name must be string.
    const { isLoading: isJoining, isConnected, error: joinError } = useJoin(
        {
            appid: APP_ID,
            channel: roomId || "lobby",
            token: null, // Basic auth
            uid: user?.id || null
        },
        !!roomId && !!APP_ID
    );

    // 3. Publish Mic
    usePublish([localMicrophoneTrack]);

    // 4. Remote Users & Audio
    const remoteUsers = useRemoteUsers();
    const { audioTracks } = useRemoteAudioTracks(remoteUsers);

    // 5. Play Remote Audio
    useEffect(() => {
        audioTracks.forEach((track) => track.play());
    }, [audioTracks]);

    // Listen for remote mute
    useEffect(() => {
        import('@/components/room/room-manager').then(({ getSocket }) => {
            const socket = getSocket();
            if (!socket) return;

            const handleRemoteMute = async ({ targetUserId, mutedBy }: any) => {
                if (user && (user.id === targetUserId || (user as any)._id === targetUserId)) {
                    if (localMicrophoneTrack && !isMuted) {
                        await localMicrophoneTrack.setMuted(true);
                        setIsMuted(true);
                        // Optional: Show toast
                        // console.log(`Muted by ${mutedBy}`);
                    }
                }
            };

            socket.on('muted_by_admin', handleRemoteMute);
            return () => {
                socket.off('muted_by_admin', handleRemoteMute);
            };
        });
    }, [localMicrophoneTrack, isMuted, user]);

    // Mute Logic
    const toggleMute = async () => {
        if (localMicrophoneTrack) {
            await localMicrophoneTrack.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    // Connection Status Text
    const statusText = isJoining ? "Joining..." : isConnected ? "Connected" : joinError ? "Error" : "Disconnected";
    // Count only if connected
    const activeListenerCount = isConnected ? remoteUsers.length : 0;

    if (!APP_ID) {
        return <div className="text-xs text-red-500 font-mono">Missing Agora APP ID</div>;
    }

    return (
        <div className="flex items-center gap-2 bg-secondary/80 backdrop-blur-sm p-1.5 rounded-xl border border-white/10 shadow-lg">
            {/* Status Indicator */}
            <div className="flex flex-col px-3 border-r border-white/10 mr-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                    {isConnected ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Live Voice
                        </>
                    ) : (
                        <>
                            <span className="h-2 w-2 rounded-full bg-slate-500" />
                            Offline
                        </>
                    )}
                </span>
                <span className="text-xs font-mono text-white/90">
                    {activeListenerCount + 1} User{activeListenerCount + 1 !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant={isMuted ? "destructive" : "secondary"}
                    className={`h-9 px-3 gap-2 transition-all font-medium ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20 text-white ring-1 ring-inset ring-white/10'}`}
                    onClick={toggleMute}
                    disabled={isMicLoading || !localMicrophoneTrack}
                >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-green-400" />}
                    {isMuted ? "Unmute" : "Mute"}
                </Button>

                <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                    onClick={() => dispatch(leaveRoom())}
                    title="Disconnect"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// Wrapper to provide Client
export default function VoiceChat() {
    // Create client once using useMemo to prevent recreation on re-renders
    const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

    return (
        <AgoraRTCProvider client={client}>
            <VoiceChatInner />
        </AgoraRTCProvider>
    );
}
