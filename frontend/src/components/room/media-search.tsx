import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Play } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { getSocket } from './room-manager';

export default function MediaSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { roomId, currentMedia } = useSelector((state: RootState) => state.room);
    const socket = getSocket();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            // We need to add this endpoint to api-client
            // const res = await api.searchYouTube(query);
            // Temporary, assuming we added it or calling axios directly for speed
            // Using a relative fetch for now to match other patterns or explicit if api-client isn't updated in this turn
            const res = await fetch(`${import.meta.env.VITE_API_URL}/youtube/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.data);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const parseDuration = (durationStr: string): number => {
        if (!durationStr) return 0;
        const parts = durationStr.split(':').map(part => parseInt(part));
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return 0;
    };

    const playVideo = (video: any) => {
        if (!socket) return;
        socket.emit('play_media', {
            roomId,
            media: {
                ...currentMedia, // keep current state if partly same? No, play new.
                url: video.url,
                title: video.title,
                thumbnail: video.thumbnail,
                isPlaying: true,
                timestamp: 0,
                duration: parseDuration(video.duration),
                playedAt: Date.now()
            }
        });
        setResults([]); // Clear results after selection
        setQuery('');
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="Search YouTube or paste URL..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit" disabled={isLoading}>
                    <Search className="h-4 w-4" />
                </Button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {results.map((video) => (
                    <div
                        key={video.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer group"
                        onClick={() => playVideo(video)}
                    >
                        <div className="relative w-16 h-9 flex-shrink-0">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover rounded" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{video.title}</h4>
                            <p className="text-xs text-muted-foreground">{video.author}</p>
                        </div>
                        <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                            <Play className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
