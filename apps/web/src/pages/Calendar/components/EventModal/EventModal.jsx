import React, { useContext, useState, useEffect, useRef } from "react";
import { CalendarContext } from "@shared/context/CalendarContext";
import { useAuth } from "@shared/context/AuthContext";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import { Clock, Trash2, GripVertical, Calendar, Share2, Check, X } from "lucide-react";
import { ShareEventDialog } from "@features/Events/ShareEvent/ShareEventDialog";
import { EventApi } from "@entities/Event/api/EventApi";
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
    refetchEvents,
  } = useContext(CalendarContext);

  const { user } = useAuth();
  const [title, setTitle] = useState(selectedEvent ? selectedEvent.title : "");
  const [description, setDescription] = useState(
    selectedEvent ? selectedEvent.description : ""
  );
  const [startTime, setStartTime] = useState(selectedEvent?.startTime || "09:00");
  const [endTime, setEndTime] = useState(selectedEvent?.endTime || "10:00");
  const [selectedCalendarId, setSelectedCalendarId] = useState(
    selectedEvent?.calendarId || defaultCalendarId
  );
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

    // Валидация времени
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      toast.error("End time must be after start time");
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

  // Проверяем является ли текущий пользователь attendee (не organizer)
  const myAttendeeStatus = React.useMemo(() => {
    if (!selectedEvent?.attendees || !user) return null;

    const attendee = selectedEvent.attendees.find(a => {
      const attendeeUserId = a.user?._id || a.user;
      return attendeeUserId?.toString() === user._id?.toString();
    });

    return attendee ? attendee.status : null;
  }, [selectedEvent, user]);

  // Проверяем является ли пользователь создателем события
  const isCreator = React.useMemo(() => {
    if (!selectedEvent || !user) return false;
    const creatorId = selectedEvent.creator?._id || selectedEvent.creator;
    const result = creatorId?.toString() === user._id?.toString();
    console.log('🔍 isCreator check:', { creatorId, userId: user._id, result });
    return result;
  }, [selectedEvent, user]);

  // Проверяем является ли пользователь владельцем календаря
  const isCalendarOwner = React.useMemo(() => {
    if (!selectedEvent || !user || !calendars) return false;
    const calendar = calendars.find(c => c.id === selectedEvent.calendarId || c._id === selectedEvent.calendarId);
    if (!calendar) {
      console.log('⚠️ Calendar not found for event:', selectedEvent.calendarId);
      return false;
    }
    const ownerId = calendar.owner?._id || calendar.owner;
    const result = ownerId?.toString() === user._id?.toString();
    console.log('🔍 isCalendarOwner check:', { ownerId, userId: user._id, result });
    return result;
  }, [selectedEvent, user, calendars]);

  // Пользователь может редактировать если он создатель ИЛИ владелец календаря
  const canEdit = isCreator || isCalendarOwner;

  // Пользователь является только attendee (не может редактировать) если он в attendees И НЕ создатель И НЕ владелец
  const isAttendee = myAttendeeStatus !== null && !canEdit;

  async function handleUpdateMyStatus(status) {
    if (!selectedEvent) return;

    const eventId = selectedEvent._id || selectedEvent.id;
    if (!eventId) {
      toast.error('Event ID is missing');
      return;
    }

    setUpdatingStatus(true);
    try {
      await EventApi.updateMyStatus(eventId, status);
      toast.success(`Status updated to ${status}`);

      // Refetch events to update the UI
      await refetchEvents();
      setShowEventModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  function handleDelete() {
    dispatchCalEvent({ type: "delete", payload: selectedEvent });
    // Toast показывается в useDeleteEvent хуке
    setShowEventModal(false);
    setSelectedEvent(null);
  }

  return (
    <>
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent
        ref={modalRef}
        className="sm:max-w-[500px] max-w-[95vw] p-0 gap-0 max-h-[90vh] md:max-h-[85vh]"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <DialogHeader
          className="px-4 md:px-6 py-3 md:py-4 border-b bg-gray-50 dark:bg-gray-800 flex flex-row items-center justify-between space-y-0"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2" data-draggable="true">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
            <DialogTitle className="text-lg font-semibold select-none">
              {selectedEvent ? "Edit Event" : "Create Event"}
            </DialogTitle>
          </div>
          {selectedEvent && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
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
              disabled={isAttendee}
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
                  disabled={isAttendee}
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
                  disabled={isAttendee}
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
              disabled={isAttendee}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </Label>
            <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId} disabled={isAttendee}>
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
            {selectedEvent?.creator && (
              <div className="mt-2 text-xs text-gray-500">
                Created by: <span className="font-medium text-gray-700">
                  {selectedEvent.creator.login || selectedEvent.creator.email}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            {selectedEvent && !isAttendee && (
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

            {/* Кнопки для attendee */}
            {isAttendee && myAttendeeStatus === 'invited' && (
              <div className="flex gap-2 mr-auto">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => handleUpdateMyStatus('accepted')}
                  disabled={updatingStatus}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleUpdateMyStatus('declined')}
                  disabled={updatingStatus}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            )}

            {isAttendee && myAttendeeStatus !== 'invited' && (
              <div className="mr-auto text-sm text-gray-600">
                Status: <span className="font-medium capitalize">{myAttendeeStatus}</span>
              </div>
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

            {!isAttendee && (
              <Button type="submit">
                {selectedEvent ? "Update Event" : "Create Event"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Share Event Dialog */}
    <ShareEventDialog
      open={showShareDialog}
      onOpenChange={setShowShareDialog}
      event={selectedEvent}
    />
  </>
  );
};
