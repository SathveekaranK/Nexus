import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/types';
import { UserPlus, Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { addMemberToChannel } from '@/services/channel/channelSlice';

interface AddMemberDialogProps {
    channelId: string;
    users: User[];
    currentMemberIds: string[];
}

export default function AddMemberDialog({ channelId, users, currentMemberIds }: AddMemberDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const dispatch = useDispatch<AppDispatch>();

    // Filter users who are NOT already in the channel
    const eligibleUsers = users.filter(user => !currentMemberIds.includes(user.id));

    // Filter by search term
    const filteredUsers = eligibleUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddMembers = async () => {
        // Add each selected user. Ideally backend supports bulk add, but our current endpoint is single user.
        // Use Promise.all if we want simultaneous, or just loop.
        // For now, let's assume single user add or loop.

        // Actually, backend "addMember" handles ONE user based on my controller: { userId }.
        // So I should loop.
        for (const userId of selectedUserIds) {
            await dispatch(addMemberToChannel({ channelId, userId }));
        }

        setIsOpen(false);
        setSelectedUserIds([]);
        setSearchTerm('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Members
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Members to Channel</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <ScrollArea className="h-[300px] pr-4">
                        {filteredUsers.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No users found.</p>
                        ) : (
                            <div className="space-y-2">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedUserIds.includes(user.id) ? 'bg-primary/10' : 'hover:bg-muted'
                                            }`}
                                        onClick={() => handleToggleUser(user.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                        {selectedUserIds.includes(user.id) && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddMembers} disabled={selectedUserIds.length === 0}>
                        Add {selectedUserIds.length} Member{selectedUserIds.length !== 1 && 's'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
