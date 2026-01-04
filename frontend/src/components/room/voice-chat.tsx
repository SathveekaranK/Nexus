import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getSocket } from './room-manager';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VoiceChat() {
    const { voicePeers, roomId } = useSelector((state: RootState) => state.room);
    const [myPeerId, setMyPeerId] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [status, setStatus] = useState<string>('Initializing...');

    const myPeerRef = useRef<Peer | null>(null);
    const myStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<{ [key: string]: any }>({});
    const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({}); // Keep track of audio elements

    useEffect(() => {
        const initVoice = async () => {
            console.log('[VoiceChat] Initializing...');
            if (!roomId) return;

            // 1. Get Local Stream
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                console.log('[VoiceChat] Got local stream');
                myStreamRef.current = stream;
            } catch (err: any) {
                console.error('[VoiceChat] Failed to get local stream:', err);
                setStatus('Mic Error');
                return;
            }

            // 2. Init PeerJS
            // Use a random ID or let PeerJS generate one.
            const peer = new Peer({
                debug: 2, // Log warnings and errors
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peer.on('open', (id) => {
                console.log('[VoiceChat] PeerJS Open. My ID:', id);
                setMyPeerId(id);
                setStatus('Connected');

                // 3. Emit Join Event (Wait for socket)
                const checkSocket = setInterval(() => {
                    const socket = getSocket();
                    if (socket && socket.connected) {
                        console.log('[VoiceChat] Socket available. Emitting join-voice for room:', roomId);
                        socket.emit('join-voice', roomId, id);
                        clearInterval(checkSocket);
                    } else {
                        console.log('[VoiceChat] Waiting for socket...');
                    }
                }, 500);

                // Cleanup interval if component unmounts quickly
                return () => clearInterval(checkSocket);
            });

            peer.on('error', (err) => {
                console.error('[VoiceChat] PeerJS Error:', err);
                setStatus('Connection Error');
            });

            // 4. Handle Incoming Calls
            peer.on('call', (call) => {
                console.log('[VoiceChat] Incoming call from:', call.peer);
                // Answer with my stream
                call.answer(myStreamRef.current!);

                // Listen for their stream
                call.on('stream', (userStream) => {
                    console.log('[VoiceChat] Received stream from (Answer):', call.peer);
                    playStream(call.peer, userStream);
                });

                call.on('error', (err) => {
                    console.error('[VoiceChat] Call Error (Incoming):', err);
                });
            });

            myPeerRef.current = peer;
        };

        initVoice();

        return () => {
            console.log('[VoiceChat] Cleanup');
            myPeerRef.current?.destroy();
            myStreamRef.current?.getTracks().forEach(track => track.stop());
            // Cleanup audio elements
            Object.values(audioElementsRef.current).forEach(audio => audio.remove());
        };
    }, [roomId]);

    // 5. Handle Outgoing Calls (when new user joins)
    useEffect(() => {
        if (!myPeerRef.current || !myStreamRef.current || !myPeerId) return;

        voicePeers.forEach((peerId) => {
            // Don't call myself and don't call if already connected
            if (peerId === myPeerId || peersRef.current[peerId]) return;

            console.log('[VoiceChat] Initiating call to:', peerId);
            const call = myPeerRef.current!.call(peerId, myStreamRef.current!);

            if (call) {
                peersRef.current[peerId] = call;

                call.on('stream', (userStream) => {
                    console.log('[VoiceChat] Received stream from (Caller):', peerId);
                    playStream(peerId, userStream);
                });

                call.on('error', (err) => {
                    console.error('[VoiceChat] Call Error (Outgoing):', err);
                });

                call.on('close', () => {
                    console.log('[VoiceChat] Call closed:', peerId);
                    removeStream(peerId);
                    delete peersRef.current[peerId];
                });
            } else {
                console.error('[VoiceChat] Failed to call:', peerId);
            }
        });

    }, [voicePeers, myPeerId]);

    // Helper: Play Stream
    const playStream = (peerId: string, stream: MediaStream) => {
        // Prevent duplicate audios
        if (audioElementsRef.current[peerId]) return;

        console.log('[VoiceChat] Playing stream for:', peerId);
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.setAttribute('playsinline', 'true'); // Mobile iOS
        audio.autoplay = true;
        // audio.controls = true; // Debug: show controls if needed

        // Robust play attempt
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error(`[VoiceChat] Auto-play failed for ${peerId}:`, error);
                // Interaction might be needed?
            });
        }

        document.body.appendChild(audio); // Append to body (hidden)
        audioElementsRef.current[peerId] = audio;
    };

    const removeStream = (peerId: string) => {
        const audio = audioElementsRef.current[peerId];
        if (audio) {
            audio.srcObject = null;
            audio.remove();
            delete audioElementsRef.current[peerId];
        }
    };

    const toggleMute = () => {
        if (myStreamRef.current) {
            const enabled = !isMuted;
            myStreamRef.current.getAudioTracks().forEach(track => track.enabled = !enabled); // Logic flip: enabled=true means NOT muted
            setIsMuted(enabled);
        }
    };

    return (
        <div className="p-2 bg-secondary/50 rounded-lg flex items-center gap-3">
            <div className="flex flex-col">
                <span className="text-xs font-mono font-bold">Voice Chat</span>
                <span className="text-[10px] text-muted-foreground">{status}</span>
                {/* <span className="text-[9px] text-muted-foreground">{myPeerId ? myPeerId.slice(0, 6) : ''}</span> */}
            </div>

            <Button
                size="icon"
                variant={isMuted ? "destructive" : "secondary"}
                className={`h-8 w-8 transition-all ${isMuted ? 'animate-pulse' : ''}`}
                onClick={toggleMute}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
        </div>
    );
}
