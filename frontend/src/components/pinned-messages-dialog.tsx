
"use client";

import { Message, User } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Pin } from 'lucide-react';
import { USERS } from '@/lib/data';

interface PinnedMessagesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  users: User[];
  onJumpToMessage: (messageId: string) => void;
}

export default function PinnedMessagesDialog({ 
  isOpen, 
  onOpenChange, 
  messages, 
  users,
  onJumpToMessage
}: PinnedMessagesDialogProps) {
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5" />
            Pinned Messages
          </DialogTitle>
          <DialogDescription>
            {messages.length} message(s) have been pinned in this channel.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
          <div className="space-y-4 py-4">
            {messages.length > 0 ? (
              messages.map(message => {
                const sender = users.find(u => u.id === message.senderId) || USERS.find(u => u.id === 'nexus-ai')!;
                return (
                  <div key={message.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sender.avatarUrl} alt={sender.name} />
                        <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="font-bold">{sender.name}</p>
                          <p className="text-xs text-muted-foreground">{message.timestamp}</p>
                        </div>
                        <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">{message.content}</p>
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-2"
                            onClick={() => onJumpToMessage(message.id)}
                        >
                            Jump to message
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Pin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No Pinned Messages</h3>
                <p className="mt-1 text-sm">There are no pinned messages in this channel yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
