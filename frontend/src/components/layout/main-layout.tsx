'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Channel as ChannelType, User } from '@/lib/types';
import WorkspaceSwitcher from './workspace-switcher';
import ChannelList from '../channel/channel-list';
import NewChannelDialog from '../channel/new-channel-dialog';
import { Link, useLocation } from 'react-router-dom';
import MobileNav from './mobile-nav';
import { Separator } from '../ui/separator';

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
    if (pathname.startsWith('/settings')) return 'settings';
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

  const handleSaveChannel = (channelName: string) => {
    const newChannel: ChannelType = {
      id: `chan-${Date.now()}`,
      name: channelName.toLowerCase().replace(/\s/g, '-'),
      type: 'channel',
      memberIds: [currentUser.id],
    };
    setAllChannels((prev) => [...prev, newChannel]);
  };

  const { filteredDMs, filteredChannels } = useMemo(() => {
    // Show ALL users as DMs options, INCLUDING current user (for self-messaging)
    const dms: ChannelType[] = users
      .map((u) => ({
        id: u.id, // Using User ID as the "Channel ID" for now for DMs
        name: u.id === currentUser.id ? `${u.name} (you)` : u.name,
        type: 'dm',
        memberIds: [currentUser.id, u.id],
      }));

    const channels = allChannels.filter((c) => c.type === 'channel');

    if (!searchTerm) {
      return { filteredDMs: dms, filteredChannels: channels };
    }

    const lowercasedSearch = searchTerm.toLowerCase();

    const filteredDMs = dms.filter((c) => {
      // For our virtual DMs, the name IS the user name
      return c.name.toLowerCase().includes(lowercasedSearch);
    });

    const filteredChannels = channels.filter((c) =>
      c.name.toLowerCase().includes(lowercasedSearch)
    );

    return { filteredDMs, filteredChannels };
  }, [allChannels, users, searchTerm, currentUser.id]);

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
      <div className="md:hidden p-2 absolute top-0 left-0 z-10">
        <MobileNav
          activeViewType={activeViewType}
          renderChannelList={renderChannelList}
          pathname={pathname}
        />
      </div>

      <div className="hidden md:flex h-full">
        <WorkspaceSwitcher activeViewType={activeViewType} />
        {renderChannelList()}
      </div>

      <main className="flex-1 flex flex-col pt-12 md:pt-0">{children}</main>

      <NewChannelDialog
        isOpen={isNewChannelDialogOpen}
        onOpenChange={setIsNewChannelDialogOpen}
        onSave={handleSaveChannel}
      />
    </div>
  );
}
