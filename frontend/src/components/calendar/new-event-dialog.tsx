// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarEvent, User } from '@/lib/types';
import { format } from 'date-fns';
import { USERS } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/services/store';

const getStatusClasses = (status: User['status']) => {
    switch (status) {
        case 'online': return 'bg-green-500';
        case 'offline': return 'bg-gray-400 border-background';
        case 'away': return 'bg-yellow-500';
        case 'dnd': return 'bg-red-500';
    }
}

interface NewEventDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (event: Omit<CalendarEvent, 'id' | 'creatorId'>) => void;
    onUpdate: (event: CalendarEvent) => void;
    selectedDate: Date | undefined;
    eventToEdit: CalendarEvent | null;
}

export default function NewEventDialog({ isOpen, onOpenChange, onSave, onUpdate, selectedDate, eventToEdit }: NewEventDialogProps) {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('12:00 PM');
    const [duration, setDuration] = useState('1h');
    const [meetingUrl, setMeetingUrl] = useState('');
    const [participantIds, setParticipantIds] = useState<string[]>([]);

    // Use Redux users
    const { users } = useSelector((state: RootState) => state.users);
    const availableUsers = users.filter((u: User) => u.id !== 'nexus-ai' && u.id !== 'user-1'); // Filter out bot/self if needed, currently filtering bot

    useEffect(() => {
        if (eventToEdit) {
            setTitle(eventToEdit.title);
            setTime(eventToEdit.time);
            setDuration(eventToEdit.duration);
            setMeetingUrl(eventToEdit.meetingUrl || '');
            setParticipantIds(eventToEdit.participants || []);
        } else {
            // Reset for new event
            setTitle('');
            setTime('12:00 PM');
            setDuration('1h');
            setMeetingUrl('');
            setParticipantIds([]);
        }
    }, [eventToEdit, isOpen]);

    const handleSave = () => {
        const dateToUse = eventToEdit?.date || selectedDate;
        if (title && dateToUse) {
            // Combine date and time
            // Combine date and time
            const startDateTime = new Date(dateToUse);
            // Paranoid check: ensure time is a string and not empty
            const safeTime = (typeof time === 'string' && time.trim() !== '') ? time : '12:00 PM';
            const [timePart, modifier] = safeTime.split(' ');
            let [hours, minutes] = timePart.split(':').map(Number);

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            startDateTime.setHours(hours, minutes, 0, 0);

            // Calculate end time based on duration (simple parsing)
            const durationHours = parseInt(duration) || 1;
            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(startDateTime.getHours() + durationHours);

            const eventData = {
                startDate: startDateTime.toISOString(),
                endDate: endDateTime.toISOString(),
                title,
                description: '', // default
                type: 'meeting',
                meetingUrl,
                participants: participantIds,
                location: 'Online' // default
            };

            if (eventToEdit) {
                // @ts-expect-error - id type
                onUpdate({
                    ...eventData,
                    id: eventToEdit.id,
                    creatorId: eventToEdit.creatorId,
                });
            } else {
                // @ts-expect-error - id type
                onSave(eventData);
            }
            onOpenChange(false);
        }
    };

    const toggleParticipant = (userId: string) => {
        setParticipantIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    }

    const selectedParticipants = availableUsers.filter(u => participantIds.includes(u.id));
    const dialogTitle = eventToEdit ? 'Edit Event' : 'Create New Event';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Title
                        </Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Date
                        </Label>
                        <Input id="date" value={format(eventToEdit?.date || selectedDate || new Date(), 'PPP')} disabled className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">
                            Time
                        </Label>
                        <Input id="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">
                            Duration
                        </Label>
                        <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="meeting-url" className="text-right">
                            Meeting Link
                        </Label>
                        <Input id="meeting-url" placeholder="https://meet.google.com/..." value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">
                            Participants
                        </Label>
                        <div className="col-span-3 border rounded-md">
                            <ScrollArea className="h-32">
                                <div className="p-2 space-y-2">
                                    {availableUsers.map((user) => (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={participantIds.includes(user.id)}
                                                onCheckedChange={() => toggleParticipant(user.id)}
                                            />
                                            <label
                                                htmlFor={`user-${user.id}`}
                                                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 w-full cursor-pointer"
                                            >
                                                <div className="relative">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={user.avatar} />
                                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className={cn("absolute bottom-0 -right-1 h-2 w-2 rounded-full border border-background", getStatusClasses(user.status))} />
                                                </div>
                                                {user.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            {selectedParticipants.length > 0 && (
                                <div className="p-2 border-t flex flex-wrap gap-1">
                                    {selectedParticipants.map(p => <Badge key={p.id} variant="secondary">{p.name}</Badge>)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSave}>
                        Save Event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
