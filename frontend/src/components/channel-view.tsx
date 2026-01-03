
'use client';

import { useState } from 'react';
import ChatView from "@/components/chat-view";
import { User, Channel, Message } from "@/lib/types";

interface ChannelViewProps {
  channelId: string;
  initialChannels: Channel[];
  initialMessages: Message[];
  users: User[];
  currentUser: User;
}

export default function ChannelView({
  channelId,
  initialChannels,
  initialMessages,
  users,
  currentUser,
}: ChannelViewProps) {
  const [channels, setChannels] = useState(initialChannels);
  
  const activeChannel = channels.find(c => c.id === channelId) as Channel;
  
  const handleUpdateChannel = (updatedChannel: Channel) => {
    setChannels(prevChannels => prevChannels.map(c => c.id === updatedChannel.id ? updatedChannel : c));
  };
  
  if (!activeChannel) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground">Channel not found.</div>
  }

  return (
    <ChatView
      key={channelId}
      activeChannel={activeChannel}
      initialMessages={initialMessages}
      users={users}
      currentUser={currentUser}
      onUpdateChannel={handleUpdateChannel}
    />
  );
}
