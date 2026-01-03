import CalendarView from "@/components/calendar/calendar-view";
import { User } from "@/lib/types";

interface CalendarPageProps {
    currentUser: User;
}

export default function CalendarPage({ currentUser }: CalendarPageProps) {
    return <CalendarView currentUser={currentUser} />;
}
