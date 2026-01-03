
import type { User, Channel, Message, MusicRoom, Song, CalendarEvent } from './types';

export const USERS: User[] = [
  { id: 'user-1', name: 'Alice', avatarUrl: 'https://picsum.photos/seed/101/40/40', status: 'online', customStatus: 'Developing new features ✨' },
  { id: 'user-2', name: 'Bob', avatarUrl: 'https://picsum.photos/seed/102/40/40', status: 'offline' },
  { id: 'user-3', name: 'Charlie', avatarUrl: 'https://picsum.photos/seed/103/40/40', status: 'away', customStatus: 'On a lunch break' },
  { id: 'user-4', name: 'David', avatarUrl: 'https://picsum.photos/seed/104/40/40', status: 'dnd', customStatus: 'In a meeting' },
  { id: 'user-5', name: 'Eve', avatarUrl: 'https://picsum.photos/seed/105/40/40', status: 'online' },
  { id: 'nexus-ai', name: 'Nexus AI', avatarUrl: 'https://picsum.photos/seed/999/40/40', status: 'online', customStatus: 'Ready to assist!' },
];

export const CURRENT_USER_ID = 'user-1';

export const CHANNELS: Channel[] = [
  // Channels
  { id: 'chan-1', name: 'general', type: 'channel', memberIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'], description: 'A channel for general announcements and discussions.', pinnedMessageIds: ['msg-1'] },
  { id: 'chan-2', name: 'frontend', type: 'channel', memberIds: ['user-1', 'user-4', 'user-5'], description: 'All things related to our frontend stack.', pinnedMessageIds: [] },
  { id: 'chan-3', name: 'backend', type: 'channel', memberIds: ['user-1', 'user-2', 'user-3'], description: 'Discussion about servers, APIs, and databases.', pinnedMessageIds: [] },
  { id: 'chan-4', name: 'design', type: 'channel', memberIds: ['user-1', 'user-3'], description: 'Share design mockups and feedback.', pinnedMessageIds: [] },
  
  // Direct Messages
  { id: 'dm-1', name: 'Bob', type: 'dm', memberIds: ['user-1', 'user-2'] },
  { id: 'dm-2', name: 'Charlie', type: 'dm', memberIds: ['user-1', 'user-3'] },
  { id: 'dm-3', name: 'David', type: 'dm', memberIds: ['user-1', 'user-4'] },
  { id: 'dm-4', name: 'Eve', type: 'dm', memberIds: ['user-1', 'user-5'] },
];

export const MESSAGES: Message[] = [
  { id: 'msg-1', senderId: 'user-2', content: 'Hey everyone, check out the new mockups.', timestamp: '10:30 AM', channelId: 'chan-1', type: 'text', pinned: true },
  { id: 'msg-2', senderId: 'user-3', content: 'Looking good! I have a few suggestions.', timestamp: '10:31 AM', channelId: 'chan-1', type: 'text' },
  { id: 'msg-3', senderId: 'user-1', content: 'Can we sync up later today?', timestamp: '10:32 AM', channelId: 'chan-1', type: 'text' },
  { id: 'msg-4', senderId: 'user-4', content: 'Hey Alice, the new Tailwind config is pushed.', timestamp: '11:00 AM', channelId: 'chan-2', type: 'text' },
  { id: 'msg-5', senderId: 'user-5', content: 'Awesome, I\'ll pull it now.', timestamp: '11:01 AM', channelId: 'chan-2', type: 'text' },
  { id: 'msg-6', senderId: 'user-1', content: 'How is the API integration going?', timestamp: '12:00 PM', channelId: 'chan-3', type: 'text' },
  { id: 'msg-7', senderId: 'nexus-ai', content: 'I can help with that. What do you need to know?', timestamp: '12:01 PM', channelId: 'chan-3', type: 'bot' },
  { id: 'msg-8', senderId: 'user-1', content: 'Hi Bob, do you have the latest report?', timestamp: '9:00 AM', channelId: 'dm-1', type: 'text' },
  { id: 'msg-9', senderId: 'user-2', content: 'Yep, sending it over now.', timestamp: '9:01 AM', channelId: 'dm-1', type: 'text' },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 1, date: new Date(2024, 6, 25), title: 'Project Phoenix Sync', time: '10:00 AM', duration: '1h', type: 'meeting', participants: ['user-1', 'user-2', 'user-3'], meetingUrl: 'https://meet.google.com/abc-def-ghi', creatorId: 'user-2' },
  { id: 2, date: new Date(2024, 6, 25), title: 'Marketing Q3 Kickoff', time: '2:00 PM', duration: '45m', type: 'meeting', participants: ['user-1', 'user-4', 'user-5'], creatorId: 'user-4' },
  { id: 3, date: new Date(2024, 6, 26), title: 'Frontend Team Retro', time: '11:00 AM', duration: '1h 30m', type: 'event', participants: ['user-1', 'user-4', 'user-5'], creatorId: 'user-1' },
  { id: 4, date: new Date(2024, 7, 1), title: 'New Sprint Planning', time: '9:00 AM', duration: '2h', type: 'planning', participants: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'], meetingUrl: 'https://meet.google.com/jkl-mno-pqr', creatorId: 'user-1' },
  { id: 5, date: new Date(2024, 6, 20), title: 'Design Review', time: '3:00 PM', duration: '1h', type: 'meeting', participants: ['user-1', 'user-3'], meetingUrl: 'https://meet.google.com/stu-vwx-yz', creatorId: 'user-3' },
];


const placeholderSongs: Song[] = [
    { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', year: 2020, coverArtUrl: 'https://picsum.photos/seed/301/300/300', duration: '3:20'},
    { title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', year: 2022, coverArtUrl: 'https://picsum.photos/seed/302/300/300', duration: '2:47'},
    { title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', year: 2020, coverArtUrl: 'https://picsum.photos/seed/303/300/300', duration: '3:23' },
    { title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR', year: 2021, coverArtUrl: 'https://picsum.photos/seed/304/300/300', duration: '2:58'},
    { title: 'Peaches', artist: 'Justin Bieber', album: 'Justice', year: 2021, coverArtUrl: 'https://picsum.photos/seed/305/300/300', duration: '3:18'},
]

export const MUSIC_ROOMS: MusicRoom[] = [
    {
        id: 'room-1',
        name: 'Chill Lo-fi Beats',
        participants: [USERS[0], USERS[2], USERS[4]],
        playlist: placeholderSongs.slice(0, 3),
        nowPlayingIndex: 0,
        messages: [
            { id: 'music-msg-1', senderId: 'user-3', content: 'This song is a classic!', timestamp: '10:30 PM', channelId: 'room-1', type: 'text'},
            { id: 'music-msg-2', senderId: 'user-5', content: 'Agreed! 🔥', timestamp: '10:31 PM', channelId: 'room-1', type: 'text'}
        ]
    },
    {
        id: 'room-2',
        name: 'Indie Hits',
        participants: [USERS[1], USERS[3]],
        playlist: placeholderSongs.slice(2, 5),
        nowPlayingIndex: 1,
        messages: []
    }
];
