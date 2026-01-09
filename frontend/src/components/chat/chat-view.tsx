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
import { connectChatSocket, joinChannel, leaveChannel as leaveChatChannel, sendChatMessage, onNewMessage, onMessageSent, setupSocket, onUserStatusChange } from '@/services/chat/chat-socket';
import { fetchMessages, addMessage, updateMessageStatus } from '@/services/message/messageSlice';
import { fetchUsers, updateUserStatus } from '@/services/user/userSlice';
import { fetchChannels } from '@/services/channel/channelSlice';



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
  searchText,
  setSearchText,
}: {
  channel: Channel;
  users: User[];
  currentUser: User;
  onHeaderClick: () => void;
  onViewPins: () => void;
  searchText: string;
  setSearchText: (v: string) => void;
}) => {
  const isDm = channel.type === "dm";
  let name = channel.name;
  let user: User | undefined;
  let avatar: string | undefined;
  let fallback: string = "#";
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  if (isDm) {
    const otherUserId = channel.memberIds?.find(
      (id) => String(id) !== String(currentUser.id)
    );
    user = users.find((u) => String(u.id) === String(otherUserId));
    if (user) {
      name = user.name;
      avatar = user.avatar;
      fallback = user.name.charAt(0);
    }
  }

  return (
    <header className="flex items-center justify-between p-4 border-b border-white/5 bg-background/80 backdrop-blur-xl h-16 md:h-auto transition-all">
      <button
        className="flex items-center gap-3 truncate hover:opacity-80 transition-opacity"
        onClick={onHeaderClick}
      >
        {isDm && user ? (
          <div className="relative group">
            <Avatar className="ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
              <AvatarImage
                src={avatar}
                alt={name}
                data-ai-hint="person portrait"
              />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background shadow-lg",
                getStatusClasses(user.status)
              )}
            />
          </div>
        ) : (
          <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
            <Hash className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="truncate">
          <h2 className="text-lg font-bold text-foreground truncate">{name}</h2>
          {isDm && user?.customStatus && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {user.customStatus}
            </p>
          )}
        </div>
      </button>

      <div className="flex items-center gap-1">
        {isSearchVisible ? (
          <div className="relative">
            <Input
              placeholder="Search..."
              className="h-9 pr-8 w-36 sm:w-auto"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <button
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setIsSearchVisible(false)}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchVisible(true)}
            className="hidden sm:inline-flex"
          >
            <Search />
          </Button>
        )}
        <Button variant="ghost" size="icon">
          <Video />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Phone />
        </Button>
        <div className="hidden">
          <NotificationBell />
        </div>
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
              <Button variant="destructive" size="sm" onClick={onLeave}>
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
  const [mentionSearch, setMentionSearch] = useState("");
  const mentionTriggerIndexRef = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);

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
        audio.play().catch(() => {});
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

  useEffect(() => {
    setMessages(
      initialMessages.map((m) => ({
        ...m,
        // Safely handle populated senderId from backend (fix for updates)
        senderId:
          typeof m.senderId === "object" ? (m.senderId as any)._id : m.senderId,
        // Preserve populated sender data for fallback resolution
        _populatedSender:
          typeof m.senderId === "object"
            ? { ...(m.senderId as any), id: (m.senderId as any)._id }
            : undefined,
        pinned: activeChannel.pinnedMessageIds?.includes(m.id),
        // Normalize replyTo
        replyTo:
          typeof m.replyTo === "object" ? (m.replyTo as any)._id : m.replyTo,
      }))
    );
  }, [initialMessages, activeChannel]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
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

    const atIndex = textBeforeCursor.lastIndexOf("@");
    const spaceAfterAt = textBeforeCursor.indexOf(" ", atIndex);

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

    if (isImage || isVideo) {
      const reader = new FileReader();
      reader.onload = async () => {
        // Upload file first
        try {
          const uploadedFile = await api.uploadFile(file);
          const dataUri = uploadedFile.url; // Use the returned URL
          const mediaType = isImage ? "image" : "video";
          sendMessage(dataUri, mediaType);
        } catch (error) {
          toast({ title: "Upload failed", variant: "destructive" });
        }
      };
      reader.readAsDataURL(file);
    } else if (isExcel) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;

        const botTypingMessage: Message = {
          id: `msg-typing-${Date.now()}`,
          senderId: "nexus-ai",
          content: `Nexus AI is analyzing the file...`,
          timestamp: new Date().toISOString(),
          channelId: activeChannel.id,
          type: "bot",
        };
        setMessages((prev) => [...prev, botTypingMessage]);

        const result = await api.uploadExcel(dataUri);

        const content = result.message; // Adjusted to match api-client return

        const botMessage: Message = {
          id: `msg-bot-${Date.now()}`,
          senderId: "nexus-ai",
          content: content,
          timestamp: new Date().toISOString(),
          channelId: activeChannel.id,
          type: result.success ? "bot" : "text",
        };
        setMessages((prev) =>
          prev.filter((m) => m.id !== botTypingMessage.id).concat(botMessage)
        );
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a .xlsx, image, or video file.",
        variant: "destructive",
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
            type: "audio/webm",
          });
          const audioUrl = URL.createObjectURL(audioBlob);
          sendMessage(audioUrl, "voice");
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast({ title: "Recording started..." });
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast({ title: "Microphone access denied", variant: "destructive" });
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
    <div className="flex flex-col flex-1 h-full bg-background overflow-hidden">
      <ChatHeader
        channel={activeChannel}
        users={users}
        currentUser={currentUser}
        onHeaderClick={() => setIsProfileDialogOpen(true)}
        onViewPins={() => setIsPinsDialogOpen(true)}
        searchText={searchText}
        setSearchText={setSearchText}
      />

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-1">
          {filteredMessages.map((msg) => {
            // Robust Sender Resolution: Users List -> Current User -> Populated Data -> Nexus AI
            const sender =
              users.find((u) => u.id === msg.senderId) ||
              (String(msg.senderId) === String(currentUser.id)
                ? currentUser
                : null) ||
              (msg as any)._populatedSender ||
              USERS.find((u) => u.id === "nexus-ai")!;

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
                isDm={activeChannel.type === "dm"}
              />
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-4 relative z-20">
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none -z-10" />

        <div
          className={cn(
            "relative flex items-end gap-2 p-2 rounded-3xl bg-secondary/80 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300"
          )}
        >
          {/* File Uploads & Tools */}
          <div className="flex items-center gap-1 pb-1 pl-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            <Popover
              open={isMentionPopoverOpen}
              onOpenChange={setIsMentionPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors hidden sm:inline-flex"
                >
                  <Hash className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-0 bg-background/95 backdrop-blur-xl border-white/10"
                align="start"
              >
                <Command>
                  <CommandList>
                    <CommandGroup heading="Suggestions">
                      {filteredMentions.map((item: any) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => handleMentionSelect(item)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {item.type === "role" ? (
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <Hash className="h-4 w-4 text-primary" />
                            </div>
                          ) : (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={item.avatar} />
                              <AvatarFallback>
                                {item.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span>{item.name}</span>
                          {item.type === "role" && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              Role
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            {replyTo && (
              <div className="absolute bottom-full left-0 right-0 mb-3 p-3 bg-secondary/95 border border-primary/20 rounded-2xl flex items-center justify-between shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-3 text-xs text-muted-foreground truncate flex-1 min-w-0">
                  <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  <div className="flex-1 truncate">
                    <p className="font-bold text-primary mb-0.5">
                      Replying to{" "}
                      {users.find((u) => u.id === replyTo.senderId)?.name ||
                        "Someone"}
                    </p>
                    <p className="truncate opacity-80 italic">
                      "{replyTo.content}"
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-white/10"
                  onClick={() => setReplyTo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder={`Message #${activeChannel.name}...`}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 min-h-[44px] max-h-[120px] resize-none text-base placeholder:text-muted-foreground/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isMentionPopoverOpen) {
                  e.preventDefault();
                  sendMessage(inputValue);
                }
              }}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 pb-1 pr-1">
            {inputValue.length === 0 ? (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full transition-all",
                  isRecording
                    ? "bg-red-500/20 text-red-500 animate-pulse"
                    : "hover:bg-white/10 text-muted-foreground"
                )}
                onClick={handleVoiceMessage}
              >
                <Mic className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                onClick={() => sendMessage(inputValue)}
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ProfileDialog
        channel={activeChannel}
        users={users}
        currentUser={currentUser}
        isOpen={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        onViewProfile={handleViewProfile}
        onLeave={handleLeaveChannel}
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
