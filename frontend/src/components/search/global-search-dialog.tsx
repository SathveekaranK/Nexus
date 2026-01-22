import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageSquare, User, FileText, Hash, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GlobalSearchDialog() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any>({ messages: [], users: [], channels: [] });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults({ messages: [], users: [], channels: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.searchGlobal(query);
                if (res.success) {
                    setResults(res.data);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (type: string, item: any) => {
        setOpen(false);
        if (type === 'user') {
            navigate(`/dms/${item._id || item.id}`);
        } else if (type === 'channel') {
            navigate(`/channels/${item._id || item.id}`);
        } else if (type === 'message') {
            // Check if it's a channel or DM message to route correctly
            // For now, route to context if available, else try guess
            if (item.channelId) {
                // If it's a DM, channelId might be recipient or sender or generic ID
                // Ideally backend tells us if it's DM or Channel. 
                // Currently search api returns 'channelId' for both?
                // Assuming channelId resolves to a route:
                navigate(`/channels/${item.channelId}`);
                // Advanced: Scroll to message ID? Needs query param support on page
            }
        }
    };

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className="relative w-full md:w-64 xl:w-96 text-sm text-muted-foreground bg-secondary/50 hover:bg-secondary/80 px-3 py-2 rounded-md cursor-pointer transition-colors flex items-center justify-between border border-transparent hover:border-border"
                title="Open global search (⌘K)"
            >
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Search Nexus...</span>
                </div>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden glass border-none shadow-2xl">
                    <div className="flex items-center border-b px-3 bg-secondary/20">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Type a command or search..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </div>

                    <div className="max-h-[500px] overflow-y-auto p-2">
                        {(!results.users.length && !results.channels.length && !results.messages.length && query.length > 1 && !loading) && (
                            <p className="text-center text-sm text-muted-foreground py-6">No results found.</p>
                        )}

                        {(results.users.length > 0) && (
                            <div className="mb-4">
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Users</h3>
                                <div className="grid gap-1">
                                    {results.users.map((user: any) => (
                                        <div key={user._id} onClick={() => handleSelect('user', user)} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(results.channels.length > 0) && (
                            <div className="mb-4">
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Channels</h3>
                                <div className="grid gap-1">
                                    {results.channels.map((channel: any) => (
                                        <div key={channel._id} onClick={() => handleSelect('channel', channel)} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors">
                                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                                <Hash className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{channel.name}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-xs">{channel.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(results.messages.length > 0) && (
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Messages</h3>
                                <div className="grid gap-1">
                                    {results.messages.map((msg: any) => (
                                        <div key={msg._id} onClick={() => handleSelect('message', msg)} className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors group">
                                            <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-medium text-muted-foreground">{msg.senderId?.name || 'Unknown'}</p>
                                                    <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm truncate w-full">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
