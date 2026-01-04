// @ts-nocheck
'use client';

import type { Message, User } from '@/lib/types';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { motion } from 'framer-motion';
import {
  Bot,
  MoreHorizontal,
  Smile,
  MessageSquare,
  Edit,
  Trash2,
  Bookmark,
  Link as LinkIcon,
  Flag,
  Pin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { USERS } from '@/lib/data';

const getStatusClasses = (status: User['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-gray-400 border-background';
    case 'away': return 'bg-yellow-500';
    case 'dnd': return 'bg-red-500';
  }
}

interface MessageItemProps {
  message: Message;
  sender: User;
  currentUser: User;
  onUpdateMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onTogglePin: (message: Message) => void;
  onViewProfile: (user: User) => void;
  users: User[];
  allMessages: Message[];
  isDm?: boolean;
}

const ReactionPill = ({
  emoji,
  count,
  reacted,
  onClick,
}: {
  emoji: string;
  count: number;
  reacted: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'px-2 py-0.5 border rounded-full text-sm flex items-center gap-1 transition-colors',
      reacted
        ? 'bg-primary/20 border-primary'
        : 'bg-muted border-muted-foreground/20 hover:bg-muted/80'
    )}
  >
    <span>{emoji}</span>
    <span>{count}</span>
  </button>
);

