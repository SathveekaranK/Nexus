import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getSocket } from './room-manager';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, SkipForward } from 'lucide-react';

export default function YouTubePlayer() {
    const { currentMedia, roomId } = useSelector((state: RootState) => state.room);
    const socket = getSocket();
    const [volume, setVolume] = useState(50);

    // Extract video ID from YouTube URL
    const getVideoId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        return match ? match[1] : null;
    };

    const videoId = currentMedia.url ? getVideoId(currentMedia.url) : null;

    const handlePlayPause = () => {
        if (!socket) return;
        if (currentMedia.isPlaying) {
            socket.emit('pause_media', { roomId, media: currentMedia });
        } else {
            socket.emit('play_media', { roomId, media: currentMedia });
        }
    };

    useEffect(() => {
        console.log('YouTubePlayer rendering with URL:', currentMedia.url);
        console.log('Extracted Video ID:', videoId);
    }, [currentMedia.url, videoId]);

    if (!currentMedia.url || !videoId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-lg border h-[300px] text-muted-foreground">
                <p>No media playing.</p>
                <p className="text-sm">Search for a video or paste a link to start.</p>
            </div>
        );
    }

    // Build YouTube embed URL
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${currentMedia.isPlaying ? 1 : 0}&controls=1&modestbranding=1&rel=0`;

    return (
        <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentMedia.title}
                />
            </div>

            <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                    <Button size="icon" variant="ghost">
                        <SkipForward className="rotate-180" />
                    </Button>
                    <Button size="icon" className="h-12 w-12 rounded-full" onClick={handlePlayPause}>
                        {currentMedia.isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
                    </Button>
                    <Button size="icon" variant="ghost">
                        <SkipForward />
                    </Button>
                </div>

                <div className="flex items-center gap-2 w-1/3">
                    <Volume2 className="h-4 w-4" />
                    <Slider
                        defaultValue={[50]}
                        max={100}
                        step={1}
                        value={[volume]}
                        onValueChange={(val) => setVolume(val[0])}
                    />
                </div>
            </div>
        </div>
    );
}
