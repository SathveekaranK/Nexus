
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Trash2, ListMusic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface QueueItem {
    url: string;
    title: string;
    thumbnail: string;
    duration: string;
    addedBy?: string; // userId or name
}

interface QueueListProps {
    queue: QueueItem[];
    onRemove: (index: number) => void;
    onPlay: () => void; // Trigger play immediately (next)
    isHost?: boolean;
}

export default function QueueList({ queue, onRemove, onPlay, isHost }: QueueListProps) {
    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border border-white/5 rounded-lg bg-black/20 h-full">
                <ListMusic className="h-12 w-12 mb-2 opacity-50" />
                <p>Queue is empty</p>
                <p className="text-xs">Search and add songs!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#1e1e24]/50 rounded-xl border border-white/5 overflow-hidden">
            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h3 className="font-semibold flex items-center gap-2">
                    <ListMusic className="h-4 w-4 text-primary" />
                    Up Next ({queue.length})
                </h3>
                {isHost && queue.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={onPlay} className="text-xs h-7">
                        <Play className="h-3 w-3 mr-1" /> Play Next
                    </Button>
                )}
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {queue.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition group">
                            <div className="relative h-10 w-16 bg-black rounded overflow-hidden flex-shrink-0">
                                <img src={item.thumbnail} alt={item.title} className="object-cover w-full h-full opacity-70 group-hover:opacity-100 transition" />
                                <span className="absolute bottom-0 right-0 text-[9px] bg-black/80 text-white px-1">
                                    {item.duration}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-white/90 group-hover:text-primary transition-colors">
                                    {index + 1}. {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    Requested by {item.addedBy || 'User'}
                                </p>
                            </div>
                            {isHost && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                                    onClick={() => onRemove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
