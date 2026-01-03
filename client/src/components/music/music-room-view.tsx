"use client";

import type { MusicRoom, User, Message, Song } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import {
  Music,
  Users,
  Send,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Mic,
  Headphones,
  Settings,
  LogOut,
  Music2,
  Menu
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import MessageItem from '../message-item';
import { USERS } from '@/lib/data';
import UserProfileDialog from '../user-profile-dialog';
import { useToast } from '@/hooks/use-toast';
import AddMusicDialog from './add-music-dialog';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { cn } from '@/lib/utils';

const getStatusClasses = (status: User['status']) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'offline': return 'bg-gray-400 border-background';
    case 'away': return 'bg-yellow-500';
    case 'dnd': return 'bg-red-500';
  }
}

const MusicPlayer = ({ room, nowPlaying, setNowPlaying }: { room: MusicRoom; nowPlaying: Song; setNowPlaying: (song: Song) => void; }) => {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="bg-secondary rounded-lg p-4 flex flex-col">
      <div className="flex items-start gap-4">
        <img
          src={nowPlaying.coverArtUrl}
          alt={`Cover for ${nowPlaying.album}`}
          width={100}
          height={100}
          className="rounded-md w-16 h-16 sm:w-24 sm:h-24"
        />
        <div className="flex-1">
          <h3 className="text-lg font-bold truncate">{nowPlaying.title}</h3>
          <p className="text-muted-foreground text-sm sm:text-base">{nowPlaying.artist}</p>
          <p className="text-sm text-muted-foreground/80 hidden sm:block">{nowPlaying.album}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Slider defaultValue={[33]} max={100} step={1} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1:10</span>
          <span>{nowPlaying.duration}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2">
        <Button variant="ghost" size="icon"><SkipBack /></Button>
        <Button size="icon" className="h-12 w-12" onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        <Button variant="ghost" size="icon"><SkipForward /></Button>
      </div>
    </div>
  );
};

const VoiceChannelControls = () => {
  const { toast } = useToast();
  return (
    <div className="bg-secondary/50 p-2 flex items-center justify-between">
      <div className='flex items-center gap-2'>
        <Volume2 className="h-5 w-5 text-green-500" />
        <p className="text-sm font-semibold text-foreground">Voice Connected</p>
      </div>
      <div className='flex items-center'>
        <Button variant="ghost" size="icon" onClick={() => toast({ title: "Toggled Mic (Not Implemented)" })}><Mic className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" onClick={() => toast({ title: "Toggled Headphones (Not Implemented)" })}><Headphones className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" onClick={() => toast({ title: "Opened Settings (Not Implemented)" })}><Settings className="h-5 w-5" /></Button>
      </div>
    </div>
  )
};


const RoomChat = ({ initialMessages, currentUser }: { initialMessages: Message[], currentUser: User }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content: inputValue,
      timestamp: format(new Date(), 'p'),
      channelId: 'music-room-chat',
      type: 'text'
    }
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
  }

  return (
    <div className="flex-1 flex flex-col bg-background/70 backdrop-blur-sm">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-1">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              sender={USERS.find((u) => u.id === msg.senderId)!}
              currentUser={currentUser}
              onUpdateMessage={() => { }}
              onDeleteMessage={() => { }}
              onReact={() => { }}
              onReply={() => { }}
              onTogglePin={() => { }}
              onViewProfile={(user) => setViewedUser(user)}
              users={USERS}
              allMessages={messages}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="p-4">
        <div className="relative">
          <Input
            placeholder="Message in room..."
            className="pr-12 bg-secondary"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button size="icon" onClick={sendMessage} disabled={!inputValue.trim()}>
              <Send />
            </Button>
          </div>
        </div>
      </div>
      {viewedUser && (
        <UserProfileDialog
          user={viewedUser}
          isOpen={!!viewedUser}
          onOpenChange={() => setViewedUser(null)}
        />
      )}
    </div>
  )
}

const ParticipantsList = ({ participants }: { participants: User[] }) => (
  <div className="w-64 bg-secondary/50 p-4 space-y-4">
    <h3 className="font-bold flex items-center gap-2"><Users className="h-5 w-5" /> In the Room ({participants.length})</h3>
    <ScrollArea className="flex-1">
      <div className="space-y-3">
        {participants.map(user => (
          <div key={user.id} className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-secondary", getStatusClasses(user.status))} />
            </div>
            <span className="font-medium text-sm truncate">{user.name}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  </div>
);

export default function MusicRoomView({ room, currentUser }: { room: MusicRoom; currentUser: User; }) {
  const navigate = useNavigate();
  const [nowPlaying, setNowPlaying] = useState(room.playlist[room.nowPlayingIndex]);
  const [playlist, setPlaylist] = useState<Song[]>(room.playlist);
  const [isAddMusicOpen, setIsAddMusicOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const handleExitRoom = () => {
    navigate('/music');
  };

  const handleSongAdded = (songTitle: string) => {
    // This is a placeholder. In a real app, you'd fetch song details from Spotify API
    const newSong: Song = {
      title: songTitle.split('by')[0]?.trim() || "New Song",
      artist: songTitle.split('by')[1]?.trim() || "Unknown Artist",
      album: "Single",
      year: new Date().getFullYear(),
      coverArtUrl: `https://picsum.photos/seed/${Math.random()}/300/300`,
      duration: '3:00'
    };
    setPlaylist(prev => [...prev, newSong]);
  };

  const SidebarContent = () => (
    <ParticipantsList participants={room.participants} />
  )

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="flex items-center justify-between p-3 border-b border-border shadow-sm bg-secondary h-16 md:h-auto">
        <div className="flex items-center gap-3 truncate">
          <div className="p-2 bg-muted rounded-full">
            <Music className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground truncate">{room.name}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsAddMusicOpen(true)}>
            <Music2 />
          </Button>
          <div className="md:hidden">
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Users />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-[280px]">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
          <Button variant="ghost" size="icon" onClick={handleExitRoom} className="text-destructive hover:text-destructive-foreground hover:bg-destructive">
            <LogOut />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-4">
            <MusicPlayer room={room} nowPlaying={nowPlaying} setNowPlaying={setNowPlaying} />
          </div>
          <VoiceChannelControls />
          <RoomChat initialMessages={room.messages} currentUser={currentUser} />
        </div>

        {/* Right Sidebar */}
        <div className={cn("hidden md:block")}>
          <SidebarContent />
        </div>
      </div>

      <AddMusicDialog
        isOpen={isAddMusicOpen}
        onOpenChange={setIsAddMusicOpen}
        onSongAdded={handleSongAdded}
      />
    </div>
  );
}
