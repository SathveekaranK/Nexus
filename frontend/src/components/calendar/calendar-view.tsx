// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { type CalendarEvent, type User } from '@/lib/types';
import CalendarHeader from './calendar-header';
import CalendarGrid from './calendar-grid';
import AgendaSidebar from './agenda-sidebar';
import NewEventDialog from './new-event-dialog';
import { useToast } from '@/hooks/use-toast';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '@/services/event/eventSlice';

interface CalendarViewProps {
  currentUser: User;
}

export default function CalendarView({ currentUser }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();

  const { events: backendEvents, loading } = useSelector((state: RootState) => state.events);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  }, []);

  useEffect(() => {
    if (currentDate) {
      const month = format(currentDate, 'yyyy-MM');
      dispatch(fetchEvents(month));
    }
  }, [currentDate, dispatch]);

  const handlePrevMonth = () => {
    if (currentDate) {
      const newDate = subMonths(currentDate, 1);
      setCurrentDate(newDate);
    }
  };

  const handleNextMonth = () => {
    if (currentDate) {
      const newDate = addMonths(currentDate, 1);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const handleNewEvent = () => {
    if (!selectedDate) {
      const now = new Date();
      setSelectedDate(now);
      setCurrentDate(now);
    }
    setEventToEdit(null);
    setIsNewEventDialogOpen(true);
  }

  const handleSaveEvent = async (newEventData: Omit<CalendarEvent, 'id' | 'creatorId'>) => {
    try {
      await dispatch(createEvent({
        ...newEventData,
        creatorId: currentUser.id,
        participants: newEventData.participants || [currentUser.id],
      })).unwrap();
      toast({ title: 'Event created successfully' });
      setIsNewEventDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Failed to create event', description: error.message || 'Please try again', variant: 'destructive' });
    }
  }

  const handleUpdateEvent = async (updatedEvent: CalendarEvent) => {
    try {
      const eventId = updatedEvent.id || updatedEvent._id;
      if (!eventId) return;

      await dispatch(updateEvent({
        eventId: eventId as string,
        updates: updatedEvent,
      })).unwrap();
      toast({ title: 'Event updated successfully' });
      setEventToEdit(null);
      setIsNewEventDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Failed to update event', description: error.message || 'Please try again', variant: 'destructive' });
    }
  }

  const handleDeleteEvent = async (eventId: string | number) => {
    try {
      await dispatch(deleteEvent(eventId as string)).unwrap();
      toast({ title: 'Event deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to delete event', description: error.message || 'Please try again', variant: 'destructive' });
    }
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setIsNewEventDialogOpen(true);
  }

  const userEvents = backendEvents.filter((e: any) =>
    e.participants?.includes(currentUser.id) || e.creatorId === currentUser.id
  );

  if (!currentDate || !selectedDate) {
    return <div className="flex-1 flex items-center justify-center">Loading calendar...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background p-4 md:p-6">
      <header className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Your schedule, organized.</p>
        </div>
      </header>
      <div className="flex-1 flex flex-col md:flex-row gap-6 mt-6 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <CalendarHeader
            currentDate={currentDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            onNewEvent={handleNewEvent}
          />
          <CalendarGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateClick={(date) => setSelectedDate(date)}
            events={userEvents}
            loading={loading}
          />
        </div>
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
          <AgendaSidebar
            selectedDate={selectedDate}
            events={userEvents}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={handleEditEvent}
          />
        </div>
      </div>
      <NewEventDialog
        isOpen={isNewEventDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEventToEdit(null);
          setIsNewEventDialogOpen(isOpen);
        }}
        onSave={handleSaveEvent}
        onUpdate={handleUpdateEvent}
        selectedDate={selectedDate}
        eventToEdit={eventToEdit}
      />
    </div>
  );
}
