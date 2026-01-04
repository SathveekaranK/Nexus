// @ts-nocheck
"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface CalendarHeaderProps {
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    onNewEvent: () => void;
}

export default function CalendarHeader({ currentDate, onPrevMonth, onNextMonth, onToday, onNewEvent }: CalendarHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">{format(currentDate, 'MMMM yyyy')}</h1>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={onPrevMonth} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onToday}>Today</Button>
                    <Button variant="outline" size="icon" onClick={onNextMonth} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={onNewEvent} size="sm" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    New Event
                </Button>
            </div>
        </div>
    );
}
