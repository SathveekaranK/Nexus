import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music } from 'lucide-react';

interface CreateRoomDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string, genre: string) => void;
    isLoading: boolean;
}

const GENRES = ['General', 'Lofi', 'Pop', 'Hip Hop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Gaming'];

export default function CreateRoomDialog({ isOpen, onOpenChange, onCreate, isLoading }: CreateRoomDialogProps) {
    const [name, setName] = useState('');
    const [genre, setGenre] = useState('General');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(name, genre);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-white/10 text-foreground sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-primary" />
                        Create Music Room
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Room Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Late Night Vibes"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-secondary/50 border-white/10 focus:ring-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="genre">Genre / Vibe</Label>
                        <Select value={genre} onValueChange={setGenre}>
                            <SelectTrigger className="bg-secondary/50 border-white/10">
                                <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                            <SelectContent>
                                {GENRES.map((g) => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white">
                            {isLoading ? 'Creating...' : 'Launch Room'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
