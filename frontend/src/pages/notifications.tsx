// @ts-nocheck
'use client';

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/services/notification/notificationSlice";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, BellOff, CheckCheck, Trash2 } from "lucide-react";

export default function NotificationsPage() {
    const { notifications, unreadCount } = useSelector((state: RootState) => state.notifications);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(fetchNotifications());
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
        <div className="flex-1 flex flex-col h-full bg-background mt-16 md:mt-0">
            <header className="p-6 border-b border-white/5 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20">
                        <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-sm text-muted-foreground">Manage your alerts and activity</p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                        onClick={() => dispatch(markAllNotificationsAsRead())}
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </header>

            <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto p-6 space-y-4">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                                <BellOff className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">All caught up!</h3>
                                <p className="text-muted-foreground">No new notifications at the moment.</p>
                            </div>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <Card
                                key={notification.id}
                                className={cn(
                                    "group relative hover:bg-muted/30 transition-all cursor-pointer border-white/5",
                                    !notification.read && "bg-primary/5 border-l-4 border-l-primary"
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <CardContent className="p-4 flex gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 animate-in fade-in zoom-in duration-300",
                                        !notification.read ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Bell className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className={cn("font-bold text-base", !notification.read && "text-primary")}>
                                                {notification.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">{notification.message}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
