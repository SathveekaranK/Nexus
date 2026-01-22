import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import AgoraRTC, {
    AgoraRTCProvider,
    useJoin,
    useLocalMicrophoneTrack,
    useLocalCameraTrack,
    usePublish,
    useRemoteUsers,
    useRemoteAudioTracks,
    LocalVideoTrack,
    RemoteVideoTrack,
    useLocalScreenTrack,
    RemoteUser,
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    ILocalVideoTrack,
    ILocalAudioTrack
} from "agora-rtc-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface AgoraContextType {
    localCameraTrack: ICameraVideoTrack | null;
    localMicrophoneTrack: IMicrophoneAudioTrack | null;
    screenTrack: ILocalVideoTrack | ILocalAudioTrack | [ILocalVideoTrack, ILocalAudioTrack] | null;
    remoteUsers: RemoteUser[];
    isConnected: boolean;
    isActive: boolean; // Is the user actually in the call?
    isMuted: boolean;
    isCameraOn: boolean;
    isScreenSharing: boolean;
    toggleMute: () => Promise<void>;
    toggleCamera: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
    leaveCall: () => void;
    joinCall: () => void;
    client: IAgoraRTCClient | null;
}

const AgoraContext = createContext<AgoraContextType | null>(null);

export const useAgora = () => {
    const context = useContext(AgoraContext);
    if (!context) {
        throw new Error("useAgora must be used within an AgoraProvider");
    }
    return context;
};

interface AgoraProviderProps {
    children: ReactNode;
    appId: string;
    roomId: string | null;
}

// Inner Component: Uses the hooks (must be child of AgoraRTCProvider)
const AgoraStateProvider = ({ children, appId, roomId, client }: AgoraProviderProps & { client: IAgoraRTCClient }) => {
    const user = useSelector((state: RootState) => state.auth?.user);
    const uid = user?.id || null;

    // Local State
    const [isActive, setIsActive] = useState(false); // User initiated join
    const [isMuted, setIsMuted] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // --- Hooks from Agora SDK ---

    // 1. Join Logic
    const { isConnected, error: joinError } = useJoin(
        {
            appid: appId,
            channel: roomId || "lobby",
            token: null,
            uid: uid
        },
        isActive && !!roomId // Only join if active and roomId exists
    );

    // 2. Local Tracks
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(isActive);
    const { localCameraTrack } = useLocalCameraTrack(isActive && isCameraOn);
    const { screenTrack, error: screenError } = useLocalScreenTrack(isActive && isScreenSharing, {}, "disable");

    // 3. Publish
    const tracksToPublish = useMemo(() => {
        const tracks = [];
        if (localMicrophoneTrack) tracks.push(localMicrophoneTrack);
        if (localCameraTrack) tracks.push(localCameraTrack);
        if (screenTrack) {
            if (Array.isArray(screenTrack)) {
                tracks.push(...screenTrack);
            } else {
                tracks.push(screenTrack);
            }
        }
        return tracks;
    }, [localMicrophoneTrack, localCameraTrack, screenTrack]);

    usePublish(tracksToPublish);

    // 4. Remote Users & Audio
    const remoteUsers = useRemoteUsers();
    // Auto-play remote audio
    const { audioTracks } = useRemoteAudioTracks(remoteUsers);
    useEffect(() => {
        audioTracks.forEach((track) => track.play());
    }, [audioTracks]);


    // --- Handling State Changes ---

    // Initial Mute Sync
    useEffect(() => {
        if (localMicrophoneTrack) {
            localMicrophoneTrack.setMuted(isMuted);
        }
    }, [localMicrophoneTrack, isMuted]);

    // Cleanup on unmount or inactive
    useEffect(() => {
        if (!isActive) {
            localMicrophoneTrack?.close();
            localCameraTrack?.close();
        }
    }, [isActive]);

    // Handle Screen Share Stop from Browser UI
    useEffect(() => {
        if (screenTrack) {
            if (Array.isArray(screenTrack)) {
                screenTrack[0].on("track-ended", () => {
                    setIsScreenSharing(false);
                });
            } else {
                (screenTrack as ILocalVideoTrack).on("track-ended", () => {
                    setIsScreenSharing(false);
                });
            }
        }
    }, [screenTrack]);


    // --- Actions ---

    const toggleMute = async () => {
        const newState = !isMuted;
        setIsMuted(newState);
        if (localMicrophoneTrack) {
            await localMicrophoneTrack.setMuted(newState);
        }
    };

    const toggleCamera = async () => {
        setIsCameraOn(prev => !prev);
    };

    const toggleScreenShare = async () => {
        setIsScreenSharing(prev => !prev);
    };

    const joinCall = () => setIsActive(true);
    const leaveCall = () => {
        setIsActive(false);
        setIsCameraOn(false);
        setIsScreenSharing(false);
        setIsMuted(true);
    };

    const value = {
        localCameraTrack,
        localMicrophoneTrack,
        screenTrack,
        remoteUsers,
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
        client
    };

    return (
        <AgoraContext.Provider value={value}>
            {children}
        </AgoraContext.Provider>
    );
};

// Outer Component: Creates Client and Provides Context
export const AgoraProvider = ({ children, appId, roomId }: AgoraProviderProps) => {
    // We only create the client ONCE
    const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

    return (
        <AgoraRTCProvider client={client}>
            <AgoraStateProvider appId={appId} roomId={roomId} client={client}>
                {children}
            </AgoraStateProvider>
        </AgoraRTCProvider>
    );
};
