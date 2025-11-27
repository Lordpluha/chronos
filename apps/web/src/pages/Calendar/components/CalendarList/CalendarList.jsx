import React, { useContext, useMemo, useState } from 'react';
import { CalendarContext } from '@shared/context/CalendarContext';
import { Checkbox } from '@shared/ui/checkbox';
import { Button } from '@shared/ui/button';
import { Plus, Settings, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@shared/ui/dropdown-menu";
import { CalendarFormDialog } from '../CalendarFormDialog';
import { useDeleteCalendar } from '@shared/hooks';
import { toast } from 'sonner';

export const CalendarList = () => {
  const {
    calendars,
    visibleCalendarIds,
    toggleCalendarVisibility,
    sharedCalendars,
  } = useContext(CalendarContext);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState(null);

  const deleteCalendarMutation = useDeleteCalendar();

  // Разделяем календари на "Мои" и "Другие"
  const myCalendars = useMemo(() => {
    return calendars.filter(cal => !cal.isShared);
  }, [calendars]);

  const otherCalendars = useMemo(() => {
    return calendars.filter(cal => cal.isShared);
  }, [calendars]);

  const handleDeleteCalendar = (calendarId, isDefault) => {
    if (isDefault) {
      toast.error('Cannot delete default calendar');
      return;
    }

    if (window.confirm('Are you sure you want to delete this calendar? All events will be deleted.')) {
      deleteCalendarMutation.mutate(calendarId, {
        onSuccess: () => {
          toast.success('Calendar deleted successfully');
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || 'Failed to delete calendar');
        },
      });
    }
  };

  const CalendarItem = ({ calendar }) => {
    const isVisible = visibleCalendarIds.includes(calendar.id);

    return (
      <div className="flex items-center justify-between py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded group">
        <label className="flex items-center flex-1 cursor-pointer">
          <Checkbox
            checked={isVisible}
            onCheckedChange={() => toggleCalendarVisibility(calendar.id)}
            className="mr-3"
          />
          <div
            className="w-4 h-4 rounded-sm mr-3 shrink-0"
            style={{ backgroundColor: calendar.color }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">
            {calendar.title}
            {calendar.is_default && (
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">(default)</span>
            )}
          </span>
        </label>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingCalendar(calendar)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {!calendar.is_default && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleDeleteCalendar(calendar.id, calendar.is_default)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="mt-8">
      {/* My Calendars Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Мои календари</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {myCalendars.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">No calendars yet</p>
        ) : (
          <div className="space-y-1">
            {myCalendars.map(calendar => (
              <CalendarItem key={calendar.id} calendar={calendar} />
            ))}
          </div>
        )}
      </div>

      {/* Other Calendars Section */}
      {otherCalendars.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Другие календари</h3>
          <div className="space-y-1">
            {otherCalendars.map(calendar => (
              <CalendarItem key={calendar.id} calendar={calendar} />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <CalendarFormDialog
        open={showCreateDialog || !!editingCalendar}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingCalendar(null);
          }
        }}
        calendar={editingCalendar}
      />
    </div>
  );
};
