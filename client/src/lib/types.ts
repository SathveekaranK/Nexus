
export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'away' | 'dnd';
  customStatus?: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  channelId: string;
  type: 'text' | 'image' | 'file' | 'bot' | 'voice' | 'video';
  reactions?: Reaction[];
  replyTo?: string;
  edited?: boolean;
  pinned?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  memberIds?: string[];
  description?: string;
  pinnedMessageIds?: string[];
}

export interface CalendarEvent {
  id: number | string;
  date: Date;
  title: string;
  time: string;
  duration: string;
  type: 'meeting' | 'event' | 'planning';
  participants?: string[];
  meetingUrl?: string;
  creatorId: string;
}

export interface Song {
  title: string;
  artist: string;
  album: string;
  year: number;
  coverArtUrl: string;
  duration: string;
}

export interface MusicRoom {
  id: string;
  name: string;
  participants: User[];
  playlist: Song[];
  nowPlayingIndex: number;
  messages: Message[];
}

export interface ActivityItem {
  id: string;
  type: 'message' | 'mention' | 'reply';
  fromUserId: string;
  channelId: string;
  messageId: string;
  timestamp: string;
  contentPreview: string;
  isRead: boolean;
}
