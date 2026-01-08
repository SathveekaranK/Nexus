// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarEvent, User } from "@/lib/types";
import { format } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/services/store";

const getStatusClasses = (status: User["status"]) => {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "offline":
      return "bg-gray-400 border-background";
    case "away":
      return "bg-yellow-500";
    case "dnd":
      return "bg-red-500";
  }
};

interface NewEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (event: Omit<CalendarEvent, "id" | "creatorId">) => void;
  onUpdate: (event: CalendarEvent) => void;
  selectedDate: Date | undefined;
  eventToEdit: CalendarEvent | null;
}

export default function NewEventDialog({
  isOpen,
  onOpenChange,
  onSave,
  onUpdate,
  selectedDate,
  eventToEdit,
}: NewEventDialogProps) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("12:00 PM");
  const [duration, setDuration] = useState("1h");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState<Date | null>(null);

  const { users } = useSelector((state: RootState) => state.users);
  const availableUsers = users.filter(
    (u: User) => u.id !== "nexus-ai" && u.id !== "user-1"
  );

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setTime(eventToEdit.time);
      setDuration(eventToEdit.duration);
      setMeetingUrl(eventToEdit.meetingUrl || "");
      setParticipantIds(eventToEdit.participants || []);
      setEventDate(new Date(eventToEdit.date));
    } else {
      setTitle("");
      setTime("12:00 PM");
      setDuration("1h");
      setMeetingUrl("");
      setParticipantIds([]);
      setEventDate(selectedDate || new Date());
    }
  }, [eventToEdit, isOpen, selectedDate]);

  const handleSave = () => {
    if (!title || !eventDate) return;

    const startDateTime = new Date(eventDate);
    const safeTime = time || "12:00 PM";
    const [timePart, modifier] = safeTime.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    startDateTime.setHours(hours, minutes, 0, 0);

    const durationHours = parseInt(duration) || 1;
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + durationHours);

    const eventData = {
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      title,
      description: "",
      type: "meeting",
      meetingUrl,
      participants: participantIds,
      location: "Online",
    };

    if (eventToEdit) {
      onUpdate({
        ...eventData,
        id: eventToEdit.id,
        creatorId: eventToEdit.creatorId,
      });
    } else {
      onSave(eventData);
    }

    onOpenChange(false);
  };

  const toggleParticipant = (userId: string) => {
    setParticipantIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectedParticipants = availableUsers.filter((u) =>
    participantIds.includes(u.id)
  );
  const dialogTitle = eventToEdit ? "Edit Event" : "Create New Event";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date</Label>
            <Input
              type="date"
              value={eventDate ? format(eventDate, "yyyy-MM-dd") : ""}
              onChange={(e) => setEventDate(new Date(e.target.value))}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Time</Label>
            <Input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Duration</Label>
            <Input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Meeting Link</Label>
            <Input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Participants</Label>
            <div className="col-span-3 border rounded-md">
              <ScrollArea className="h-32">
                <div className="p-2 space-y-2">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={participantIds.includes(user.id)}
                        onCheckedChange={() => toggleParticipant(user.id)}
                      />
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            getStatusClasses(user.status)
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedParticipants.length > 0 && (
                <div className="p-2 border-t flex flex-wrap gap-1">
                  {selectedParticipants.map((p) => (
                    <Badge key={p.id} variant="secondary">
                      {p.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
