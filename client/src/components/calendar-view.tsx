
"use client";

import { useState, useEffect } from 'react';
import { addMonths, subMonths } from 'date-fns';
import { type CalendarEvent } from '@/lib/types';
import CalendarHeader from './calendar/calendar-header';
import CalendarGrid from './calendar/calendar-grid';
import AgendaSidebar from './calendar/agenda-sidebar';
import NewEventDialog from './calendar/new-event-dialog';
import { USERS, CURRENT_USER_ID, CALENDAR_EVENTS } from '@/lib/data';


const currentUser = USERS.find(u => u.id === CURRENT_USER_ID)!;

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(CALENDAR_EVENTS);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  }, []);

  const handlePrevMonth = () => currentDate && setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => currentDate && setCurrentDate(addMonths(currentDate, 1));
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

  const handleSaveEvent = (newEventData: Omit<CalendarEvent, 'id' | 'creatorId'>) => {
    const newEvent: CalendarEvent = {
        ...newEventData,
        id: Date.now(),
        creatorId: currentUser.id,
        participants: newEventData.participants ? [currentUser.id, ...newEventData.participants.filter(p => p !== currentUser.id)] : [currentUser.id],
    };
    setEvents(prev => [...prev, newEvent]);
  }

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setEventToEdit(null);
  }
  
  const handleDeleteEvent = (eventId: string | number) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setIsNewEventDialogOpen(true);
  }

  const userEvents = events.filter(e => e.participants?.includes(currentUser.id));

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
            />
        </div>
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
             <AgendaSidebar selectedDate={selectedDate} events={userEvents} onDeleteEvent={handleDeleteEvent} onEditEvent={handleEditEvent} />
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
