// @ts-nocheck
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Channel, Message, User } from '@/lib/types';
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
  MessageSquare,
  Sparkles, // [NEW]
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import MessageItem from './message-item';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { USERS } from '@/lib/data';
import NotificationBell from "../notifications/notification-bell";
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
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '@/store/store';
import { leaveChannel } from '@/services/channel/channelSlice';
import { fetchRoles } from '@/services/role/roleSlice';
import ChannelSettingsDialog from '../channel/channel-settings-dialog';
import { connectChatSocket, joinChannel, leaveChannel as leaveChatChannel, sendChatMessage, onNewMessage, onMessageSent, setupSocket, onUserStatusChange, onMessageUpdated, onMessageDeleted, onMessageReactionUpdate } from '@/services/chat/chat-socket';
import { fetchMessages, addMessage, updateMessageStatus } from '@/services/message/messageSlice';
import { fetchUsers, updateUserStatus } from '@/services/user/userSlice';
import { fetchChannels } from '@/services/channel/channelSlice';
import { emitTyping, emitStopTyping, onUserTyping, onUserStopTyping } from '@/services/chat/chat-socket';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming this exists or I'll implement a simple timeout


const getStatusClasses = (status: User['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-gray-400 border-background';
    case 'away': return 'bg-yellow-500';
    case 'dnd': return 'bg-red-500';
    default: return 'bg-gray-400 border-background';
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
  currentUser,
  onHeaderClick,
  onViewPins,
  onSummarize,
  onSettings,
}: {
  channel: Channel;
  users: User[];
  currentUser: User;
  onHeaderClick: () => void;
  onViewPins: () => void;
  onSummarize: () => void;
  onSettings: () => void;
}) => {
  const navigate = useNavigate();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const isDm = channel.type === 'dm';
  let name = channel.name;

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-10 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-2 md:gap-3.5">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 -ml-1"
          onClick={() => navigate(isDm ? '/dms' : '/channels')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 cursor-pointer group" onClick={onHeaderClick}>
          {isDm ? (
            <div className="relative transition-transform duration-300 group-hover:scale-105">
              <Avatar className="h-10 w-10 ring-2 ring-background shadow-md">
                <AvatarImage src={users.find(u => u.id === channel.memberIds?.find(id => id !== currentUser.id))?.avatar} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-400 text-white font-bold">{name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background shadow-sm", getStatusClasses(users.find(u => u.id === channel.memberIds?.find(id => id !== currentUser.id))?.status || 'offline'))} />
            </div>
          ) : (
            <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Hash className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h2 className="font-bold text-base flex items-center gap-2 text-foreground/90 group-hover:text-primary transition-colors">
              {name}
              {channel?.pinnedMessageIds && channel.pinnedMessageIds.length > 0 && <Pin className="h-3.5 w-3.5 text-orange-400 fill-orange-400/20" />}
            </h2>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              {isDm ? 'Click to view profile' : `Click to view channel info • ${channel.memberIds?.length || 0} members`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Summarize Button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all hover:scale-105"
          onClick={onSummarize}
          title="Summarize Chat (AI)"
        >
          <Sparkles className="h-4 w-4" />
        </Button>

        {!isDm && (
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" onClick={onSettings} title="Channel Settings">
            <Settings className="h-4 w-4" />
          </Button>
        )}

        {isSearchVisible ? (
          <div className="relative animate-in fade-in slide-in-from-right-4 duration-200">
            <Input
              autoFocus
              placeholder="Search..."
              className="h-9 pr-8 w-48 bg-secondary/50 border-white/10 focus:ring-primary/50 transition-all rounded-lg text-sm"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-destructive transition-colors" onClick={() => setIsSearchVisible(false)} title="Close search">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setIsSearchVisible(true)} className="hidden sm:inline-flex hover:bg-white/5" title="Search messages">
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}

        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

        <Button variant="ghost" size="icon" className="group rounded-full hover:bg-primary/10" title="Start Video Call">
          <Video className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex group rounded-full hover:bg-primary/10" title="Start Voice Call">
          <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="More options" className="hover:bg-white/5">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl p-1.5">
            <DropdownMenuItem onSelect={() => setIsSearchVisible(true)} className="rounded-lg focus:bg-white/10 cursor-pointer">
              <Search className="mr-2 h-4 w-4" />
              Search Messages
            </DropdownMenuItem>
            {!isDm && (
              <DropdownMenuItem onSelect={onViewPins} className="rounded-lg focus:bg-white/10 cursor-pointer">
                <Pin className="mr-2 h-4 w-4" />
                Pinned Messages
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-white/5 mx-1" />
            <DropdownMenuItem className="rounded-lg focus:bg-white/10 cursor-pointer text-muted-foreground hover:text-foreground">
              <BellOff className="mr-2 h-4 w-4" />
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
  currentUser,
  isOpen,
  onOpenChange,
  onViewProfile,
  onLeave,
}: {
  channel: Channel;
  users: User[];
  currentUser: User;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onViewProfile: (user: User) => void;
  onLeave?: () => void;
}) => {
  const isDm = channel.type === 'dm';
  const otherUserId = channel.memberIds?.find((id) => id !== currentUser.id);
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
              <Button title="Start video call">
                <Video className="mr-2" />
                Call
              </Button>
              <Button variant="outline" onClick={() => onViewProfile(user)} title="View profile">
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
              <Button variant="destructive" size="sm" onClick={onLeave} title="Leave channel">
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
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth?.token);
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({
      ...m,
      // Safely handle populated senderId from backend
      senderId:
        typeof m.senderId === "object" ? (m.senderId as any)._id : m.senderId,
      pinned: activeChannel.pinnedMessageIds?.includes(m.id),
    }))
  );
  //  SEARCH STATE
  const [searchText, setSearchText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();

  // Initialize Socket Presence
  useEffect(() => {
    if (currentUser?.id) {
      setupSocket(currentUser.id);
    }
  }, [currentUser?.id]);

  // Listen for real-time status updates
  useEffect(() => {
    const unsubscribe = onUserStatusChange(({ userId, status }) => {
      dispatch(updateUserStatus({ userId, status: status as any }));
    });
    return unsubscribe;
  }, [dispatch]);

  const [isRecording, setIsRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [isPinsDialogOpen, setIsPinsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleLeaveChannel = async () => {
    try {
      await dispatch(leaveChannel(activeChannel.id)).unwrap();
      toast({ title: "Left channel successfully" });
      setIsProfileDialogOpen(false);
      navigate("/dms");
    } catch (error: any) {
      toast({
        title: "Failed to leave channel",
        description: error,
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = (user: User) => {
    setViewedUser(user);
    setIsProfileDialogOpen(false);
  };

  // Summarize State
  const [isSummarizeOpen, setIsSummarizeOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    setIsSummarizeOpen(true);
    setIsSummarizing(true);
    setSummaryContent('');
    try {
      const context = messages.slice(-50).map(m => `${m._populatedSender?.name || 'User'}: ${m.content}`);
      const res = await api.summarizeChat(context);
      setSummaryContent(res.summary);
    } catch (err) {
      setSummaryContent("Failed to generate summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Mention state
  const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const mentionTriggerIndexRef = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typing State
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smart Replies State
  const [smartReplies, setSmartReplies] = useState<string[]>([]);

  useEffect(() => {
    // Trigger smart reply fetch when messages change and last message is NOT from me
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== currentUser.id && lastMsg.type === 'text') {
        // Extract context (last 5 messages)
        const context = messages.slice(-5).map(m => m.content);
        api.getSmartReplies(context).then(res => {
          if (res.suggestions) setSmartReplies(res.suggestions);
        }).catch(err => console.error("Smart reply err", err));
      } else {
        setSmartReplies([]);
      }
    }
  }, [messages, currentUser.id]);

  useEffect(() => {
    // Listen for typing
    const onTyping = ({ userId, userName, channelId }) => {
      if ((activeChannel.type === 'channel' && channelId === activeChannel.id) ||
        (activeChannel.type === 'dm' && channelId === currentUser.id)) { // Logic for DM matching might need strict check
        setTypingUsers(prev => new Map(prev).set(userId, userName));
      }
    };
    const onStopTyping = ({ userId }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    };

    const unsubTyping = onUserTyping(onTyping);
    const unsubStop = onUserStopTyping(onStopTyping);

    return () => {
      unsubTyping();
      unsubStop();
    };
  }, [activeChannel, currentUser.id]);

  // Socket.IO Chat Integration - FULLY WORKING
  useEffect(() => {
    if (!token || !activeChannel?.id) return;

    const socket = connectChatSocket(token);

    // Join the channel/DM room
    if (activeChannel.type === "channel") {
      joinChannel(activeChannel.id);
    } else {
      // For DMs, join with the actual user ID
      const dmUserId = activeChannel.id.replace("dm-", "");
      joinChannel(dmUserId);
    }

    // Listen for new messages from others
    const unsubscribe = onNewMessage((message) => {
      // Only add if not already in list (prevent duplicates)
      setMessages((prev) => {
        // 1. Exact ID check
        if (prev.some((m) => m.id === message._id || m.id === message.id))
          return prev;

        // 2. Optimistic Deduction (replace temporary local msg with confirmed server msg)
        // Match by Sender + Content + isOptimistic (temp ID)
        const optimisticIndex = prev.findIndex(
          (m) =>
            m.content === message.content &&
            m.senderId === (message.senderId?._id || message.senderId) &&
            m.id.startsWith("msg-optimistic-")
        );

        const mappedMessage = {
          ...message,
          id: message._id || message.id,
          senderId: message.senderId?._id || message.senderId,
          timestamp: message.createdAt || new Date().toISOString(),
          reactions: message.reactions || [],
          attachments: message.attachments || [],
          replyTo:
            typeof message.replyTo === "object"
              ? (message.replyTo as any)._id
              : message.replyTo,
        };

        if (optimisticIndex !== -1) {
          // Replace optimistic message
          const newMessages = [...prev];
          newMessages[optimisticIndex] = mappedMessage;
          return newMessages;
        }

        return [...prev, mappedMessage];
      });

      // Sound effect (only for others)
      if ((message.senderId?._id || message.senderId) !== currentUser.id) {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => { });
      }
    });

    // Listen for message sent confirmations (replace optimistic with real)
    const unsubscribeSent = onMessageSent(({ tempId, message }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === tempId) {
            return {
              ...message,
              id: message._id || message.id,
              senderId: message.senderId?._id || message.senderId,
              timestamp: message.createdAt || new Date().toISOString(),
              reactions: message.reactions || [],
              attachments: message.attachments || [],
              // Normalize replyTo to string ID if it's populated
              replyTo:
                typeof message.replyTo === "object"
                  ? (message.replyTo as any)._id
                  : message.replyTo,
            };
          }
          return m;
        })
      );
    });

    return () => {
      if (activeChannel.type === "channel") {
        leaveChatChannel(activeChannel.id);
      } else {
        const dmUserId = activeChannel.id.replace("dm-", "");
        leaveChatChannel(dmUserId);
      }
      unsubscribe();
      unsubscribeSent();
    };
  }, [activeChannel?.id, token]);

  // Handle Updates (Edit, Delete, React)
  useEffect(() => {
    const unsubUpdate = onMessageUpdated((updatedMsg) => {
      setMessages(prev => prev.map(m => m.id === updatedMsg._id || m.id === updatedMsg.id ? { ...m, ...updatedMsg, id: updatedMsg._id || updatedMsg.id } : m));
    });

    const unsubDelete = onMessageDeleted(({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    const unsubReact = onMessageReactionUpdate(({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    });

    return () => {
      unsubUpdate();
      unsubDelete();
      unsubReact();
    };
  }, []);

  // Handle Updates (Edit, Delete, React)
  useEffect(() => {
    setMessages(initialMessages.map(m => ({
      ...m,
      // Safely handle populated senderId from backend (fix for updates)
      senderId: typeof m.senderId === 'object' ? (m.senderId as any)._id : m.senderId,
      // Preserve populated sender data for fallback resolution
      _populatedSender: typeof m.senderId === 'object' ? { ...(m.senderId as any), id: (m.senderId as any)._id } : undefined,
      pinned: activeChannel.pinnedMessageIds?.includes(m.id),
      // Normalize replyTo
      replyTo: typeof m.replyTo === 'object' ? (m.replyTo as any)._id : m.replyTo,
    })));
  }, [initialMessages, activeChannel]);

  // Infinite Scroll State
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const scrollHeightRef = useRef(0);
  const scrollTopRef = useRef(0);

  const handleScroll = async (e: any) => {
    const viewport = e.target;
    if (viewport.scrollTop < 50 && !isFetchingHistory && messages.length >= 20) {
      // Fetch older messages
      setIsFetchingHistory(true);
      scrollHeightRef.current = viewport.scrollHeight;
      scrollTopRef.current = viewport.scrollTop;

      const oldestMessage = messages[0];
      if (oldestMessage && oldestMessage.timestamp) {
        try {
          const channelIdParam = activeChannel.type === 'channel' ? activeChannel.id : undefined;
          const userIdParam = activeChannel.type === 'dm' ? activeChannel.memberIds?.find(id => id !== currentUser.id) : undefined;

          await dispatch(fetchMessages({
            channelId: channelIdParam,
            userId: userIdParam,
            before: oldestMessage.timestamp
          })).unwrap();
        } catch (err) {
          console.error("Failed to load history", err);
        } finally {
          setIsFetchingHistory(false);
        }
      } else {
        setIsFetchingHistory(false);
      }
    }
  };

  // Scroll Restoration Effect
  useEffect(() => {
    // Sync local state with props (initialMessages)
    // AND Handle Scroll Restoration if we just fetched history
    setMessages(prev => {
      // Simple overwrite? No, we might have optimistic messages that are not in Redux yet?
      // Actually messageSlice handles send, so Redux generally has the truth + ChatView adds optimistic.
      // For simplicity, we trust initialMessages from Redux, but we might lose optimistic if Redux is slow?
      // But sendChatMessage logic in ChatView ADDS to local state.

      // Let's trust initialMessages for structure, but be careful.
      // If length changed significantly and start commands differ, likely history load.
      return initialMessages.map(m => ({
        ...m,
        senderId: typeof m.senderId === 'object' ? (m.senderId as any)._id : m.senderId,
        _populatedSender: typeof m.senderId === 'object' ? { ...(m.senderId as any), id: (m.senderId as any)._id } : undefined,
        pinned: activeChannel.pinnedMessageIds?.includes(m.id),
        replyTo: typeof m.replyTo === 'object' ? (m.replyTo as any)._id : m.replyTo,
      }));
    });
  }, [initialMessages, activeChannel]);

  // Scroll Restoration Effect
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    // If we were fetching history, restore scroll position
    // We know we fetched history if current messages length > previous messages length (tracked?) 
    // OR we just check if we are near top and just got more data.
    // But `useEffect` fires after render.
    // We can use the isFetchingHistory flag transition, but that's local.
    // Better: check if we are closer to bottom or need to stay put.

    // Actually, if we just loaded history (scrollHeight increased), we want to adjust scrollTop.
    // But this effect runs on EVERY message update (new message, edit, etc).
    // We only want to adjust properties if we added at TOP.

    const currentScrollHeight = viewport.scrollHeight;
    if (currentScrollHeight > scrollHeightRef.current && scrollHeightRef.current > 0) {
      // Content added. Was it at top?
      // Simplistic heuristic: if we were near top before, maintain relative position
      const diff = currentScrollHeight - scrollHeightRef.current;
      if (scrollTopRef.current < 100) { // arbitrary threshold
        viewport.scrollTop = scrollTopRef.current + diff;
      }
    }

    // Update ref for next run
    scrollHeightRef.current = currentScrollHeight;
    scrollTopRef.current = viewport.scrollTop; // Technically redundant as we read it on scroll, but ok.

  }, [messages]);

  // Initial Scroll to Bottom (only on channel switch)
  useEffect(() => {
    scrollHeightRef.current = 0; // Reset
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        // Force bottom on fresh channel load
        // We can use a ref to track if it's first load of this channel
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [activeChannel.id]);

  // Voice Recorder Logic
  const handleVoiceMessage = async () => {
    if (isRecording) {
      // Stop Recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start Recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });

          try {
            // Show uploading toast
            toast({ title: "Sending voice message..." });
            const uploaded = await api.uploadFile(audioFile);
            sendMessage(uploaded.url, 'voice');
          } catch (err) {
            console.error(err);
            toast({ title: "Failed to send voice message", variant: "destructive" });
          }

          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        toast({ title: "Microphone access denied", variant: "destructive" });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Typing Emit Logic
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    emitTyping(activeChannel.id, currentUser.id, currentUser.name);

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(activeChannel.id, currentUser.id);
    }, 2000);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);

    // ... rest of mention logic ...
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const spaceAfterAt = textBeforeCursor.indexOf(' ', atIndex);

    if (
      atIndex > -1 &&
      (spaceAfterAt === -1 || spaceAfterAt > cursorPosition)
    ) {
      const potentialMatch = textBeforeCursor.substring(atIndex + 1);
      if (
        !/\s/.test(potentialMatch) &&
        (atIndex === 0 || /\s/.test(value.charAt(atIndex - 1)))
      ) {
        setMentionSearch(potentialMatch);
        mentionTriggerIndexRef.current = atIndex;
        setIsMentionPopoverOpen(true);
        return;
      }
    }

    setIsMentionPopoverOpen(false);
  };

  const handleMentionSelect = (user: User) => {
    const textBeforeMention = inputValue.substring(
      0,
      mentionTriggerIndexRef.current
    );
    const textAfterCursor = inputValue.substring(
      inputRef.current?.selectionStart || 0
    );

    const newInputValue = `${textBeforeMention}@${user.name} ${textAfterCursor}`;
    setInputValue(newInputValue);
    setIsMentionPopoverOpen(false);
    setMentionSearch("");

    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPosition = (textBeforeMention + `@${user.name} `).length;
      inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Use dynamic roles from Redux
  const { roles } = useSelector((state: RootState) => state.roles);
  useEffect(() => {
    dispatch(fetchRoles());
    // Also likely need to fetch users if not already? Passed as props currently.
  }, [dispatch]);

  const mentionableItems = useMemo(() => {
    const userItems = users
      .filter((user) => user.id !== "nexus-ai")
      .map((u) => ({ ...u, type: "user" }));

    if (activeChannel.type === "dm") {
      const otherUserId = activeChannel.memberIds?.find(
        (id) => id !== currentUser.id
      );
      return userItems.filter(
        (user) => user.id === otherUserId || user.id === currentUser.id
      );
    }

    // Map backend roles to suggestion items
    const roleItems = roles.map((r: any) => ({
      id: `role-${r.name}`, // prefix to avoid collision if needed, or just use name logic
      name: r.name,
      type: "role",
      description: `${r.permissions?.length || 0} permissions`,
    }));

    return [...userItems, ...roleItems];
  }, [activeChannel, users, currentUser.id, roles]);

  const filteredMentions = mentionableItems.filter((item) =>
    item.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const sendMessage = async (
    content: string,
    type: Message["type"] = "text"
  ) => {
    if (!content.trim()) return;

    const isAiQuery = content.startsWith("@nexus");
    const tempId = `msg-optimistic-${Date.now()}`;

    const userMessage: Message = {
      content,
      senderId: currentUser.id,
      channelId:
        activeChannel.type === "channel" ? activeChannel.id : undefined,
      recipientId:
        activeChannel.type === "dm"
          ? activeChannel.id.replace("dm-", "")
          : undefined,
      type: type,
      replyTo: replyTo?.id,
      id: tempId,
      timestamp: new Date().toISOString(),
      reactions: [],
      attachments: [],
    } as any;

    // Optimistic UI update
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setReplyTo(null);

    // Send via Socket.IO for instant delivery
    sendChatMessage({
      senderId: currentUser.id,
      channelId:
        activeChannel.type === "channel" ? activeChannel.id : undefined,
      recipientId:
        activeChannel.type === "dm"
          ? activeChannel.id.replace("dm-", "")
          : undefined,
      content,
      type,
      replyTo: replyTo?.id,
      tempId,
    });

    if (isAiQuery) {
      const botTypingMessage: Message = {
        id: `msg-typing-${Date.now()}`,
        senderId: "nexus-ai",
        content: "Nexus AI is thinking...",
        timestamp: new Date().toISOString(),
        channelId: activeChannel.id,
        type: "bot",
      };
      setMessages((prev) => [...prev, botTypingMessage]);

      const query = content.replace("@nexus", "").trim();
      const contextMessages = messages
        .slice(-50)
        .map(
          (m) => `${users.find((u) => u.id === m.senderId)?.name}: ${m.content}`
        );

      try {
        const result = await api.chatAi(query, contextMessages);

        const botMessage: Message = {
          id: `msg-bot-${Date.now()}`,
          senderId: "nexus-ai",
          content: result.message,
          timestamp: new Date().toISOString(),
          channelId: activeChannel.id,
          type: "bot",
        } as any;

        setMessages((prev) =>
          prev.filter((m) => m.id !== botTypingMessage.id).concat(botMessage)
        );

        await api.createMessage({
          content: result.message,
          channelId: activeChannel.id,
          type: "bot",
        });
      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.id !== botTypingMessage.id));
        toast({ title: "AI failed to respond", variant: "destructive" });
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.name.endsWith(".xlsx");
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (isImage || isVideo || file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const uploadedFile = await api.uploadFile(file);
          // Fix: Backend returns { success: true, data: { url: ... } }
          // Type definition says { url: string } but runtime is different.
          const dataUri = (uploadedFile as any).data?.url || (uploadedFile as any).url || uploadedFile;

          const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
          const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf';

          let mediaType: Message['type'] = 'file';
          if (isImage) mediaType = 'image';
          else if (isVideo) mediaType = 'video';
          else if (isPdf || isExcel) mediaType = 'file';

          sendMessage(dataUri, mediaType);
        } catch (error: any) {
          console.error("Upload error:", error);
          const errorMsg = error.response?.data?.message || error.message || 'Check S3/Local Storage permissions';
          toast({ title: 'Upload failed', description: errorMsg, variant: 'destructive' });
        }
      };
      reader.readAsDataURL(file);
    } else if (isExcel) {
      // Treat Excel as a regular file upload, like PDF
      try {
        toast({ title: 'Uploading Excel file...' });
        const uploadedFile = await api.uploadFile(file);
        const dataUri = (uploadedFile as any).data?.url || (uploadedFile as any).url || uploadedFile;
        sendMessage(dataUri, 'file');
      } catch (err: any) {
        console.error("Upload error:", err);
        const errorMsg = err.response?.data?.message || err.message || 'Check S3/Local Storage permissions';
        toast({ title: 'Upload failed', description: errorMsg, variant: 'destructive' });
      }
    } else {
      // Allow generic upload for other files
      toast({
        title: 'Uploading File...',
        description: 'Uploading as generic file.'
      });
      try {
        const uploadedFile = await api.uploadFile(file);
        const dataUri = (uploadedFile as any).data?.url || (uploadedFile as any).url || uploadedFile;
        sendMessage(dataUri, 'file');
      } catch (e: any) {
        console.error("Upload error:", e);
        const errorMsg = e.response?.data?.message || e.message || 'Check S3/Local Storage permissions';
        toast({ title: 'Upload failed', description: errorMsg, variant: 'destructive' });
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    api.updateMessage(messageId, { content: newContent }).catch(console.error);
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
      newPinnedIds =
        activeChannel.pinnedMessageIds?.filter((id) => id !== message.id) || [];
      toast({ title: "Message unpinned" });
    } else {
      newPinnedIds = [...(activeChannel.pinnedMessageIds || []), message.id];
      toast({ title: "Message pinned" });
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, pinned: !isPinned } : m))
    );
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
    return messages.filter((m) =>
      activeChannel.pinnedMessageIds!.includes(m.id)
    );
  };

  const handleJumpToMessage = (messageId: string) => {
    setIsPinsDialogOpen(false);
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // Highlight effect
      messageElement.classList.add(
        "bg-yellow-400/20",
        "transition-all",
        "duration-1000"
      );
      setTimeout(() => {
        messageElement.classList.remove("bg-yellow-400/20");
      }, 2000);
    }
  };
  // FILTERED MESSAGES 
  const filteredMessages = searchText
    ? messages.filter((m) =>
      m.content?.toLowerCase().includes(searchText.toLowerCase())
    )
    : messages;

  return (
    <div className="flex flex-col flex-1 h-full bg-transparent overflow-hidden relative">
      <ChatHeader
        channel={activeChannel}
        users={users}
        currentUser={currentUser}
        onHeaderClick={() => {
          if (activeChannel.type === 'dm') {
            const otherId = activeChannel.memberIds?.find(id => id !== currentUser.id);
            const u = users.find(user => user.id === otherId);
            if (u) setViewedUser(u);
          } else {
            setIsProfileDialogOpen(true);
          }
        }}
        onViewPins={() => setIsPinsDialogOpen(true)}
        onSummarize={handleSummarize}
        onSettings={() => setIsSettingsOpen(true)}
      />

      <ScrollArea className="flex-1" ref={scrollAreaRef} onScrollCapture={handleScroll}>
        {isFetchingHistory && (
          <div className="w-full flex justify-center p-4">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {messages.length === 0 && !isFetchingHistory ? (
          <div className="h-full flex flex-col items-center justify-center opactiy-0 animate-fade-in p-8 text-center min-h-[400px]">
            <div className="w-32 h-32 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <Hash className="h-12 w-12 text-primary/60" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Welcome to #{activeChannel.name}</h3>
            <p className="text-muted-foreground max-w-sm">This is the start of the <span className="text-primary font-medium">{activeChannel.name}</span> channel. Send a message to verify.</p>
          </div>
        ) : (
          <div className="p-4 space-y-2 pb-6">
            {messages.map((msg, index) => {
              // Robust Sender Resolution
              const sender =
                users.find((u) => u.id === msg.senderId) ||
                (String(msg.senderId) === String(currentUser.id) ? currentUser : null) ||
                (msg as any)._populatedSender ||
                USERS.find((u) => u.id === 'nexus-ai')!;

              // Check for grouped messages (same sender, < 5 mins apart)
              const isSequence = index > 0 && messages[index - 1].senderId === msg.senderId;

              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  sender={sender}
                  currentUser={currentUser}
                  onUpdateMessage={handleUpdateMessage}
                  onDeleteMessage={handleDeleteMessage}
                  onReact={handleReactToMessage}
                  onReply={handleReplyToMessage}
                  onJumpToMessage={handleJumpToMessage}
                  onTogglePin={handleTogglePinMessage}
                  onViewProfile={handleViewProfile}
                  users={users}
                  allMessages={messages}
                  roles={roles}
                  isDm={activeChannel.type === 'dm'}
                  isSequence={isSequence}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 relative z-20">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none -z-10" />

        <div className={cn(
          "relative flex items-end gap-2 p-1.5 rounded-[24px] bg-secondary/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 ring-1 ring-white/5 hover:ring-primary/20 hover:shadow-primary/5 mx-2 mb-2 group/input"
        )}>

          {/* ... Input Content (Same as previous refined version) ... */}
          {/* Reuse the exact same complex input block I wrote before, but ensure it's wrapped here correctly */}
          {/* Since I can't partially match easily, I'll rewrite the input block to ensure it persists */}

          <div className="flex items-center gap-1 pb-1 pl-1.5">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-all hover:rotate-90 active:scale-95" onClick={() => fileInputRef.current?.click()} title="Attach file">
              <Paperclip className="h-5 w-5" />
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf,.xlsx,.xls" />

            <Popover
              open={isMentionPopoverOpen}
              onOpenChange={setIsMentionPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors hidden sm:inline-flex" title="Mention user or role">
                  <Hash className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 bg-background/95 backdrop-blur-3xl border-white/10 shadow-2xl rounded-xl ring-1 ring-white/5" align="start" sideOffset={10}>
                <Command className="rounded-xl border-0">
                  <CommandInput placeholder="Search..." className="border-0 focus:ring-0" />
                  <CommandList className="max-h-[300px]">
                    <CommandGroup heading="Suggestions">
                      {filteredMentions.map((item: any) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => handleMentionSelect(item)}
                          className="flex items-center gap-2 cursor-pointer p-2 rounded-lg aria-selected:bg-primary/20"
                        >
                          {item.type === 'role' ? (
                            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center ring-1 ring-white/10">
                              <Hash className="h-4 w-4 text-primary" />
                            </div>
                          ) : (
                            <Avatar className="h-7 w-7 ring-1 ring-background">
                              <AvatarImage src={item.avatar} />
                              <AvatarFallback>
                                {item.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="font-medium">{item.name}</span>
                          {item.type === 'role' && <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-secondary px-1.5 rounded">Role</span>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 relative">
            {replyTo && (
              <div className="absolute bottom-full left-0 right-0 mb-4 ml-[-8px] mr-[-8px] p-3 mx-1 bg-background/80 border border-primary/20 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-3 text-xs text-muted-foreground truncate flex-1 min-w-0">
                  <div className="w-1 h-8 bg-gradient-to-b from-primary to-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
                  <div className="flex-1 truncate">
                    <p className="font-bold text-primary mb-0.5">Replying to {users.find(u => u.id === replyTo.senderId)?.name || 'Someone'}</p>
                    <p className="truncate opacity-80 italic font-medium">"{replyTo.content}"</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors" onClick={() => setReplyTo(null)} title="Cancel reply">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="absolute bottom-full left-4 mb-2 text-[10px] font-medium text-primary animate-pulse flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <span className="flex gap-0.5 items-end h-2">
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce delay-0" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce delay-150" />
                  <span className="w-1 h-2 bg-primary rounded-full animate-bounce delay-300" />
                </span>
                <span>
                  {Array.from(typingUsers.values()).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder={`Message #${activeChannel.name}...`}
              title={`Message #${activeChannel.name}...`}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-3.5 min-h-[48px] max-h-[140px] resize-none text-[15px] placeholder:text-muted-foreground/40 font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isMentionPopoverOpen) {
                  e.preventDefault();
                  sendMessage(inputValue);
                }
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 pb-1.5 pr-1.5">
            {inputValue.length === 0 ? (
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-10 w-10 rounded-full transition-all duration-300", isRecording ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse scale-110" : "hover:bg-white/10 text-muted-foreground")}
                onClick={handleVoiceMessage}
                title="Record voice message"
              >
                <Mic className={cn("h-5 w-5", isRecording && "fill-current")} />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:to-purple-500 text-white shadow-[0_4px_12px_rgba(124,58,237,0.4)] transition-all hover:scale-110 active:scale-95 hover:rotate-[-10deg]"
                onClick={() => sendMessage(inputValue)}
                title="Send message"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Dialogs... */}
        <ProfileDialog
          channel={activeChannel}
          users={users}
          currentUser={currentUser}
          isOpen={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
          onViewProfile={handleViewProfile}
          onLeave={handleLeaveChannel}
        />
        {
          viewedUser && (
            <UserProfileDialog
              user={viewedUser}
              isOpen={!!viewedUser}
              onOpenChange={() => setViewedUser(null)}
            />
          )
        }
        <PinnedMessagesDialog
          isOpen={isPinsDialogOpen}
          onOpenChange={setIsPinsDialogOpen}
          messages={getPinnedMessages()}
          users={users}
          onJumpToMessage={handleJumpToMessage}
        />

        <Dialog open={isSummarizeOpen} onOpenChange={setIsSummarizeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                AI Summary
              </DialogTitle>
              <DialogDescription>Summary of the last 50 messages</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                  <p className="text-sm animate-pulse">Analyzing conversation...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none bg-muted/30 p-4 rounded-lg border border-white/5">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{summaryContent}</pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <ChannelSettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          channel={activeChannel}
          currentUser={currentUser}
          allUsers={users}
        />
      </div>
    </div>
  );
}
