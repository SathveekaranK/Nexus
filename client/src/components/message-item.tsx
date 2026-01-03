
'use client';

import type { Message, User } from '@/lib/types';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
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
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
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
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  if (!sender) {
    sender = USERS.find((u) => u.id === 'nexus-ai')!;
  }

  const isBot = sender.id === 'nexus-ai';
  const isOwnMessage = sender.id === currentUser.id;
  const isDm = message.channelId.startsWith('dm-');


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
          <audio
            controls
            src={message.content}
            className="w-full max-w-sm filter-v2"
          />
        );
      case 'video':
        return (
          <video
            controls
            src={message.content}
            className="rounded-lg max-w-sm"
          />
        );
      case 'image':
        return (
          <img
            src={message.content}
            className="rounded-lg max-w-sm"
            alt="Uploaded image"
          />
        );
      case 'bot':
      case 'file':
        return (
          <div
            className="prose prose-sm dark:prose-invert max-w-none [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:p-2 [&_th]:bg-muted [&_td]:border [&_td]:p-2"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />
        );
      case 'text':
      default:
        return (
          <p className="text-foreground/90 whitespace-pre-wrap">
            {renderMessageWithMentions(message.content)}
          </p>
        );
    }
  };

  return (
    <motion.div
      layout
      id={`message-${message.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-start gap-3 group relative p-2 rounded-md',
        isHovered && 'bg-muted/50',
        message.pinned && 'bg-primary/5'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button onClick={() => onViewProfile(sender)} className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={sender.avatarUrl}
            alt={sender.name}
            data-ai-hint={isBot ? 'robot bot' : 'person portrait'}
          />
          <AvatarFallback>
            {isBot ? <Bot className="h-5 w-5" /> : sender.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {!isBot && <div className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background", getStatusClasses(sender.status))} />}
      </button>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <p
            className={cn('font-bold text-foreground', isBot && 'text-primary')}
          >
            {sender.name}
          </p>
          <p className="text-xs text-muted-foreground">{message.timestamp}</p>
          {message.edited && (
            <p className="text-xs text-muted-foreground">(edited)</p>
          )}
        </div>

        {repliedToMessage && repliedToSender && (
          <div className="text-xs text-muted-foreground pl-2 border-l-2 border-border mb-1 rounded">
            <div className="bg-background/20 p-1">
              Replying to{' '}
              <span className="font-semibold text-foreground">
                {repliedToSender.name}
              </span>
              : {repliedToMessage.content.length > 50 ? `${repliedToMessage.content.substring(0, 50)}...` : repliedToMessage.content}
            </div>
          </div>
        )}

        {isEditing ? (
          <div>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="my-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSave();
                }
                if (e.key === 'Escape') {
                  setIsEditing(false);
                }
              }}
            />
            <div className="flex gap-2 mt-1">
              <Button size="sm" onClick={handleEditSave}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          renderContent()
        )}
        
        {message.pinned && (
          <div className="flex items-center gap-1 text-xs text-yellow-500 mt-1">
            <Pin className="h-3 w-3"/>
            <span>Pinned</span>
          </div>
        )}


        {aggregatedReactions.length > 0 && (
          <div className="flex gap-1 mt-2">
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

      <div
        className={cn(
          'absolute -top-4 right-2 bg-secondary border rounded-lg shadow-sm flex items-center z-10 transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0">
            <div className="grid grid-cols-8 gap-1 p-2">
              {[
                '😀', '😂', '😍', '🤔', '👍', '🙏', '🎉', '❤️',
              ].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className="text-xl rounded-md hover:bg-muted p-1 transition-colors"
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
          className="h-8 w-8"
          onClick={() => onReply(message)}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        {isOwnMessage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {!isDm && (
              <DropdownMenuItem onClick={() => onTogglePin(message)}>
                <Pin className="mr-2 h-4 w-4" />
                <span>{message.pinned ? 'Unpin Message' : 'Pin Message'}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <LinkIcon className="mr-2 h-4 w-4" />
              <span>Copy Link</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isOwnMessage ? (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeleteMessage(message.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Message</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-destructive">
                <Flag className="mr-2 h-4 w-4" />
                <span>Report Message</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
