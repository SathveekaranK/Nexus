import AiChatView from "@/components/ai-chat-view";
import { USERS, CURRENT_USER_ID } from "@/lib/data";

export default function AiChatPage() {
    const currentUser = USERS.find((u) => u.id === CURRENT_USER_ID)!;
    return <AiChatView currentUser={currentUser} />;
}
