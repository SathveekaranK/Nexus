import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/main-layout";
import { MessageSquare } from "lucide-react";
import { CHANNELS, USERS, CURRENT_USER_ID } from "@/lib/data";

import ChannelPage from "@/pages/channel";
import DmPage from "@/pages/dm";
import MusicPage from "@/pages/music";
import MusicRoomPage from "@/pages/music-room";
import AiChatPage from "@/pages/ai-chat";
import CalendarPage from "@/pages/calendar";
import SettingsPage from "@/pages/settings";

function Home() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-background text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold">Welcome to NexusCom</h2>
            <p>Select a channel or conversation to start messaging.</p>
        </div>
    );
}

function App() {
    const currentUser = USERS.find((u) => u.id === CURRENT_USER_ID)!;

    return (
        <BrowserRouter>
            <MainLayout allChannels={CHANNELS} currentUser={currentUser}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/channels/:channelId" element={<ChannelPage />} />
                    <Route path="/dms/:channelId" element={<DmPage />} />
                    <Route path="/music" element={<MusicPage />} />
                    <Route path="/music/:roomId" element={<MusicRoomPage />} />
                    <Route path="/ai-chat" element={<AiChatPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
            </MainLayout>
            <Toaster />
        </BrowserRouter>
    );
}

export default App;
