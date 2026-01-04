// @ts-nocheck
"use client";

import { startOfMonth, startOfWeek, addDays, getDaysInMonth, format, isSameMonth, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { type CalendarEvent } from '@/lib/types';

interface CalendarGridProps {
    currentDate: Date;
    selectedDate: Date;
    onDateClick: (date: Date) => void;
    events: CalendarEvent[];
}

export default function CalendarGrid({ currentDate, onDateClick, selectedDate, events }: CalendarGridProps) {
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);

    const days = [];
    let day = startDate;
    // Ensure we render 6 weeks to have a consistent grid size
    for (let i = 0; i < 42; i++) {
        days.push(day);
        day = addDays(day, 1);
    }

    const getEventsForDay = (day: Date) => events.filter(event => isSameDay(event.date, day));

    return (
        <div className="grid grid-cols-7 border-t border-l border-border flex-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, index) => (
                <div key={`${dayName}-${index}`} className="p-1 md:p-2 text-center text-xs md:text-sm font-medium text-muted-foreground border-b border-border bg-muted/20">{dayName}</div>
            ))}
            {days.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                return (
                    <div
                        key={index}
                        className={cn(
                            "relative border-r border-b border-border p-1 md:p-2 flex flex-col min-h-[80px] md:min-h-[120px] cursor-pointer hover:bg-muted/50 transition-colors duration-150",
                            !isSameMonth(day, currentDate) && "text-muted-foreground/50 bg-muted/20",
                            isSameDay(day, selectedDate) && "bg-primary/10",
                            isToday(day) && "bg-accent/20"
                        )}
                        onClick={() => onDateClick(day)}
                    >
                        <span className={cn(
                            "font-semibold mb-1 md:mb-2 self-start text-xs md:text-base",
                            isToday(day) && "bg-primary text-primary-foreground rounded-full h-6 w-6 md:h-7 md:w-7 flex items-center justify-center"
                        )}>
                            {format(day, 'd')}
                        </span>
                        <div className="space-y-1 overflow-hidden">
                            {dayEvents.slice(0, 2).map(event => (
                                <div key={event.id} className={cn("text-[10px] md:text-xs p-0.5 md:p-1 rounded truncate", {
                                    'bg-blue-900/50 text-blue-200': event.type === 'meeting',
                                    'bg-green-900/50 text-green-200': event.type === 'event',
                                    'bg-purple-900/50 text-purple-200': event.type === 'planning',
                                })}>
                                    <span className="hidden md:inline">{event.title}</span>
                                    <span className="md:hidden">●</span>
                                </div>
                            ))}
                            {dayEvents.length > 2 && (
                                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">+{dayEvents.length - 2} more</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    )
}
