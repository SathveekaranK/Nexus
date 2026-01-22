// @ts-nocheck
'use client';

import type { Channel, User } from '@/lib/types';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Search, Hash, PlusCircle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSearchDialog from '../search/global-search-dialog';

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

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { Badge } from '../ui/badge'; // Ensure Badge component exists or use simple span

export default function ChannelList({
  listType,
  channels,
  users,
  currentUser,
  activeChannel,
  onNewChannel,
  searchTerm,
  onSearchTermChange,
}: ChannelListProps) {

  const { unreadCounts, lastActivity } = useSelector((state: RootState) => state.channels);

  // Trust the order passed from MainLayout
  const sortedChannels = channels;

  const getUserForDM = (channel: Channel) => {
    const otherUserId = channel.memberIds?.find((id) => id !== currentUser.id);
    const targetUserId = otherUserId || currentUser.id;
    return users.find((u) => u.id === targetUserId);
  };

  const renderDMs = () => (
    <div className="p-3 pt-0">
      <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex justify-between items-center">
        <span>Direct Messages</span>
        {/* Optional: Total Unread for DMs */}
      </h3>
      <div className="flex flex-col gap-1">
        <AnimatePresence initial={false} mode="popLayout">
          {sortedChannels.map((channel) => {
            const user = getUserForDM(channel);
            if (!user) return null;
            const unread = unreadCounts[channel.id] || 0;

            return (
              <motion.div
                key={channel.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/dms/${channel.id}`}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-between gap-2 transition-all duration-200 hover:translate-x-1 pr-2',
                      activeChannel?.id === channel.id &&
                      'bg-primary/20 text-foreground border-l-2 border-primary shadow-lg shadow-primary/10'
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="relative group flex-shrink-0">
                        <Avatar className="h-6 w-6 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                          <AvatarImage
                            src={user.avatar}
                            alt={user.name}
                            data-ai-hint="person portrait"
                          />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background shadow-sm", getStatusClasses(user.status))} />
                      </div>
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
          title="Create new channel"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <AnimatePresence initial={false} mode="popLayout">
          {sortedChannels.map((channel) => {
            const unread = unreadCounts[channel.id] || 0;
            return (
              <motion.div
                key={channel.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/channels/${channel.id}`}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-between gap-2 transition-all duration-200 hover:translate-x-1 group pr-2',
                      activeChannel?.id === channel.id &&
                      'bg-primary/20 text-foreground border-l-2 border-primary shadow-lg shadow-primary/10'
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Hash className="h-4 w-4 group-hover:text-primary transition-colors flex-shrink-0" />
                      <span className="truncate">{channel.name}</span>
                    </div>
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-transparent flex flex-col">
      <header className="p-3 border-b border-border shadow-sm">
        <h2 className="text-lg font-bold text-foreground">
          {listType === 'dms' ? 'Messages' : 'Channels'}
        </h2>
      </header>
      <div className="p-3 space-y-3">
        <GlobalSearchDialog />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter list..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {listType === 'dms' ? renderDMs() : renderChannels()}
      </ScrollArea>
      <NowPlayingFooter />
    </div>
  );
}

// Sub-component for Now Playing
function NowPlayingFooter() {
  const { currentMedia, roomId } = useSelector((state: RootState) => state.room);
  const dispatch = useDispatch<AppDispatch>();

  if (!roomId || !currentMedia || !currentMedia.isPlaying) return null;

  return (
    <div className="p-3 bg-black/40 border-t border-white/5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded bg-black/50 overflow-hidden flex-shrink-0 border border-white/10 relative">
          {currentMedia.thumbnail ? (
            <img src={currentMedia.thumbnail} className="object-cover w-full h-full" alt={currentMedia.title} title={currentMedia.title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Hash className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="h-3 w-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_theme(colors.primary.DEFAULT)]" />
          </div>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs font-bold text-white truncate">{currentMedia.title}</p>
          <p className="text-[10px] text-muted-foreground truncate">Playing in Room</p>
        </div>
        <Link to="/music"> {/* Or dispatch navigation */}
          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:text-primary hover:bg-white/10" title="Go to music room">
            <Play className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
