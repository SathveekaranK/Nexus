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
    const { messages, error: messageError } = useSelector((state: RootState) => state.messages);
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

    if (messageError) {
        return (
            <div className="flex-1 flex flex-col gap-4 items-center justify-center text-destructive">
                <p>Failed to load messages.</p>
                <p className="text-sm border p-2 rounded bg-destructive/10">{messageError}</p>
            </div>
        );
    }

    const handleUpdateChannel = (_updatedChannel: Channel) => {
        // Channel update logic handled via Redux
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
