'use client';

import type { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Video, MessageSquare, CircleSlash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { CHANNELS } from '@/lib/data';

interface UserProfileDialogProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function UserProfileDialog({
  user,
  isOpen,
  onOpenChange,
}: UserProfileDialogProps) {
  const navigate = useNavigate();

  const handleSendMessage = () => {
    // This is a simplified logic. In a real app, you'd search for an existing DM
    // or create a new one, then navigate.
    const existingDm = CHANNELS.find(
      (c) =>
        c.type === 'dm' &&
        c.memberIds?.includes('user-1') &&
        c.memberIds?.includes(user.id)
    );

    if (existingDm) {
      navigate(`/dms/${existingDm.id}`);
    } else {
      // Logic to create a new DM would go here.
      // For now, we'll just log it.
      console.log(`Create a new DM with ${user.name}`);
    }
    onOpenChange(false);
  };

  const getStatusDisplay = (status: User['status']) => {
    switch (status) {
      case 'online': return { text: 'Online', icon: null, color: 'bg-green-500' };
      case 'offline': return { text: 'Offline', icon: null, color: 'bg-gray-400' };
      case 'away': return { text: 'Away', icon: null, color: 'bg-yellow-500' };
      case 'dnd': return { text: 'Do Not Disturb', icon: <CircleSlash className="h-3 w-3" />, color: 'bg-red-500' };
    }
  }

  const statusDisplay = getStatusDisplay(user.status);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <div className="relative w-24 h-24 mb-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatarUrl} data-ai-hint="person portrait" />
              <AvatarFallback className="text-3xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className={cn("absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background", statusDisplay.color)} />
          </div>
          <DialogTitle className="text-2xl">{user.name}</DialogTitle>
          {user.customStatus && <DialogDescription>{user.customStatus}</DialogDescription>}
          <DialogDescription className="capitalize flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', statusDisplay.color)} />
            {statusDisplay.icon}
            {statusDisplay.text}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Contact Information
          </h3>
          <div className="space-y-2">
            <p className="text-sm">
              Email: {user.name.toLowerCase().replace(' ', '.')}@nexus.com
            </p>
            <p className="text-sm">Timezone: (Placeholder)</p>
          </div>
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={handleSendMessage}>
            <MessageSquare className="mr-2" />
            Message
          </Button>
          <Button variant="outline">
            <Video className="mr-2" />
            Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
