// @ts-nocheck
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Channel as ChannelType, User } from '@/lib/types';
import WorkspaceSwitcher from './workspace-switcher';
import ChannelList from '../channel/channel-list';
import NewChannelDialog from '../channel/new-channel-dialog';
import { Link, useLocation } from 'react-router-dom';
import MobileNav from './mobile-nav';
import BottomNav from './bottom-nav';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '@/services/notification/notificationSlice';
import { Separator } from '../ui/separator';
import { RootState } from '@/store/store';

interface MainLayoutProps {
  children: React.ReactNode;
  allChannels: ChannelType[];
  currentUser: User;
  users: User[];
}

export default function MainLayout({
  children,
  allChannels: initialChannels,
  currentUser,
  users,
}: MainLayoutProps) {
  const [isNewChannelDialogOpen, setIsNewChannelDialogOpen] = useState(false);
  const [allChannels, setAllChannels] =
    useState<ChannelType[]>(initialChannels);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setAllChannels(initialChannels);
  }, [initialChannels]);

  const location = useLocation();
  const pathname = location.pathname;

  const getActiveViewType = () => {
    if (pathname.startsWith('/dms')) return 'dms';
    if (pathname.startsWith('/channels')) return 'channels';
    if (pathname.startsWith('/ai-chat')) return 'ai-chat';
    if (pathname.startsWith('/music')) return 'music';
    if (pathname.startsWith('/calendar')) return 'calendar';
    if (pathname.startsWith('/resources')) return 'resources';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/notifications')) return 'notifications';
    return 'dms'; // Default
  };

  const activeViewType = getActiveViewType();
  const activeChannelId = pathname.split('/').pop();

  // Reset active channel if invalid or not found (unless creating new)
  useEffect(() => {
    if (allChannels.length > 0 &&
      activeViewType === 'channels' &&
      !allChannels.find(c => c.id === activeChannelId) &&
      activeChannelId !== 'new') {
      // Optionally redirect to first channel if current is invalid
      // router.push(`/channels/${allChannels[0].id}`);
    }
  }, [allChannels, activeChannelId, activeViewType]);

  const dispatch = useDispatch();

  // Socket Notification & Message Listener
  useEffect(() => {
    // 1. Room/Notification Manager
    import('../room/room-manager').then(({ getSocket }) => {
      const socket = getSocket();
      if (socket) {
        const handleNotification = (data: any) => {
          dispatch(addNotification(data));
        };
        socket.on('notification', handleNotification);
        return () => {
          socket.off('notification', handleNotification);
        };
      }
    });

    // 2. Chat Socket (Global Listener for Unread/Sorting)
    // We need to ensure we are connected to chat socket globally if possible, 
    // or just rely on the fact that if we are logged in, we should be listening.
    // Ideally duplicate listeners are fine as long as we handle state correctly.

    // Lazy import to avoid circular dep issues if any
    import('@/services/chat/chat-socket').then(({ onNewMessage, connectChatSocket }) => {
      // Ensure connection
      if (currentUser?.id) {
        // We might need token here, but let's assume it's handled or we can get it from state if needed.
        // actually MainLayout doesn't have token prop. 
        // But ChatView does. 
        // Let's assume the socket is persistent SINGLETON.
      }

      const unsubscribe = onNewMessage((message: any) => {
        // Dispatch to channelSlice
        // Determine channel ID:
        // If it's a channel message: message.channelId
        // If it's a DM: we need to find the DM "channel ID" (which is usually the other user's ID or our ID)
        // But wait, our 'filteredDMs' use UserID as ID. 

        let targetChannelId = message.channelId;

        if (!targetChannelId && message.recipientId) {
          // Helper to safely get string ID
          const getStrId = (id: any) => {
            if (typeof id === 'string') return id;
            if (id?._id) return id._id.toString();
            return id?.toString() || '';
          };

          const myId = currentUser.id;
          const senderIdStr = getStrId(message.senderId);
          const recipientIdStr = getStrId(message.recipientId);

          if (senderIdStr === myId) {
            targetChannelId = recipientIdStr;
          } else {
            targetChannelId = senderIdStr;
          }
        }

        import('@/services/channel/channelSlice').then(({ handleNewMessage }) => {
          const getStrId = (id: any) => typeof id === 'string' ? id : (id?._id?.toString() || id?.toString());

          const finalChannelId = getStrId(targetChannelId);

          dispatch(handleNewMessage({
            channelId: finalChannelId,
            senderId: getStrId(message.senderId),
            timestamp: message.createdAt || new Date().toISOString(),
            currentUserId: currentUser.id,
            activeChannelId
          }));
        });
      });

      return () => unsubscribe();
    });

  }, [dispatch, currentUser.id, activeChannelId]);

  // Mark active channel as read when switching
  useEffect(() => {
    if (activeChannelId) {
      import('@/services/channel/channelSlice').then(({ markChannelRead, markChannelReadLocal }) => {
        // Optimistic instant update
        dispatch(markChannelReadLocal(activeChannelId));
        // API call
        dispatch(markChannelRead(activeChannelId) as any);
      });
    }
  }, [activeChannelId, dispatch]);

  const handleSaveChannel = (channelName: string) => {
    // Channel creation handled via Redux in dialog
  };

  const { lastActivity } = useSelector((state: RootState) => state.channels);

  const { filteredDMs, filteredChannels } = useMemo(() => {
    // Show ALL users as DMs options, INCLUDING current user (for self-messaging)
    const dms: ChannelType[] = users
      .map((u) => ({
        id: u.id, // Using User ID as the "Channel ID" for now for DMs
        name: u.id === currentUser.id ? `${u.name} (you)` : u.name,
        type: 'dm',
        memberIds: [currentUser.id, u.id],
        sortTime: lastActivity[u.id] || (u as any).sortTime || (u as any).createdAt,
        lastMessage: (u as any).lastMessage // Pass preview data
      }));

    const channels = allChannels.filter((c) => c.type === 'channel')
      .map(c => ({
        ...c,
        sortTime: lastActivity[c.id] || c.lastMessageAt || c.createdAt
      }));

    // SORT FUNC
    const sortByTime = (a: any, b: any) => {
      const timeA = new Date(a.sortTime || 0).getTime();
      const timeB = new Date(b.sortTime || 0).getTime();
      return timeB - timeA;
    };

    let sortedDMs = dms.sort(sortByTime);
    let sortedChannels = channels.sort(sortByTime);

    if (!searchTerm) {
      return { filteredDMs: sortedDMs, filteredChannels: sortedChannels };
    }

    const lowercasedSearch = searchTerm.toLowerCase();

    sortedDMs = sortedDMs.filter((c) => {
      // For our virtual DMs, the name IS the user name
      return c.name.toLowerCase().includes(lowercasedSearch);
    });

    sortedChannels = sortedChannels.filter((c) =>
      c.name.toLowerCase().includes(lowercasedSearch)
    );

    return { filteredDMs: sortedDMs, filteredChannels: sortedChannels };
  }, [allChannels, users, searchTerm, currentUser.id, lastActivity]);

  const renderChannelList = (isMobile: boolean = false) => {
    const props = {
      users: users,
      currentUser: currentUser,
      searchTerm: searchTerm,
      onSearchTermChange: setSearchTerm,
    };

    if (activeViewType === 'dms') {
      const activeChannel = filteredDMs.find((c) => c.id === activeChannelId);
      return (
        <ChannelList
          {...props}
          listType="dms"
          channels={filteredDMs}
          activeChannel={activeChannel}
          onNewChannel={() => { }}
        />
      );
    }
    if (activeViewType === 'channels') {
      const activeChannel = filteredChannels.find(
        (c) => c.id === activeChannelId
      );
      return (
        <ChannelList
          {...props}
          listType="channels"
          channels={filteredChannels}
          activeChannel={activeChannel}
          onNewChannel={() => setIsNewChannelDialogOpen(true)}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Mobile Nav - Strictly hidden on desktop */}
      <div className="md:hidden contents mobile-only">
        <div className="fixed top-0 left-0 right-0 z-[100] p-2 bg-background/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center md:hidden">
          <MobileNav
            activeViewType={activeViewType}
            renderChannelList={renderChannelList}
            pathname={pathname}
          />
        </div>
      </div>

      {/* Desktop Sidebar - Only on desktop */}
      <div className="hidden md:flex h-full">
        <WorkspaceSwitcher activeViewType={activeViewType} />
        {renderChannelList()}
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {children}
        {/* Spacer for bottom nav on mobile */}
        <div className="h-16 md:hidden flex-shrink-0" />
      </main>

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <div className="md:hidden print:hidden mobile-only">
        <BottomNav />
      </div>

      <NewChannelDialog
        isOpen={isNewChannelDialogOpen}
        onOpenChange={setIsNewChannelDialogOpen}
        onSave={handleSaveChannel}
      />
    </div>
  );
}
