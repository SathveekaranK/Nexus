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

    useEffect(() => {
        if (roomId) console.log(`Active Voice in Room: ${roomId}`);
    }, [roomId]);
    const [isMuted, setIsMuted] = useState(false);

    const myPeerRef = useRef<Peer | null>(null);
    const myStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<{ [key: string]: any }>({}); // Store calls

    useEffect(() => {
        // Use PeerJS Public Cloud (default)
        const peer = new Peer();

        peer.on('open', (id) => {
            setMyPeerId(id);
            console.log('My Peer ID:', id);

            // Connect to Voice Channel
            const socket = getSocket();
            if (socket && roomId) {
                socket.emit('join-voice', roomId, id);
            }
        });

        // Answer incoming calls automatically
        peer.on('call', (call) => {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                call.answer(stream);
                const audio = document.createElement('audio');
                call.on('stream', (userStream) => {
                    addAudioStream(audio, userStream);
                });
            });
        });

        myPeerRef.current = peer;

        // Get Audio
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            myStreamRef.current = stream;
        });

        return () => {
            peer.destroy();
            myStreamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    // Effect: When new people join (in voicePeers), call them
    useEffect(() => {
        if (!myPeerRef.current || !myStreamRef.current) return;

        voicePeers.forEach((peerId) => {
            if (!peersRef.current[peerId]) {
                const call = myPeerRef.current!.call(peerId, myStreamRef.current!);
                if (call) {
                    const audio = document.createElement('audio');
                    call.on('stream', (userStream) => {
                        addAudioStream(audio, userStream);
                    });
                    peersRef.current[peerId] = call;
                }
            }
        });

        // Cleanup peers who left
        // ... (complex diffing needed or handle removePeer event)
    }, [voicePeers]);

    const addAudioStream = (audio: HTMLAudioElement, stream: MediaStream) => {
        audio.srcObject = stream;
        audio.addEventListener('loadedmetadata', () => {
            audio.play();
        });
        document.body.append(audio); // Hidden audio element
    };

    const toggleMute = () => {
        if (myStreamRef.current) {
            myStreamRef.current.getAudioTracks()[0].enabled = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="p-2 bg-secondary/50 rounded-lg flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-xs font-mono">Voice Connected</span>
                {myPeerId && <span className="text-[10px] text-muted-foreground" title="My Peer ID">ID: {myPeerId.slice(0, 8)}...</span>}
            </div>
            <Button size="icon" variant={isMuted ? "destructive" : "secondary"} className="h-8 w-8" onClick={toggleMute}>
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
        </div>
    );
}
