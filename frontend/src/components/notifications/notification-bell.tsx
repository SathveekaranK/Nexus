import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/services/notification/notificationSlice";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

import { io } from "socket.io-client";

export default function NotificationBell() {
    const { notifications, unreadCount } = useSelector((state: RootState) => state.notifications);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(fetchNotifications());

        // Connect to Socket for Notifications
        const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
            auth: { token: localStorage.getItem('token') }
        });

        socket.on('notification:new', (notification: any) => {
            dispatch({
                type: 'notifications/addNotification',
                payload: notification
            });
            // Optional: Play sound
            // new Audio('/notification.mp3').play().catch(() => {});
        });

        return () => {
            socket.disconnect();
        };

    }, [dispatch]);

    const handleNotificationClick = (notification: any) => {
        dispatch(markNotificationAsRead(notification.id));

        if (notification.channelId) {
            navigate(`/channels/${notification.channelId}`);
        } else if (notification.type === 'resource_added') {
            navigate('/resources');
        } else if (notification.relatedEventId) {
            navigate('/calendar');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 bg-background/95 backdrop-blur-xl border-white/10">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="font-bold">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={() => dispatch(markAllNotificationsAsRead())}>
                            Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No new notifications
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-white/5",
                                    !notification.read && "bg-primary/5 border-l-2 border-primary"
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className={cn("font-medium text-sm", !notification.read && "text-primary")}>{notification.title}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {notification.createdAt ? new Date(notification.createdAt).toLocaleTimeString() : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
