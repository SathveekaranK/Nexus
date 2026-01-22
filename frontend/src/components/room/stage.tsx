import { useAgora } from '@/context/agora-context';
import { LocalVideoTrack, RemoteVideoTrack } from 'agora-rtc-react';
import { Mic, MicOff, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// A component to render the "Stage" which includes:
// 1. Screen Shares (High Priority)
// 2. Video Feeds
// 3. Fallback to Music Player (passed as children)
interface StageProps {
    children: React.ReactNode; // The Music Player
    className?: string;
}

export default function Stage({ children, className }: StageProps) {
    const {
        localCameraTrack,
        screenTrack,
        remoteUsers,
        isScreenSharing,
        isCameraOn
    } = useAgora();

    // Determine what is "Main Stage" worthy
    // Priority 1: Remote Screen Share (Not yet implemented in Context, need to detect)
    // Priority 2: Local Screen Share
    // Priority 3: Remote Video (if someone is speaking? For now just grid)

    // For now, let's do a Split View:
    // If Screen Share (Local or Remote) exists: It takes 70% width.
    // If Video exists: Grid takes remaining.
    // Music Player: Always visible but maybe minimized if Screen Share is huge?

    // Simpler Phase 1: 
    // If NO Video/Screen -> Show Music Player Full.
    // If Video/Screen -> Show Grid + Music Player (Smaller).

    const hasRemoteVideo = remoteUsers.some(user => user.hasVideo);
    const hasAnyVideo = isCameraOn || isScreenSharing || hasRemoteVideo;

    if (!hasAnyVideo) {
        return <div className={cn("w-full h-full", className)}>{children}</div>;
    }

    return (
        <div className={cn("flex flex-col gap-4 w-full h-full", className)}>
            {/* Screen Share Area - Only if Local Sharing (Remote needs more logic) */}
            {isScreenSharing && screenTrack && (
                <div className="w-full aspect-video bg-black/80 rounded-xl overflow-hidden relative ring-1 ring-white/10 shrink-0 max-h-[60vh]">
                    {Array.isArray(screenTrack) ? (
                        <LocalVideoTrack track={screenTrack[0]} play className="w-full h-full object-contain" />
                    ) : (
                        <LocalVideoTrack track={screenTrack as any} play className="w-full h-full object-contain" />
                    )}
                    <div className="absolute top-4 left-4 bg-blue-600 px-3 py-1 rounded-full text-xs font-bold text-white shadow-xl">
                        You are sharing your screen
                    </div>
                </div>
            )}

            {/* Main Content Split: Music Player vs Video Grid */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                {/* Music Player - Shrinks if needed */}
                <div className={cn(
                    "transition-all duration-500",
                    isScreenSharing ? "w-full md:w-1/3 aspect-video md:aspect-auto" : "flex-1"
                )}>
                    {children}
                </div>

                {/* Video Grid */}
                <div className={cn(
                    "grid gap-4 min-h-[200px]",
                    isScreenSharing ? "w-full md:w-2/3 grid-cols-2 lg:grid-cols-3" : "w-full md:w-1/3 grid-cols-1 md:grid-cols-2 auto-rows-fr"
                )}>
                    {/* Local Camera */}
                    {isCameraOn && localCameraTrack && (
                        <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-white/10 aspect-video group">
                            <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white backdrop-blur-sm">You</div>
                        </div>
                    )}

                    {/* Remote Users */}
                    {remoteUsers.filter(u => u.hasVideo || u.hasAudio).map((user) => (
                        <div key={user.uid} className="relative rounded-xl overflow-hidden bg-gray-900 border border-white/10 aspect-video group">
                            {user.hasVideo ? (
                                <RemoteVideoTrack track={user.videoTrack} play className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-muted-foreground">
                                        {String(user.uid).slice(0, 1)}
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1.5 backdrop-blur-sm">
                                {user.hasAudio ? <Mic className="h-3 w-3 text-green-400" /> : <MicOff className="h-3 w-3 text-red-400" />}
                                <span className="truncate max-w-[80px]">User {user.uid}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
