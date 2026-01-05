// @ts-nocheck
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isSameDay } from 'date-fns';
import { CalendarIcon, Clock, Edit, Trash2, Video } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { type CalendarEvent, type User } from '@/lib/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils';

const getStatusClasses = (status: User['status']) => {
    switch (status) {
        case 'online': return 'bg-green-500';
        case 'offline': return 'bg-gray-400 border-background';
        case 'away': return 'bg-yellow-500';
        case 'dnd': return 'bg-red-500';
        default: return 'bg-gray-400 border-background';
    }
}

interface AgendaSidebarProps {
    selectedDate: Date | undefined;
    events: CalendarEvent[];
    onDeleteEvent: (eventId: string | number) => void;
    onEditEvent: (event: CalendarEvent) => void;
}

export default function AgendaSidebar({ selectedDate, events, onDeleteEvent, onEditEvent }: AgendaSidebarProps) {
    const { users, currentUser } = useSelector((state: RootState) => state.users);

    const selectedDayEvents = useMemo(() => {
        return selectedDate ? events.filter(event => isSameDay(event.date, selectedDate)) : [];
    }, [selectedDate, events]);

    const handleJoinMeeting = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    return (
        <Card className="h-full w-full md:w-80 lg:w-96">
            <CardHeader>
                <CardTitle>
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                </CardTitle>
                <CardDescription>
                    {selectedDayEvents.length > 0 ? `${selectedDayEvents.length} event(s)` : "No events scheduled"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map(event => {
                        // Participant mapping logic
                        const participants = (event.participants || [])
                            .map(uid => users.find((u: User) => u.id === uid))
                            .filter((u): u is User => !!u);

                        const isCreator = event.creatorId === currentUser?.id;

                        // Debugging: Log participants if empty (useful for dev check)
                        // console.log('Event:', event.title, 'Participants IDs:', event.participants, 'Resolved:', participants);

                        return (
                            <div key={event.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">{event.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{event.time}</span>
                                            <span>({event.duration})</span>
                                        </div>
                                    </div>
                                    {isCreator && (
                                        <div className="flex items-center">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditEvent(event)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently cancel the event.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Close</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDeleteEvent(event.id)}>Cancel Event</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </div>

                                {participants.length > 0 && (
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {participants.map(user => (
                                                <div key={user.id} className="relative inline-block">
                                                    <Avatar className="h-6 w-6 rounded-full ring-2 ring-background">
                                                        <AvatarImage src={user?.avatar} data-ai-hint="person portrait" />
                                                        <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className={cn("absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background", getStatusClasses(user.status))} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {event.meetingUrl && (
                                    <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => handleJoinMeeting(event.meetingUrl!)}>
                                        <Video className="mr-2 h-4 w-4" />
                                        Join
                                    </Button>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center text-muted-foreground pt-8">
                        <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-2">No events scheduled for this day.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
