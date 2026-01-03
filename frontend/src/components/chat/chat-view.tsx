
'use client';

import type { Channel, Message, User } from '@/lib/types';
import { useState, useRef, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Paperclip,
  Send,
  Video,
  Phone,
  Hash,
  Mic,
  Smile,
  X,
  User as UserIcon,
  MoreVertical,
  Search,
  BellOff,
  LogOut,
  Pin,
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import MessageItem from './message-item';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { USERS } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import UserProfileDialog from '../user/user-profile-dialog';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import PinnedMessagesDialog from './pinned-messages-dialog';
import AddMemberDialog from '../channel/add-member-dialog';


const getStatusClasses = (status: User['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-gray-400 border-background';
    case 'away': return 'bg-yellow-500';
    case 'dnd': return 'bg-red-500';
  }
}

interface ChatViewProps {
  activeChannel: Channel;
  initialMessages: Message[];
  users: User[];
  currentUser: User;
  onUpdateChannel?: (channel: Channel) => void;
  onSendMessage?: (content: string, type?: Message['type']) => void;
}

const ChatHeader = ({
  channel,
  users,
  onHeaderClick,
  onViewPins
}: {
  channel: Channel;
  users: User[];
  onHeaderClick: () => void;
  onViewPins: () => void;
}) => {
  const isDm = channel.type === 'dm';
  let name = channel.name;
  let user: User | undefined;
  let avatar: string | undefined;
  let fallback: string = '#';
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  if (isDm) {
    const otherUserId = channel.memberIds?.find((id) => id !== 'user-1');
    user = users.find((u) => u.id === otherUserId);
    if (user) {
      name = user.name;
      avatar = user.avatar;
      fallback = user.name.charAt(0);
    }
  }

  return (
    <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-secondary h-16 md:h-auto">
      <button className="flex items-center gap-3 truncate" onClick={onHeaderClick}>
        {isDm && user ? (
          <div className="relative">
            <Avatar>
              <AvatarImage
                src={avatar}
                alt={name}
                data-ai-hint="person portrait"
              />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-secondary", getStatusClasses(user.status))} />
          </div>
        ) : (
          <div className="p-2 bg-muted rounded-full">
            <Hash className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="truncate">
          <h2 className="text-lg font-bold text-foreground truncate">{name}</h2>
          {isDm && user?.customStatus && <p className="text-xs text-muted-foreground truncate">{user.customStatus}</p>}
        </div>
      </button>

      <div className="flex items-center gap-1">
        {isSearchVisible ? (
          <div className="relative">
            <Input placeholder="Search..." className="h-9 pr-8 w-36 sm:w-auto" />
            <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setIsSearchVisible(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setIsSearchVisible(true)} className="hidden sm:inline-flex">
            <Search />
          </Button>
        )
        }
        <Button variant="ghost" size="icon">
          <Video />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Phone />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setIsSearchVisible(true)}>
              <Search className="mr-2" />
              Search
            </DropdownMenuItem>
            {!isDm && (
              <DropdownMenuItem onSelect={onViewPins}>
                <Pin className="mr-2" />
                View Pinned Messages
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <BellOff className="mr-2" />
              Mute Notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

const ProfileDialog = ({
  channel,
  users,
  isOpen,
  onOpenChange,
  onViewProfile,
}: {
  channel: Channel;
  users: User[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onViewProfile: (user: User) => void;
}) => {
  const isDm = channel.type === 'dm';
  const otherUserId = channel.memberIds?.find((id) => id !== 'user-1');
  const user = users.find((u) => u.id === otherUserId);
  const channelMembers = channel.memberIds
    ? users.filter((u) => channel.memberIds!.includes(u.id))
    : [];

  const getStatusClasses = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-400';
      case 'away': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {isDm && user ? (
          <>
            <DialogHeader className="items-center text-center">
              <div className="relative w-24 h-24 mb-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar} data-ai-hint="person portrait" />
                  <AvatarFallback className="text-3xl">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background", getStatusClasses(user.status))} />
              </div>
              <DialogTitle className="text-2xl">{user.name}</DialogTitle>
              {user.customStatus && <DialogDescription>{user.customStatus}</DialogDescription>}
              <DialogDescription className="capitalize flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', getStatusClasses(user.status))} />
                {user.status === 'dnd' ? 'Do Not Disturb' : user.status}
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
              <Button>
                <Video className="mr-2" />
                Call
              </Button>
              <Button variant="outline" onClick={() => onViewProfile(user)}>
                <UserIcon className="mr-2" />
                View Profile
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="p-4 bg-muted rounded-full inline-block mb-4 self-center">
                <Hash className="h-10 w-10 text-muted-foreground" />
              </div>
              <DialogTitle className="text-2xl text-center"># {channel.name}</DialogTitle>
              <DialogDescription className="text-center">{channel.description}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {channelMembers.length} Members
                </h3>
                <AddMemberDialog
                  channelId={channel.id}
                  users={users}
                  currentMemberIds={channel.memberIds || []}
                />
              </div>
              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {channelMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => onViewProfile(member)}
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={member.avatar}
                            data-ai-hint="person portrait"
                          />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background", getStatusClasses(member.status))} />
                      </div>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.status === 'dnd' ? 'Do Not Disturb' : member.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="destructive" size="sm">
                <LogOut className="mr-2" />
                Leave Channel
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function ChatView({
  activeChannel,
  initialMessages,
  users,
  currentUser,
  onUpdateChannel,
  onSendMessage,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.map(m => ({
    ...m,
    pinned: activeChannel.pinnedMessageIds?.includes(m.id)
  })));

  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isPinsDialogOpen, setIsPinsDialogOpen] = useState(false);


  // Mention state
  const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const mentionTriggerIndexRef = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(initialMessages.map(m => ({
      ...m,
      pinned: activeChannel.pinnedMessageIds?.includes(m.id)
    })));
    setIsProfileDialogOpen(false);
  }, [initialMessages, activeChannel]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
      });
    }
  }, [messages]);

  const handleViewProfile = (user: User) => {
    setViewedUser(user);
    setIsProfileDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);

    const atIndex = textBeforeCursor.lastIndexOf('@');
    const spaceAfterAt = textBeforeCursor.indexOf(' ', atIndex);

    if (atIndex > -1 && (spaceAfterAt === -1 || spaceAfterAt > cursorPosition)) {
      const potentialMatch = textBeforeCursor.substring(atIndex + 1);
      if (!/\s/.test(potentialMatch) && (atIndex === 0 || /\s/.test(value.charAt(atIndex - 1)))) {
        setMentionSearch(potentialMatch);
        mentionTriggerIndexRef.current = atIndex;
        setIsMentionPopoverOpen(true);
        return;
      }
    }

    setIsMentionPopoverOpen(false);
  };

  const handleMentionSelect = (user: User) => {
    const textBeforeMention = inputValue.substring(0, mentionTriggerIndexRef.current);
    const textAfterCursor = inputValue.substring(inputRef.current?.selectionStart || 0);

    const newInputValue = `${textBeforeMention}@${user.name} ${textAfterCursor}`;
    setInputValue(newInputValue);
    setIsMentionPopoverOpen(false);
    setMentionSearch('');

    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPosition = (textBeforeMention + `@${user.name} `).length;
      inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const mentionableUsers = useMemo(() => {
    if (activeChannel.type === 'dm') {
      const otherUserId = activeChannel.memberIds?.find(id => id !== currentUser.id);
      return users.filter(
        (user) => user.id === otherUserId || user.id === currentUser.id
      );
    }
    return users.filter((user) => user.id !== 'nexus-ai');
  }, [activeChannel, users, currentUser.id]);

  const filteredUsersForMention = mentionableUsers.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const sendMessage = async (
    content: string,
    type: Message['type'] = 'text'
  ) => {
    if (!content.trim()) return;

    const isAiQuery = content.startsWith('@nexus');

    const userMessage: Message = {
      content,
      senderId: currentUser.id,
      channelId: activeChannel.id,
      type: type,
      replyTo: replyTo?.id,
      // Optimistic update fields
      id: `msg-optimistic-${Date.now()}`,
      timestamp: format(new Date(), 'p'),
      reactions: [],
      attachments: []
    } as any; // Cast for optimistic

    // Optimistic UI update
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setReplyTo(null);

    // Call prop if available (Redux dispatch)
    if (onSendMessage) {
      onSendMessage(content, type);
    } else {
      // Fallback to internal API call (for other pages if any)
      try {
        const savedMessage = await api.createMessage({
          content,
          channelId: activeChannel.id,
          type,
          replyTo: replyTo?.id
        });
        // Replace optimistic message with real one
        setMessages((prev) => prev.map(m => m.id === userMessage.id ? savedMessage : m));
      } catch (error) {
        toast({ title: 'Failed to send message', variant: 'destructive' });
        setMessages((prev) => prev.filter(m => m.id !== userMessage.id)); // Rollback
      }
    }


    if (isAiQuery) {
      const botTypingMessage: Message = {
        id: `msg-typing-${Date.now()}`,
        senderId: 'nexus-ai',
        content: 'Nexus AI is thinking...',
        timestamp: format(new Date(), 'p'),
        channelId: activeChannel.id,
        type: 'bot',
      };
      setMessages((prev) => [...prev, botTypingMessage]);

      const query = content.replace('@nexus', '').trim();
      const contextMessages = messages
        .slice(-50)
        .map(
          (m) => `${users.find((u) => u.id === m.senderId)?.name}: ${m.content}`
        );

      try {
        const result = await api.chatAi(query, contextMessages);

        const botMessage: Message = {
          id: `msg-bot-${Date.now()}`,
          senderId: 'nexus-ai',
          content: result.message,
          timestamp: format(new Date(), 'p'),
          channelId: activeChannel.id,
          type: 'bot',
        } as any;

        setMessages((prev) =>
          prev.filter((m) => m.id !== botTypingMessage.id).concat(botMessage)
        );
        // Also persist bot message to DB ideally, but for now just UI. 
        // Real bot flow should be: separate backend endpoint triggers bot, bot replies async.
        // Here we just simulate.
        await api.createMessage({
          content: result.message,
          channelId: activeChannel.id,
          type: 'bot'
        });

      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.id !== botTypingMessage.id));
        toast({ title: 'AI failed to respond', variant: 'destructive' });
      }

    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isExcel =
      file.type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.endsWith('.xlsx');
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (isImage || isVideo) {
      const reader = new FileReader();
      reader.onload = async () => {
        // Upload file first
        try {
          const uploadedFile = await api.uploadFile(file);
          const dataUri = uploadedFile.url; // Use the returned URL
          const mediaType = isImage ? 'image' : 'video';
          sendMessage(dataUri, mediaType);
        } catch (error) {
          toast({ title: 'Upload failed', variant: 'destructive' });
        }
      };
      reader.readAsDataURL(file);
    } else if (isExcel) {

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;

        const botTypingMessage: Message = {
          id: `msg-typing-${Date.now()}`,
          senderId: 'nexus-ai',
          content: `Nexus AI is analyzing the file...`,
          timestamp: format(new Date(), 'p'),
          channelId: activeChannel.id,
          type: 'bot',
        };
        setMessages((prev) => [...prev, botTypingMessage]);

        const result = await api.uploadExcel(dataUri);

        const content = result.message; // Adjusted to match api-client return

        const botMessage: Message = {
          id: `msg-bot-${Date.now()}`,
          senderId: 'nexus-ai',
          content: content,
          timestamp: format(new Date(), 'p'),
          channelId: activeChannel.id,
          type: result.success ? 'bot' : 'text',
        };
        setMessages((prev) =>
          prev.filter((m) => m.id !== botTypingMessage.id).concat(botMessage)
        );
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a .xlsx, image, or video file.',
        variant: 'destructive',
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceMessage = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          });
          const audioUrl = URL.createObjectURL(audioBlob);
          sendMessage(audioUrl, 'voice');
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast({ title: 'Recording started...' });
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({ title: 'Microphone access denied', variant: 'destructive' });
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  const handleUpdateMessage = (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: newContent, edited: true } : m
      )
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    api.deleteMessage(messageId).catch(console.error);
  };


  const handleReactToMessage = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          api.reactToMessage(messageId, emoji).catch(console.error); // Fire and forget
          const reactions = m.reactions || [];
          const existingReactionIndex = reactions.findIndex(
            (r) => r.emoji === emoji && r.userId === currentUser.id
          );
          if (existingReactionIndex > -1) {
            return {
              ...m,
              reactions: reactions.filter(
                (_, index) => index !== existingReactionIndex
              ),
            };
          } else {
            return {
              ...m,
              reactions: [...reactions, { emoji, userId: currentUser.id }],
            };
          }
        }
        return m;
      })
    );
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyTo(message);
  };

  const handleTogglePinMessage = (message: Message) => {
    const isPinned = activeChannel.pinnedMessageIds?.includes(message.id);
    let newPinnedIds: string[];

    if (isPinned) {
      newPinnedIds = activeChannel.pinnedMessageIds?.filter(id => id !== message.id) || [];
      toast({ title: 'Message unpinned' });
    } else {
      newPinnedIds = [...(activeChannel.pinnedMessageIds || []), message.id];
      toast({ title: 'Message pinned' });
    }

    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, pinned: !isPinned } : m));
    if (onUpdateChannel) {
      onUpdateChannel({ ...activeChannel, pinnedMessageIds: newPinnedIds });
    }
    api.pinMessage(message.id).catch(console.error);

  };

  const getReplyingToUser = () => {
    if (!replyTo) return null;
    return users.find((u) => u.id === replyTo.senderId);
  };

  const getPinnedMessages = () => {
    if (!activeChannel.pinnedMessageIds) return [];
    return messages.filter(m => activeChannel.pinnedMessageIds!.includes(m.id));
  };

  const handleJumpToMessage = (messageId: string) => {
    setIsPinsDialogOpen(false);
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        const offsetTop = messageElement.offsetTop - viewport.getBoundingClientRect().top;
        viewport.scrollTo({ top: offsetTop, behavior: 'smooth' });

        // Highlight effect
        messageElement.classList.add('bg-yellow-400/20', 'transition-all', 'duration-1000');
        setTimeout(() => {
          messageElement.classList.remove('bg-yellow-400/20');
        }, 2000);
      }
    }
  };


  return (
    <div className="flex flex-col flex-1 h-full bg-background overflow-hidden">
      <ChatHeader
        channel={activeChannel}
        users={users}
        onHeaderClick={() => setIsProfileDialogOpen(true)}
        onViewPins={() => setIsPinsDialogOpen(true)}
      />
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-1">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              sender={
                users.find((u) => u.id === msg.senderId) ||
                USERS.find((u) => u.id === 'nexus-ai')!
              }
              currentUser={currentUser}
              onUpdateMessage={handleUpdateMessage}
              onDeleteMessage={handleDeleteMessage}
              onReact={handleReactToMessage}
              onReply={handleReplyToMessage}
              onTogglePin={handleTogglePinMessage}
              onViewProfile={handleViewProfile}
              users={users}
              allMessages={messages}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border bg-secondary">
        <Popover open={isMentionPopoverOpen} onOpenChange={setIsMentionPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              {replyTo && (
                <div className="flex items-center justify-between text-xs bg-muted p-2 rounded-t-md">
                  <p className="text-muted-foreground">
                    Replying to{' '}
                    <span className="font-semibold text-foreground">
                      {getReplyingToUser()?.name}
                    </span>
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setReplyTo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input
                ref={inputRef}
                placeholder={`Message #${activeChannel.name}`}
                className={cn('pr-28 sm:pr-40 bg-background', replyTo && 'rounded-t-none')}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isMentionPopoverOpen) {
                    e.preventDefault();
                    sendMessage(inputValue);
                  }
                }}
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                      <Smile />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0">
                    <div className="grid grid-cols-8 gap-2 p-2">
                      {[
                        '😀', '😂', '😍', '🤔', '👍', '🙏', '🎉', '❤️', '🔥', '💯', '👏', '😢', '😮', '🤯', '😎', '😴',
                      ].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-2xl rounded-md hover:bg-muted p-1 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".xlsx,image/*,video/*"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceMessage}
                  className={cn(isRecording && 'text-destructive')}
                >
                  <Mic />
                </Button>
                <Button
                  size="icon"
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim()}
                >
                  <Send />
                </Button>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <Command>
              <CommandInput value={mentionSearch} onValueChange={setMentionSearch} placeholder="Mention a user..." />
              <CommandList>
                {filteredUsersForMention.length === 0 && (
                  <div className="p-4 text-sm text-center text-muted-foreground">No users found.</div>
                )}
                <CommandGroup>
                  {filteredUsersForMention.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => handleMentionSelect(user)}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground mt-2">
          You can ask AI questions with{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-foreground">
            @nexus
          </code>
          .
        </p>
      </div>
      <ProfileDialog
        channel={activeChannel}
        users={users}
        isOpen={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        onViewProfile={handleViewProfile}
      />
      {viewedUser && (
        <UserProfileDialog
          user={viewedUser}
          isOpen={!!viewedUser}
          onOpenChange={() => setViewedUser(null)}
        />
      )}
      <PinnedMessagesDialog
        isOpen={isPinsDialogOpen}
        onOpenChange={setIsPinsDialogOpen}
        messages={getPinnedMessages()}
        users={users}
        onJumpToMessage={handleJumpToMessage}
      />
    </div>
  );
}
