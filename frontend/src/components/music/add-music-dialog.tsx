"use client";

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { handleMusicQuery } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddMusicDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSongAdded: (song: string) => void;
}

export default function AddMusicDialog({ isOpen, onOpenChange, onSongAdded }: AddMusicDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [linkQuery, setLinkQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsLoading(true);
        const result = await handleMusicQuery(searchQuery);
        if (result.success) {
            onSongAdded(result.message);
            toast({ title: "Song added!", description: `"${result.message}" was added to the queue.` });
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message, variant: 'destructive' });
        }
        setIsLoading(false);
    }

    const handleAddFromLink = () => {
        if (!linkQuery) return;
        // In a real app, you'd parse the link and fetch from Spotify API
        onSongAdded(linkQuery);
        toast({ title: "Playlist added!", description: "Songs from the link have been added to the queue." });
        onOpenChange(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Music</DialogTitle>
                    <DialogDescription>
                        Search for a song to add to the queue or paste a link to a playlist.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="search" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="search">Search</TabsTrigger>
                        <TabsTrigger value="link">Paste Link</TabsTrigger>
                    </TabsList>
                    <TabsContent value="search" className="py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="search">Song Name or Artist</Label>
                            <Input id="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g., Blinding Lights by The Weeknd" />
                            <Button onClick={handleSearch} disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : "Search and Add"}
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="link" className="py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="link">Spotify URL</Label>
                            <Input id="link" value={linkQuery} onChange={(e) => setLinkQuery(e.target.value)} placeholder="https://open.spotify.com/..." />
                            <Button onClick={handleAddFromLink}>Add from Link</Button>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
