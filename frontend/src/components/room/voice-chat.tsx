import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    const roomId = useSelector((state: RootState) => state.room?.roomId);
    const user = useSelector((state: RootState) => state.auth?.user);
    const [isMuted, setIsMuted] = useState(false);

    // 1. Get Local Mic
    const { localMicrophoneTrack, isLoading: isMicLoading } = useLocalMicrophoneTrack(true);

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
        <div className="p-2 bg-secondary/50 rounded-lg flex items-center gap-3 min-w-[140px]">
            <div className="flex flex-col">
                <span className="text-xs font-mono font-bold flex items-center gap-1">
                    Voice Chat
                    {isConnected && <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {isJoining ? <Loader2 className="h-3 w-3 animate-spin" /> : statusText}
                    {isConnected && <span>({activeListenerCount + 1})</span>}
                </span>
            </div>

            <Button
                size="icon"
                variant={isMuted ? "destructive" : "secondary"}
                className={`h-8 w-8 transition-all ${isMuted ? '' : 'ring-1 ring-green-500/50'}`}
                onClick={toggleMute}
                disabled={isMicLoading || !localMicrophoneTrack}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
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
