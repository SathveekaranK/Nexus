import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Channel, User } from '@/lib/types';
import { Users, AlertTriangle, Settings, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useDispatch } from 'react-redux';
import { fetchChannels } from '@/services/channel/channelSlice';
import { AppDispatch } from '@/store/store';
import { useNavigate } from 'react-router-dom';
import AddMemberDialog from './add-member-dialog';

interface ChannelSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    channel: Channel;
    currentUser: User;
    allUsers: User[];
}

export default function ChannelSettingsDialog({ isOpen, onClose, channel, currentUser, allUsers }: ChannelSettingsDialogProps) {
    const isOwner = channel.creator === currentUser.id || currentUser.roles?.includes('admin'); // Basic check, backend verifies
    const [name, setName] = useState(channel.name);
    const [topic, setTopic] = useState(channel.description || ''); // Using description as topic for now
    const { toast } = useToast();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const handleUpdate = async () => {
        try {
            await api.updateChannel(channel.id, { name, description: topic });
            toast({ title: "Channel updated" });
            dispatch(fetchChannels());
            onClose();
        } catch (error) {
            toast({ title: "Failed to update channel", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            await api.deleteChannel(channel.id);
            toast({ title: "Channel deleted" });
            dispatch(fetchChannels());
            navigate('/');
            onClose();
        } catch (error) {
            toast({ title: "Failed to delete channel", variant: "destructive" });
        }
    };

    const handleKick = async (userId: string) => {
        if (!confirm("Kick this user?")) return;
        try {
            await api.kickMember(channel.id, userId);
            toast({ title: "User removed" });
            dispatch(fetchChannels()); // Refresh to update member list locally if needed (though member list comes from allUsers mainly, specific channel members need refresh)
        } catch (error) {
            toast({ title: "Failed to remove user", variant: "destructive" });
        }
    };

    // Filter members
    const members = allUsers.filter(u => channel.memberIds?.includes(u.id));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#1e1e24] text-white border-white/10">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Channel Settings: # {channel.name}
                    </DialogTitle>
                    <DialogDescription>
                        Manage channel details and members.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3 bg-black/20">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Channel Name</Label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="bg-black/20 border-white/10"
                                disabled={!isOwner}
                                title="Channel name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Topic / Description</Label>
                            <Textarea
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                className="bg-black/20 border-white/10"
                                disabled={!isOwner}
                                title="Channel description"
                            />
                        </div>
                        {isOwner && (
                            <div className="flex justify-end">
                                <Button onClick={handleUpdate} title="Save channel changes">Save Changes</Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="members" className="py-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">
                                {members.length} Members
                            </h3>
                            {isOwner && (
                                <AddMemberDialog
                                    channelId={channel.id}
                                    users={allUsers}
                                    currentMemberIds={channel.memberIds || []}
                                />
                            )}
                        </div>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                                {members.map(member => {
                                    const isMemberAdmin = member.roles?.includes('admin') || member.roles?.includes('owner');
                                    const isMemberMod = member.roles?.includes('moderator');
                                    return (
                                        <div key={member.id} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.avatar} />
                                                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium flex items-center gap-2">
                                                        {member.name}
                                                        {isMemberAdmin && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded uppercase">Admin</span>}
                                                        {isMemberMod && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded uppercase">Mod</span>}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                                </div>
                                            </div>
                                            {isOwner && member.id !== currentUser.id && (
                                                <div className="flex items-center gap-2">
                                                    {!isMemberAdmin && !isMemberMod && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 h-8 px-2"
                                                            onClick={async () => {
                                                                if (!confirm(`Promote ${member.name} to Moderator?`)) return;
                                                                try {
                                                                    await api.assignUserRoles(member.id, ['moderator']);
                                                                    toast({ title: "User promoted to Moderator" });
                                                                    dispatch(fetchChannels());
                                                                    onClose(); // Close to refresh or trigger refresh
                                                                } catch (e) {
                                                                    toast({ title: "Failed to promote", variant: "destructive" });
                                                                }
                                                            }}
                                                            title={`Promote ${member.name} to Moderator`}
                                                        >
                                                            Promote
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-900/20 hover:text-red-300 h-8 w-8 p-0" onClick={() => handleKick(member.id)} title={`Kick ${member.name}`}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="danger" className="py-4">
                        <div className="border border-red-900/50 bg-red-900/10 rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-2 text-red-400 font-semibold">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Channel
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete <strong>#{channel.name}</strong>? This action cannot be undone and all messages will be lost.
                            </p>
                            <Button variant="destructive" className="w-full" onClick={handleDelete} disabled={!isOwner}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Channel
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
