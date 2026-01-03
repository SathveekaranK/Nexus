import ChatView from "@/components/chat-view";
import { MESSAGES, USERS, CURRENT_USER_ID, CHANNELS } from "@/lib/data";
import { Channel } from "@/lib/types";
import { useParams } from "react-router-dom";

export default function DmPage() {
    const { channelId } = useParams<{ channelId: string }>();
    if (!channelId) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Chat ID missing.</div>;
    }

    const activeChannel = CHANNELS.find(c => c.id === channelId) as Channel;
    const currentUser = USERS.find((u) => u.id === CURRENT_USER_ID)!;
    const initialMessages = MESSAGES.filter(m => m.channelId === channelId);

    if (!activeChannel) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Chat not found.</div>
    }

    // Since onUpdateChannel is not needed for DMs in the current implementation, we pass a no-op function.
    const handleUpdateChannel = () => { };

    return (
        <ChatView
            key={channelId}
            activeChannel={activeChannel}
            initialMessages={initialMessages}
            users={USERS}
            currentUser={currentUser}
            onUpdateChannel={handleUpdateChannel}
        />
    );
}
