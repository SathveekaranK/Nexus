'use client';

import type { Channel, User } from '@/lib/types';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Search, Hash, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const getStatusClasses = (status: User['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-gray-400 border-background';
    case 'away': return 'bg-yellow-500';
    case 'dnd': return 'bg-red-500';
  }
}

interface ChannelListProps {
  listType: 'dms' | 'channels';
  channels: Channel[];
  users: User[];
  currentUser: User; // Added currentUser
  activeChannel: Channel | undefined;
  onNewChannel: () => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export default function ChannelList({
  listType,
  channels,
  users,
  currentUser, // Added currentUser
  activeChannel,
  onNewChannel,
  searchTerm,
  onSearchTermChange,
}: ChannelListProps) {
  const getUserForDM = (channel: Channel) => {
    // If we are chatting with ourselves, both IDs are the same.
    // If chatting with others, one ID is ours, one is theirs.
    const otherUserId = channel.memberIds?.find((id) => id !== currentUser.id);
    const targetUserId = otherUserId || currentUser.id;
    return users.find((u) => u.id === targetUserId);
  };

  const renderDMs = () => (
    <div className="p-3 pt-0">
      <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">
        Direct Messages
      </h3>
      <div className="flex flex-col gap-1">
        {channels.map((channel) => {
          const user = getUserForDM(channel);
          if (!user) return null;
          return (
            <Link key={channel.id} to={`/dms/${channel.id}`}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-2',
                  activeChannel?.id === channel.id &&
                  'bg-primary/20 text-foreground'
                )}
              >
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name}
                      data-ai-hint="person portrait"
                    />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-secondary", getStatusClasses(user.status))} />
                </div>
                <span className="truncate">{channel.name}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );

  const renderChannels = () => (
    <div className="p-3 pt-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase text-muted-foreground">
          Channels
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onNewChannel}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        {channels.map((channel) => (
          <Link key={channel.id} to={`/channels/${channel.id}`}>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2',
                activeChannel?.id === channel.id &&
                'bg-primary/20 text-foreground'
              )}
            >
              <Hash className="h-4 w-4" />
              {channel.name}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full md:w-72 bg-[hsl(var(--secondary))] flex flex-col h-full">
      <header className="p-3 border-b border-border shadow-sm">
        <h2 className="text-lg font-bold text-foreground">
          {listType === 'dms' ? 'Messages' : 'Channels'}
        </h2>
      </header>
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {listType === 'dms' ? renderDMs() : renderChannels()}
      </ScrollArea>
    </div>
  );
}
