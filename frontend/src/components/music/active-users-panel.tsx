import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Crown, Shield, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Member {
    _id: string;
    name: string;
    avatar?: string;
    email: string;
    roles?: string[];
}

export default function ActiveUsersPanel() {
    const { members, roomId } = useSelector((state: RootState) => state.room);
    const { user } = useSelector((state: RootState) => state.auth);

    // Sort members: admin > moderator > member
    const sortedMembers = [...(members as Member[] || [])].sort((a, b) => {
        const getRolePriority = (roles?: string[]) => {
            if (roles?.includes('admin')) return 3;
            if (roles?.includes('moderator')) return 2;
            return 1;
        };
        return getRolePriority(b.roles) - getRolePriority(a.roles);
    });

    const getRoleIcon = (roles?: string[]) => {
        if (roles?.includes('admin')) return <Crown className="h-3 w-3 text-yellow-400" />;
        if (roles?.includes('moderator')) return <Shield className="h-3 w-3 text-blue-400" />;
        return null;
    };

    const handleMute = async (targetUserId: string) => {
        if (!user || !roomId) return;

        // Dynamic import to avoid circular dep issues if any, though likely fine here
        const { getSocket } = await import('@/components/room/room-manager');
        const socket = getSocket();
        if (socket) {
            socket.emit('mute_user', {
                roomId,
                targetUserId,
                requesterId: user.id || user._id
            });
        }
    };

    const getRoleBadge = (roles?: string[]) => {
        if (roles?.includes('admin')) return 'Admin';
        if (roles?.includes('moderator')) return 'Mod';
        return null;
    };

    return (
        <Card className="glass-card border-white/5 h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <div className="h-1 w-8 bg-primary rounded-full" />
                    <Users className="h-5 w-5" />
                    Active Users ({sortedMembers.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-2">
                        {sortedMembers.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                                No users in room
                            </div>
                        ) : (
                            sortedMembers.map((member, index) => (
                                <motion.div
                                    key={member._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "group flex items-center gap-3 p-2.5 rounded-lg transition-all",
                                        "hover:bg-white/5 cursor-pointer",
                                        member.roles?.includes('admin') && "bg-yellow-500/5 border border-yellow-500/20"
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className={cn(
                                            "h-10 w-10 ring-2 transition-all group-hover:ring-primary/40",
                                            member.roles?.includes('admin') ? "ring-yellow-500/30" : "ring-primary/20"
                                        )}>
                                            <AvatarImage src={member.avatar} data-ai-hint="person portrait" />
                                            <AvatarFallback className="text-sm bg-primary/20">
                                                {member.name?.charAt(0).toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-medium truncate">{member.name || 'Unknown User'}</p>
                                                {getRoleIcon(member.roles)}
                                            </div>
                                            {/* Mute Button Logic */}
                                            {/* Current user logic checks (pseudo-code, assuming we access current user from somewhere or context) */}
                                            {/* For now, just adding the button structure which calls the socket */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                title="Mute User"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMute(member._id);
                                                }}
                                            >
                                                <MicOff className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-muted-foreground truncate">{member.email || 'No Email'}</p>
                                            {getRoleBadge(member.roles) && (
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                                    member.roles?.includes('admin')
                                                        ? "bg-yellow-500/20 text-yellow-400"
                                                        : "bg-blue-500/20 text-blue-400"
                                                )}>
                                                    {getRoleBadge(member.roles)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
