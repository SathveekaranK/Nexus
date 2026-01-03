import { useEffect, useState } from 'react';
import ChatView from '@/components/chat/chat-view';
import { CHANNELS, MESSAGES, USERS } from '@/lib/data';
import { Channel, Message, User } from '@/lib/types';
import { useParams } from 'react-router-dom';

interface ChannelPageProps {
    currentUser: User;
}

export default function ChannelPage({ currentUser }: ChannelPageProps) {
    const { channelId } = useParams<{ channelId: string }>();
    const [channel, setChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const users = USERS;

    useEffect(() => {
        if (!channelId) return;

        const channelData = CHANNELS.find(c => c.id === channelId);
        if (channelData) {
            setChannel(channelData);
            const channelMessages = MESSAGES.filter(m => m.channelId === channelId);
            setMessages(channelMessages);
        }
    }, [channelId]);

    const handleUpdateChannel = (updatedChannel: Channel) => {
        setChannel(updatedChannel);
    };

    if (!channelId) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Channel ID missing.</div>;
    }

    if (!channel) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Channel not found.</div>;
    }

    return (
        <ChatView
            activeChannel={channel}
            initialMessages={messages}
            users={users}
            currentUser={currentUser}
            onUpdateChannel={handleUpdateChannel}
        />
    );
}
