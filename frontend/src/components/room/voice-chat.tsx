import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { Mic, MicOff, LogOut, Video as VideoIcon, VideoOff, Monitor, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { leaveRoom } from '@/services/room/roomSlice';
import { cn } from '@/lib/utils';
import { useAgora } from '@/context/agora-context';

export default function VoiceChatControls() {
    const dispatch = useDispatch<AppDispatch>();
    const {
        isConnected,
        isActive,
        isMuted,
        isCameraOn,
        isScreenSharing,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
        leaveCall,
        joinCall,
        remoteUsers
    } = useAgora();

    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-expand if active and connected to show controls clearly? 
    // Or maybe keep compact until user interacts. 
    // Let's keep it compact by default.

    const activeListenerCount = isConnected ? remoteUsers.length : 0;

    return !isActive ? (
        <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            onClick={joinCall}
        >
            <Mic className="h-4 w-4" />
            Join Voice
        </Button>
    ) : (
        <div className={cn(
            "transition-all duration-300 ease-in-out border border-white/10 shadow-2xl z-40 overflow-hidden bg-black/40 backdrop-blur-md rounded-xl p-1.5 flex items-center gap-2",
            // We can remove the fixed positioning if we want to place it in the header naturally.
            // For now, let's assume it's placed in the header flex container as before.
        )}>
            {/* Status Info */}
            <div className="flex flex-col px-3 border-r border-white/10 mr-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                    {isConnected ? <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> : <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />}
                    {isConnected ? "Connected" : "Connecting..."}
                </span>
                <span className="text-xs font-mono text-foreground/90">
                    {activeListenerCount + 1} User{activeListenerCount !== 0 ? 's' : ''}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant={isMuted ? "destructive" : "secondary"}
                    className={cn("h-9 w-9 p-0 md:w-auto md:px-3 md:py-2 gap-2 transition-all font-medium", isMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 text-foreground")}
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-green-400" />}
                    <span className="hidden md:inline">{isMuted ? "Unmute" : "Mute"}</span>
                </Button>

                <Button
                    size="sm"
                    variant={isCameraOn ? "default" : "secondary"}
                    className={cn("h-9 w-9 p-0 md:w-auto md:px-3 md:py-2 gap-2 transition-all font-medium", isCameraOn ? "bg-primary text-white" : "bg-white/10 text-foreground")}
                    onClick={toggleCamera}
                    title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                >
                    {isCameraOn ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    <span className="hidden md:inline">{isCameraOn ? "Cam On" : "Cam Off"}</span>
                </Button>

                <Button
                    size="sm"
                    variant={isScreenSharing ? "default" : "secondary"}
                    className={cn("h-9 w-9 p-0 md:w-auto md:px-3 md:py-2 gap-2 transition-all font-medium", isScreenSharing ? "bg-blue-600 text-white" : "bg-white/10 text-foreground")}
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                >
                    <Monitor className="h-4 w-4" />
                    <span className="hidden md:inline">{isScreenSharing ? "Stop Share" : "Share"}</span>
                </Button>

                <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                    onClick={() => {
                        leaveCall();
                        // dispatch(leaveRoom()); // Do not leave the actual room, just the voice call? Or both?
                        // For now, separate concerns: Voice disconnect vs Room leave.
                        // But usually "hanging up" implies leaving the voice channel.
                    }}
                    title="Disconnect Voice"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

