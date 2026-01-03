import { useEffect } from 'react';
import ChatView from '@/components/chat/chat-view';
import { Channel, User } from '@/lib/types';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchMessages, sendMessage } from '@/services/message/messageSlice';

interface ChannelPageProps {
    currentUser: User;
}

export default function ChannelPage({ currentUser }: ChannelPageProps) {
    const { channelId } = useParams<{ channelId: string }>();
    const dispatch = useDispatch<AppDispatch>();

    // Select data from Redux
    const { channels } = useSelector((state: RootState) => state.channels);
    const { messages } = useSelector((state: RootState) => state.messages);
    const { users } = useSelector((state: RootState) => state.users);

    const activeChannel = channels.find(c => c.id === channelId);

    useEffect(() => {
        if (channelId) {
            dispatch(fetchMessages({ channelId }));
        }
    }, [channelId, dispatch]);

    const handleSendMessage = (content: string) => {
        if (channelId) {
            dispatch(sendMessage({ channelId, content }));
        }
    };

    const handleUpdateChannel = (updatedChannel: Channel) => {
        // Optimistic update or specialized thunk if we implement channel editing
        console.log("Update channel not implemented", updatedChannel);
    };

    if (!channelId) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Channel ID missing.</div>;
    }

    if (!activeChannel) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Channel not found in your list.</div>;
    }

    return (
        <ChatView
            activeChannel={activeChannel}
            initialMessages={messages}
            users={users}
            currentUser={currentUser}
            onUpdateChannel={handleUpdateChannel}
            onSendMessage={handleSendMessage}
        />
    );
}
