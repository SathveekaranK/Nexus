import AiChatView from "@/components/ai/ai-chat-view";
import { User } from "@/lib/types";

interface AiChatPageProps {
    currentUser: User;
}

export default function AiChatPage({ currentUser }: AiChatPageProps) {
    return <AiChatView currentUser={currentUser} />;
}
