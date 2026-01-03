import { useEffect, useState } from 'react';
import ChatView from "@/components/chat/chat-view";
import { Channel, User } from '@/lib/types';
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchMessages, sendMessage } from '@/services/message/messageSlice';

interface DmPageProps {
    currentUser: User;
}

export default function DmPage({ currentUser }: DmPageProps) {
    // The route is /dms/:channelId
    // But in our virtual DM world, 'channelId' is actually the target user's ID
    const { channelId: userId } = useParams<{ channelId: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { messages } = useSelector((state: RootState) => state.messages);
    const { users } = useSelector((state: RootState) => state.users);

    // We construct a "virtual" channel object for the view
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

    useEffect(() => {
        if (userId) {
            dispatch(fetchMessages(userId));

            // Find the other user to set as the channel name
            // If messaging ourselves, user found is us.
            const otherUser = users.find(u => u.id === userId);

            // If user not found yet (maybe users load slow), fallback or wait.
            // But we can construct channel anyway to avoid null errors if we want.
            const channelName = otherUser ? otherUser.name : 'Unknown User';
            const isSelf = otherUser?.id === currentUser.id;

            setActiveChannel({
                id: userId,
                name: isSelf ? `${channelName} (you)` : channelName,
                type: 'dm',
                memberIds: [currentUser.id, userId]
            });
        }
    }, [userId, dispatch, users, currentUser.id]);

    const handleSendMessage = (content: string) => {
        if (userId) {
            dispatch(sendMessage({ recipientId: userId, content }));
        }
    };

    if (!userId) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">User ID missing.</div>;
    }

    if (!activeChannel) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading chat...</div>
    }

    return (
        <ChatView
            key={userId}
            activeChannel={activeChannel}
            initialMessages={messages}
            users={users}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
        />
    );
}
