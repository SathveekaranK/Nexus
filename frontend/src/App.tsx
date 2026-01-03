import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { MessageSquare, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "@/services/auth/authSlice";
import { fetchUsers } from "@/services/user/userSlice";
import { AppDispatch, RootState } from "@/store/store";
import api from "@/components/api/axios";
import { Channel, User } from "@/lib/types";

import ChannelPage from "@/pages/channel";
import DmPage from "@/pages/dm";
import MusicPage from "@/pages/music";
import MusicRoomPage from "@/pages/music-room";
import AiChatPage from "@/pages/ai-chat";
import CalendarPage from "@/pages/calendar";
import SettingsPage from "@/pages/settings";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

function Home() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-background text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-bold">Welcome to NexusCom</h2>
            <p>Select a channel or conversation to start messaging.</p>
        </div>
    );
}

export default function App() {
    const dispatch = useDispatch<AppDispatch>();
    const { user: currentUser, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
    const { users } = useSelector((state: RootState) => state.users);
    const [channels, setChannels] = useState<Channel[]>([]);

    useEffect(() => {
        dispatch(fetchMe());
    }, [dispatch]);

    useEffect(() => {
        if (currentUser) {
            dispatch(fetchUsers());
            // Fetch supplemental data (Channels)
            const fetchData = async () => {
                try {
                    const channelsRes: any = await api.get('/channels').catch(() => ({ data: [] }));
                    setChannels(channelsRes.data || []);
                } catch (e) {
                    console.warn("Could not fetch extra data", e);
                }
            };
            fetchData();
        }
    }, [currentUser, dispatch]);

    if (isAuthLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium text-muted-foreground animate-pulse">Initializing Nexus...</p>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected App Routes */}
                <Route
                    path="/*"
                    element={
                        currentUser ? (
                            <MainLayout allChannels={channels} currentUser={currentUser} users={users}>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/channels/:channelId" element={<ChannelPage currentUser={currentUser} />} />
                                    <Route path="/dms/:channelId" element={<DmPage currentUser={currentUser} />} />
                                    <Route path="/music" element={<MusicPage />} />
                                    <Route path="/music/:roomId" element={<MusicRoomPage currentUser={currentUser} />} />
                                    <Route path="/ai-chat" element={<AiChatPage currentUser={currentUser} />} />
                                    <Route path="/calendar" element={<CalendarPage currentUser={currentUser} />} />
                                    <Route path="/settings" element={<SettingsPage currentUser={currentUser} />} />
                                </Routes>
                            </MainLayout>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
            </Routes>
            <Toaster />
        </BrowserRouter>
    );
}
