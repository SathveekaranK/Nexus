"use client";

import { useState } from 'react';
import type { ActivityItem } from '@/lib/types';
import { Bell, Check, MessageSquare, AtSign } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { USERS, CHANNELS } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react';

interface ActivityViewProps {
  initialActivityItems: ActivityItem[];
}

const ActivityHeader = () => {
  return (
    <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-secondary h-16 md:h-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Activity</h2>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Check className="mr-2" />
            Mark all as read
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default function ActivityView({ initialActivityItems }: ActivityViewProps) {
  const [activityItems, setActivityItems] = useState(initialActivityItems);
  const navigate = useNavigate();

  const handleItemClick = (item: ActivityItem) => {
    const channel = CHANNELS.find(c => c.id === item.channelId);
    if (channel) {
      const path = channel.type === 'dm' ? '/dms/' : '/channels/';
      navigate(`${path}${item.channelId}#message-${item.messageId}`);
    }
    markAsRead(item.id);
  }

  const markAsRead = (id: string) => {
    setActivityItems(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item));
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ActivityHeader />
      <ScrollArea className="flex-1">
        <div className="p-2 md:p-4">
          {activityItems.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              <Bell className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">No new activity</h3>
              <p className="text-sm">Mentions and other notifications will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityItems.map(item => {
                const fromUser = USERS.find(u => u.id === item.fromUserId);
                const channel = CHANNELS.find(c => c.id === item.channelId);
                const channelName = channel?.type === 'dm'
                  ? USERS.find(u => u.id === channel.memberIds?.find(id => id !== 'user-1'))?.name
                  : channel?.name;

                if (!fromUser || !channel) return null;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors",
                      item.isRead ? 'hover:bg-muted/50' : 'bg-primary/10 hover:bg-primary/20'
                    )}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={fromUser.avatarUrl} alt={fromUser.name} />
                        <AvatarFallback>{fromUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                        {item.type === 'mention' ? (
                          <AtSign className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <MessageSquare className="h-3.5 w-3.5 text-secondary-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-bold">{fromUser.name}</span>
                        {item.type === 'mention' ? ' mentioned you in ' : ' sent a message in '}
                        <span className="font-bold">#{channelName}</span>
                      </p>
                      <p className={cn("text-sm mt-1 truncate", item.isRead ? "text-muted-foreground" : "text-foreground")}>
                        {item.contentPreview}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{item.timestamp}</p>
                    </div>
                    {!item.isRead && (
                      <div className="w-2.5 h-2.5 bg-primary rounded-full self-center" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
