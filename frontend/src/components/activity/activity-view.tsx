// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import type { ActivityItem } from '@/lib/types';
import { Bell, Check, MessageSquare, AtSign, Calendar } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { USERS, CHANNELS } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/services/store';

interface ActivityViewProps {
  initialActivityItems?: ActivityItem[]; // Keeping for compatibility but primarily fetching
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
  const [activityItems, setActivityItems] = useState<any[]>([]);
  const navigate = useNavigate();
  // We can use Redux notifications if they are stored there, or fetch fresh
  // Assuming fetching fresh for the "view" to catch up on history
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.getNotifications();
        if (res && (Array.isArray(res) || Array.isArray(res.data))) {
          // Transform backend notification to ActivityItem shape if needed, 
          // or just use backend shape directly. Backend returns: 
          // {_id, type, title, message, relatedMessageId, relatedEventId, channelId, read, createdAt}
          const data = Array.isArray(res) ? res : res.data;
          setActivityItems(data);
        }
      } catch (e) {
        console.error("Failed to fetch activity", e);
      }
    };

    fetchNotifications();

    // Real-time socket listener could update this too, but MainLayout handles global toasts. 
    // We might want to listen here too or rely on refresh/polling for now or Redux.
  }, []);

  const handleItemClick = async (item: any) => {
    // If it's a message/mention notification
    if (item.type === 'message' || item.type === 'mention' || item.type === 'role_mention') {
      // Navigate
      // We need to know if it's DM or Channel. Backend notification stores channelId.
      // We might need to look up if channelId matches a DM or Channel.
      // Or we just try to navigate to /channels/:id if it's a channel ID string.

      if (item.channelId) {
        navigate(`/channels/${item.channelId}`);
        // Note: scrolling to message ID would need more logic in ChatView to handle hash/scroll
      }

      // Mark read
      if (item.relatedMessageId) {
        await api.markMessageRead(item.relatedMessageId);
      }
    } else if (item.type === 'event_created') {
      navigate('/calendar');
    }

    // Optimistic local update
    setActivityItems(prev => prev.map(i => i._id === item._id ? { ...i, read: true } : i));
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
                // Backend Notifications don't have full populated fromUser usually unless populated in controller.
                // Our current controller for createNotification likely just stores logic.
                // Wait, notification controller doesn't seem to store "fromUserId". 
                // It stores title/message which usually contains "Name mentioned you".
                // So we parse or display title/message directly.

                const isRead = item.read;

                // Icon mapping
                let Icon = MessageSquare;
                if (item.type === 'mention' || item.type === 'role_mention') Icon = AtSign;
                if (item.type === 'event_created') Icon = Calendar;

                return (
                  <button
                    key={item._id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors",
                      isRead ? 'hover:bg-muted/50' : 'bg-primary/10 hover:bg-primary/20'
                    )}
                  >
                    <div className="relative">
                      {/* Avatar would be nice but we might not have sender ID readily available in simple notification model unless we query or added it. 
                          For now, use generic icon or first letter of title (Sender Name usually starts title) */}
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                        <Icon className="h-5 w-5 opacity-70" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {item.title}
                      </p>
                      <p className={cn("text-xs mt-0.5 line-clamp-2", isRead ? "text-muted-foreground" : "text-foreground")}>
                        {item.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!isRead && (
                      <div className="w-2.5 h-2.5 bg-primary rounded-full self-center flex-shrink-0" />
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