export default function MessageItem({
  message,
  sender,
  currentUser,
  onUpdateMessage,
  onDeleteMessage,
  onReact,
  onReply,
  onTogglePin,
  onViewProfile,
  users,
  allMessages,
  isDm: propsIsDm,
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  if (!sender) {
    sender = USERS.find((u) => u.id === 'nexus-ai')!;
  }

  const isBot = sender.id === 'nexus-ai';
  const isOwnMessage = sender.id === currentUser.id;
  // Use prop if available, otherwise calculate
  const isDm = propsIsDm ?? (!!message.recipientId || (message.channelId && message.channelId.startsWith('dm-')));


  const handleEditSave = () => {
    if (editedContent.trim() !== message.content) {
      onUpdateMessage(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const getAggregatedReactions = () => {
    if (!message.reactions) return [];
    const reactionMap = new Map<string, string[]>();
    message.reactions.forEach((r) => {
      if (!reactionMap.has(r.emoji)) {
        reactionMap.set(r.emoji, []);
      }
      reactionMap.get(r.emoji)!.push(r.userId);
    });
    return Array.from(reactionMap.entries()).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      reacted: userIds.includes(currentUser.id),
    }));
  };

  const aggregatedReactions = getAggregatedReactions();

  const repliedToMessage = message.replyTo
    ? allMessages.find((m) => m.id === message.replyTo)
    : null;
  const repliedToSender = repliedToMessage
    ? users.find((u) => u.id === repliedToMessage.senderId)
    : null;

  const renderMessageWithMentions = (text: string) => {
    const mentionableUsers = users.filter(u => u.id !== 'nexus-ai');
    const mentionRegex = new RegExp(`@(${mentionableUsers.map(u => u.name).join('|')})`, 'g');
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
      const mentionedUser = mentionableUsers.find(u => u.name === part);
      if (mentionedUser) {
        const isCurrentUserMention = mentionedUser.id === currentUser.id;
        return (
          <span key={index} className={cn("font-semibold rounded px-1 cursor-pointer", isCurrentUserMention ? "bg-yellow-400/50 text-yellow-900" : "bg-primary/20 text-primary-foreground/80 hover:bg-primary/30")}>
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const renderContent = () => {
    switch (message.type) {
      case 'voice':
        return (
          <div className="min-w-[200px]">
            <audio controls src={message.content} className="w-full filter-v2 opacity-90" />
          </div>
        );
      case 'video':
        return (
          <video controls src={message.content} className="rounded-lg max-w-sm w-full" />
        );
      case 'image':
        return (
          <img src={message.content} className="rounded-lg max-w-sm w-full" alt="Attachment" />
        );
      case 'bot':
      case 'file':
        return (
          <div
            className="prose prose-sm dark:prose-invert max-w-none [&_table]:w-full"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />
        );
      case 'text':
      default:
        return (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {renderMessageWithMentions(message.content)}
          </p>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group flex items-end gap-2 mb-4 w-full',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar - Show for all messages in groups, hidden in DMs for cleaner look */}
      {(!isDm || !isOwnMessage) && (
        <button onClick={() => onViewProfile(sender)}>
          <Avatar className="h-8 w-8 mb-1 ring-2 ring-background">
            <AvatarImage src={sender.avatar} />
            <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </button>
      )}

      <div className={cn("flex flex-col max-w-[75%] md:max-w-[60%]", isOwnMessage ? "items-end" : "items-start")}>
        {/* Sender Name (Only for others in group chats) */}
        {!isOwnMessage && !isDm && (
          <span className="text-[10px] text-muted-foreground ml-1 mb-1">{sender.name}</span>
        )}

        <div
          className={cn(
            "relative text-sm py-2 px-3 shadow-sm",
            isOwnMessage
              ? "bg-gradient-to-br from-primary to-violet-700 text-white rounded-2xl rounded-tr-sm"
              : "bg-secondary/40 backdrop-blur-md border border-white/5 text-foreground rounded-2xl rounded-tl-sm"
          )}
        >
          {/* Reply Context */}
          {repliedToMessage && repliedToSender && (
            <div className={cn(
              "mb-2 text-xs border-l-2 pl-2 rounded py-1",
              isOwnMessage ? "border-white/30 bg-white/10 text-white/80" : "border-primary/30 bg-primary/5 text-muted-foreground"
            )}>
              <span className="font-bold">{repliedToSender.name}</span>: {repliedToMessage.content.substring(0, 30)}...
            </div>
          )}

          {isEditing ? (
            <div className="min-w-[200px]">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="bg-transparent border-white/20 text-inherit min-h-[60px]"
              />
              <div className="flex gap-2 mt-2 justify-end">
                <Button size="sm" variant="secondary" className="h-6 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" className="h-6 text-xs bg-white text-primary hover:bg-white/90" onClick={handleEditSave}>Save</Button>
              </div>
            </div>
          ) : (
            renderContent()
          )}

          {/* Timestamp & Meta */}
          <div className={cn(
            "flex items-center gap-1 text-[10px] mt-1 opacity-70",
            isOwnMessage ? "justify-end text-white/70" : "justify-start text-muted-foreground"
          )}>
            <span>{message.timestamp}</span>
            {message.edited && <span>(edited)</span>}
            {message.pinned && <Pin className="h-3 w-3" />}
          </div>
        </div>

        {/* Reactions */}
        {aggregatedReactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {aggregatedReactions.map((r) => (
              <ReactionPill
                key={r.emoji}
                emoji={r.emoji}
                count={r.count}
                reacted={r.reacted}
                onClick={() => onReact(message.id, r.emoji)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hover Actions (Floating) */}
      <div className={cn(
        "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-2",
        isOwnMessage ? "mr-2 flex-row-reverse" : "ml-2"
      )}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 hover:bg-background border shadow-sm">
              <Smile className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1 border-0 bg-background/80 backdrop-blur-xl shadow-xl rounded-xl">
            <div className="flex gap-1">
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                <button key={emoji} onClick={() => onReact(message.id, emoji)} className="p-2 hover:bg-white/10 rounded-lg text-xl transition-transform hover:scale-110">{emoji}</button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 hover:bg-background border shadow-sm" onClick={() => onReply(message)}>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 hover:bg-background border shadow-sm">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {!isDm && <DropdownMenuItem onClick={() => onTogglePin(message)}><Pin className="mr-2 h-4 w-4" /> {message.pinned ? 'Unpin' : 'Pin'}</DropdownMenuItem>}
            {isOwnMessage && <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
            {isOwnMessage && <DropdownMenuItem onClick={() => onDeleteMessage(message.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </motion.div>
  );
}
