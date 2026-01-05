'use client';

import type { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Video, MessageSquare, CircleSlash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { CHANNELS } from '@/lib/data';
import { RoleBadges } from '../ui/role-badges';

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
    const existingDm = CHANNELS.find(
      (c) =>
        c.type === 'dm' &&
        c.memberIds?.includes('user-1') &&
        c.memberIds?.includes(user.id)
    );

    if (existingDm) {
      navigate(`/dms/${existingDm.id}`);
    } else {
      // DM creation logic handled by backend
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
              <AvatarImage src={user.avatar} data-ai-hint="person portrait" />
              <AvatarFallback className="text-3xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className={cn("absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background", statusDisplay.color)} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <DialogTitle className="text-2xl">{user.name}</DialogTitle>
            <RoleBadges roles={user.roles} />
          </div>
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
