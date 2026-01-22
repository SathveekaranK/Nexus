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
  Flag,
  Pin,
  Check,
  CheckCheck,
  Reply,
  ShieldCheck,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input'; // Using Input for inline edit instead of Textarea for cleaner look
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { USERS } from '@/lib/data';
import { RoleBadges } from '../ui/role-badges'; // Assuming this exists or I should inline it if simple
import DOMPurify from 'isomorphic-dompurify';
import { format } from 'date-fns';

export interface MessageItemProps {
  message: Message;
  sender: User;
  currentUser: User; // Defined as User in types
  onUpdateMessage: (id: string, content: string) => void;
  onDeleteMessage: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onJumpToMessage: (id: string) => void;
  onTogglePin: (message: Message) => void;
  onViewProfile: (userId: string) => void;
  users: User[];
  allMessages: Message[];
  roles: any[];
  isDm: boolean;
  isSequence?: boolean;
}

// ReactionPill Component
const ReactionPill = ({ emoji, count, reacted, onClick }: { emoji: string; count: number; reacted: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all hover:scale-110 shadow-sm",
      reacted
        ? "bg-primary/20 border border-primary/50 text-primary"
        : "bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground"
    )}
    title={`${emoji} reaction (${count})`}
  >
    <span>{emoji}</span>
    <span className="font-semibold">{count}</span>
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
  onJumpToMessage,
  onTogglePin,
  onViewProfile,
  users,
  allMessages,
  roles,
  isDm,
  isSequence = false
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  // Fallback for sender
  const safeSender = sender || USERS.find((u) => u.id === 'nexus-ai') || { id: 'unknown', name: 'Unknown', avatar: '', status: 'offline', roles: [] };
  const isMe = String(safeSender.id) === String(currentUser.id);
  const isSystem = message.type === 'system';

  // 1. System Message Handling
  if (isSystem) {
    return (
      <div className="flex justify-center my-4 opacity-70">
        <span className="bg-white/5 backdrop-blur-md px-3 py-1 rounded-full text-xs text-muted-foreground flex items-center gap-2 border border-white/5 shadow-sm">
          <Sparkles className="h-3 w-3 text-primary" /> {message.content}
        </span>
      </div>
    );
  }

  // 2. Helper Functions
  const handleEditSave = () => {
    if (editContent.trim() !== message.content) {
      onUpdateMessage(message.id, editContent.trim());
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

  // 3. Render Content Helpers
  const renderMessageWithMentions = (text: string) => {
    // Simple mention rendering logic
    const tokens = text.split(/([ \t\n\r,.!?]+)/);
    return tokens.map((part, index) => {
      if (part.startsWith('@')) {
        return <span key={index} className="text-primary font-semibold hover:underline cursor-pointer">{part}</span>;
      }
      return part;
    });
  };

  const ImageAttachment = ({ src, alt }: { src: string; alt: string }) => {
    const [error, setError] = useState(false);
    return error ? (
      <div className="w-64 h-48 bg-secondary/50 rounded-xl flex flex-col items-center justify-center text-muted-foreground border border-white/5">
        <span className="text-xs">Image unavailable</span>
      </div>
    ) : (
      <div className="relative group overflow-hidden rounded-xl mt-1">
        <img
          src={src}
          className="max-w-sm w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
          alt={alt}
          loading="lazy"
          onError={() => setError(true)}
        />
      </div>
    );
  };

  const renderContent = () => {
    // Logic for different message types
    if (message.type === 'image') return <ImageAttachment src={message.content.startsWith('http') ? message.content : `${import.meta.env.VITE_API_URL}${message.content}`} alt="Attachment" />;
    if (message.type === 'file') {
      const fileName = message.content.split('/').pop() || 'File';
      const fileUrl = message.content.startsWith('http') ? message.content : `${import.meta.env.VITE_API_URL}${message.content}`;
      return (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10 group">
          <div className="p-2 bg-primary/10 rounded-md text-primary group-hover:scale-110 transition-transform"><LinkIcon className="h-4 w-4" /></div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate w-full">{fileName}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Click to open</p>
          </div>
        </a>
      );
    }
    if (message.type === 'bot') {
      return <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }} />
    }

    // Default Text
    return (
      <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px] font-normal tracking-wide">
        {renderMessageWithMentions(message.content)}
      </p>
    );
  };


  // 4. Premium Bubble Classes
  const bubbleClass = cn(
    "relative py-2.5 px-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all group/bubble",
    isMe
      ? "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white rounded-2xl rounded-tr-sm border border-white/10 shadow-lg shadow-primary/20"
      : "glass-card text-foreground rounded-2xl rounded-tl-sm hover:bg-white/10",
    isSequence && (isMe ? "rounded-tr-2xl mt-0.5" : "rounded-tl-2xl mt-0.5")
  );


  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "group flex w-full mb-1 hover:bg-white/[0.02] px-2 py-0.5 -mx-2 rounded-lg transition-colors relative",
        isMe ? "justify-end" : "justify-start",
        isSequence ? "mt-0.5" : "mt-3"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar (Left) */}
      {!isMe && (
        <div className={cn("flex flex-col justify-end mr-2", isSequence ? "invisible w-8" : "")}>
          <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm cursor-pointer hover:scale-105 transition-transform" onClick={() => onViewProfile(safeSender.id)}>
            <AvatarImage src={safeSender.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-xs">{safeSender.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className={cn("flex flex-col max-w-[85%] md:max-w-[75%]", isMe && "items-end")}>

        {/* Name (Top) */}
        {!isSequence && !isMe && (
          <div className="flex items-center gap-2 mb-1 ml-1 opacity-90">
            <span className="text-xs font-bold hover:underline cursor-pointer text-foreground hover:text-primary transition-colors" onClick={() => onViewProfile(safeSender.id)}>{safeSender.name}</span>
            {roles?.find(r => r.name === 'Admin') && <ShieldCheck className="h-3 w-3 text-primary" />}
            <span className="text-[10px] text-muted-foreground">{format(new Date(message.timestamp), 'h:mm a')}</span>
          </div>
        )}

        {/* The Bubble */}
        <div className={bubbleClass}>
          {/* Reply Context */}
          {message.replyTo && (
            <div
              className="mb-2 pl-3 border-l-2 border-white/30 text-xs opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
              onClick={() => onJumpToMessage(message.replyTo!)}
            >
              <div className="font-semibold flex items-center gap-1 mb-0.5">
                <Reply className="h-3 w-3" />
                Reply to message
              </div>
              <p className="truncate opacity-75">{allMessages.find(m => m.id === message.replyTo)?.content || '...'}</p>
            </div>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="bg-black/20 border-white/10 text-white placeholder:text-white/40 h-8 text-sm focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-white/30"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-white/10 text-white/70 rounded-full" onClick={() => setIsEditing(false)}><span className="sr-only">Cancel</span>X</Button>
                <Button size="icon" className="h-6 w-6 bg-white/20 hover:bg-white/30 text-white rounded-full" onClick={handleEditSave}><span className="sr-only">Save</span><Check className="h-3 w-3" /></Button>
              </div>
            </div>
          ) : (
            renderContent()
          )}

          {/* Timestamp & Status (Within Bubble for Me) */}
          {isMe && (
            <div className="text-[9px] mt-1 flex items-center justify-end gap-1 opacity-70 text-white">
              <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
              {message.readBy && message.readBy.length > 0 ? <CheckCheck className="h-3 w-3 text-blue-200" /> : <Check className="h-3 w-3" />}
            </div>
          )}
        </div>

        {/* Outside Timestamp for Others (if sequence last) */}
        {!isMe && !isSequence && (
          <div className="hidden"></div>
        )}

        {/* Reactions */}
        {aggregatedReactions.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isMe ? "justify-end" : "justify-start ml-1")}>
            {aggregatedReactions.map(r => (
              <ReactionPill key={r.emoji} {...r} onClick={() => onReact(message.id, r.emoji)} />
            ))}
          </div>
        )}
      </div>

      {/* Actions Menu (Floating) */}
      <div className={cn(
        "opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-0.5 ml-2 self-center bg-black/40 backdrop-blur-md rounded-full p-0.5 border border-white/5 shadow-lg translate-y-2 group-hover:translate-y-0",
        isMe ? "order-first mr-2 ml-0" : ""
      )}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white/10 hover:text-primary transition-colors text-muted-foreground"><Smile className="h-4 w-4" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1.5 border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl rounded-xl">
            <div className="flex gap-1">
              {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'].map(emoji => (
                <button key={emoji} onClick={() => onReact(message.id, emoji)} className="p-1.5 hover:bg-white/20 rounded-lg text-lg transition-transform hover:scale-110">{emoji}</button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white/10 hover:text-primary transition-colors text-muted-foreground" onClick={() => onReply(message)}><Reply className="h-4 w-4" /></Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white/10 hover:text-primary transition-colors text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isMe ? "end" : "start"} className="bg-black/90 backdrop-blur-xl border-white/10 rounded-xl shadow-xl">
            {!isDm && <DropdownMenuItem onClick={() => onTogglePin(message)} className="focus:bg-white/5 cursor-pointer"><Pin className="mr-2 h-4 w-4" /> {message.pinned ? 'Unpin' : 'Pin'}</DropdownMenuItem>}
            {isMe && (
              <>
                <DropdownMenuItem onClick={() => setIsEditing(true)} className="focus:bg-white/5 cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => onDeleteMessage(message.id)} className="text-destructive focus:bg-destructive/10 cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </>
            )}
            {!isMe && <DropdownMenuItem className="text-destructive focus:bg-destructive/10 cursor-pointer"><Flag className="mr-2 h-4 w-4" /> Report</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </motion.div>
  );
}
