import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout";
import { MessageSquare, Loader2, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSocket } from "@/lib/socket-client";
import { fetchMe } from "@/services/auth/authSlice";
import { fetchUsers } from "@/services/user/userSlice";
import { fetchChannels } from "@/services/channel/channelSlice";
import { AppDispatch, RootState } from "@/store/store";
// Types inferred from Redux state

import ChannelPage from "@/pages/channel";
import DmPage from "@/pages/dm";
import MusicPage from "@/pages/music";
import AiChatPage from "@/pages/ai-chat";
import CalendarPage from "@/pages/calendar";
import ResourcesPage from "@/pages/resources";
import SettingsPage from "@/pages/settings";
import NotificationsPage from "@/pages/notifications";
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
    const { channels } = useSelector((state: RootState) => state.channels);

    useEffect(() => {
        dispatch(fetchMe());
    }, [dispatch]);

    useEffect(() => {
        if (currentUser) {
            const token = localStorage.getItem('token');
            if (token) {
                import('@/lib/socket-client').then(({ connectSocket }) => {
                    const socket = connectSocket(token);

                    if (socket.connected) {
                        dispatch(fetchUsers());
                        dispatch(fetchChannels());
                    } else {
                        socket.once('connect', () => {
                            dispatch(fetchUsers());
                            dispatch(fetchChannels());
                        });
                    }
                });
            }
        } else {
            import('@/lib/socket-client').then(({ disconnectSocket }) => {
                disconnectSocket();
            });
        }
    }, [currentUser, dispatch]);

    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const checkConnection = () => {
            const socket = getSocket();
            if (socket) {
                setIsConnected(socket.connected);
                socket.on('connect', () => setIsConnected(true));
                socket.on('disconnect', () => setIsConnected(false));
            }
        };

        // Check periodically or after auth
        const interval = setInterval(checkConnection, 1000);
        return () => clearInterval(interval);
    }, [currentUser]);

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

    // Connection Status Banner
    const ConnectionBanner = () => (
        !isConnected && currentUser ? (
            <div className="fixed top-0 left-0 w-full bg-yellow-500/90 text-white text-xs font-bold px-2 py-1 z-50 flex items-center justify-center gap-2 backdrop-blur-sm">
                <Loader2 className="h-3 w-3 animate-spin" /> Connecting to Real-time Server...
            </div>
        ) : null
    );

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
                                    <Route path="/ai-chat" element={<AiChatPage currentUser={currentUser} />} />
                                    <Route path="/calendar" element={<CalendarPage currentUser={currentUser} />} />
                                    <Route path="/resources" element={<ResourcesPage />} />
                                    <Route path="/settings" element={<SettingsPage currentUser={currentUser} />} />
                                    <Route path="/notifications" element={<NotificationsPage />} />
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
