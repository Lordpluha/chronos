import React, { useContext, useState, useEffect, useRef } from "react";
import { CalendarContext } from "@shared/context/CalendarContext";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import { Clock, Trash2, GripVertical, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

export const EventModal = () => {
  const {
    showEventModal,
    setShowEventModal,
    daySelected,
    dispatchCalEvent,
    setSelectedEvent,
    selectedEvent,
    calendars,
    defaultCalendarId,
  } = useContext(CalendarContext);

  const [title, setTitle] = useState(selectedEvent ? selectedEvent.title : "");
  const [description, setDescription] = useState(
    selectedEvent ? selectedEvent.description : ""
  );
  const [startTime, setStartTime] = useState(selectedEvent?.startTime || "09:00");
  const [endTime, setEndTime] = useState(selectedEvent?.endTime || "10:00");
  const [selectedCalendarId, setSelectedCalendarId] = useState(
    selectedEvent?.calendarId || defaultCalendarId
  );

  // Состояния для перетаскивания
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || "");
      setStartTime(selectedEvent.startTime || "09:00");
      setEndTime(selectedEvent.endTime || "10:00");
      setSelectedCalendarId(selectedEvent.calendarId || defaultCalendarId);
    } else {
      setTitle("");
      setDescription("");
      setStartTime("09:00");
      setEndTime("10:00");
      setSelectedCalendarId(defaultCalendarId);
    }
    // Сброс позиции при открытии модалки
    setPosition({ x: 0, y: 0 });
  }, [selectedEvent, showEventModal, defaultCalendarId]);

  // Обработчики перетаскивания
  const handleMouseDown = (e) => {
    if (e.target.closest('[data-draggable="true"]')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!selectedCalendarId) {
      toast.error("Please select a calendar");
      return;
    }

    const calendarEvent = {
      title,
      description,
      calendarId: selectedCalendarId,
      day: daySelected.valueOf(),
      startTime,
      endTime,
      id: selectedEvent ? selectedEvent.id : Date.now(),
    };

    if (selectedEvent) {
      dispatchCalEvent({ type: "update", payload: calendarEvent });
      // Toast показывается в useUpdateEvent хуке
    } else {
      dispatchCalEvent({ type: "push", payload: calendarEvent });
      // Toast показывается в useCreateEvent хуке
    }

    setShowEventModal(false);
    setSelectedEvent(null);
  }

  function handleDelete() {
    dispatchCalEvent({ type: "delete", payload: selectedEvent });
    // Toast показывается в useDeleteEvent хуке
    setShowEventModal(false);
    setSelectedEvent(null);
  }

  return (
    <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
      <DialogContent
        ref={modalRef}
        className="sm:max-w-[500px] p-0 gap-0"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <DialogHeader
          className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-800 flex flex-row items-center justify-between space-y-0"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2" data-draggable="true">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            <DialogTitle className="text-lg font-semibold select-none">
              {selectedEvent ? "Edit Event" : "Create Event"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Event Title
            </Label>
            <Input
              id="title"
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </Label>
            <div className="text-sm text-gray-600 mb-2">
              {daySelected ? daySelected.format("dddd, MMMM DD, YYYY") : ""}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startTime" className="text-xs text-gray-500">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-xs text-gray-500">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Add description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </Label>
            <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  {selectedCalendarId && (
                    <div
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{
                        backgroundColor: calendars.find(c => c.id === selectedCalendarId)?.color
                      }}
                    />
                  )}
                  <SelectValue placeholder="Select calendar" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <span>{calendar.title}</span>
                      {calendar.is_default && (
                        <span className="text-xs text-gray-400">(default)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            {selectedEvent && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEventModal(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {selectedEvent ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
