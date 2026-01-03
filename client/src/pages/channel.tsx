import ChannelView from '@/components/channel-view';
import { CHANNELS as initialChannels, MESSAGES, USERS, CURRENT_USER_ID } from '@/lib/data';
import { Channel } from '@/lib/types';
import { useParams } from 'react-router-dom';

export default function ChannelPage() {
    const { channelId } = useParams<{ channelId: string }>();
    // Handle optional or undefined channelId
    if (!channelId) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Channel ID missing.</div>;
    }

    const activeChannel = initialChannels.find(c => c.id === channelId) as Channel;
    const currentUser = USERS.find((u) => u.id === CURRENT_USER_ID)!;
    const initialMessages = MESSAGES.filter(m => m.channelId === channelId);

    if (!activeChannel) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Channel not found.</div>
    }

    return (
        <ChannelView
            channelId={channelId}
            initialChannels={initialChannels}
            initialMessages={initialMessages}
            users={USERS}
            currentUser={currentUser}
        />
    );
}
