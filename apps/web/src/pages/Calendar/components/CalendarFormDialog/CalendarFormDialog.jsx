import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import { Share2 } from 'lucide-react';
import { useCreateCalendar, useUpdateCalendar } from '@shared/hooks';
import { ShareCalendarDialog } from '@features/Calendar/ShareCalendar/ShareCalendarDialog';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

export const CalendarFormDialog = ({ open, onOpenChange, calendar }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [showShareDialog, setShowShareDialog] = useState(false);

  const createMutation = useCreateCalendar();
  const updateMutation = useUpdateCalendar();

  // Reset form when calendar changes
  useEffect(() => {
    if (calendar) {
      setTitle(calendar.title || '');
      setDescription(calendar.description || '');
      setColor(calendar.color || '#3b82f6');
    } else {
      setTitle('');
      setDescription('');
      setColor('#3b82f6');
    }
  }, [calendar]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Calendar title is required');
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      color: color,
    };

    if (calendar) {
      // Update existing calendar
      updateMutation.mutate(
        { calendarId: calendar.id, data },
        {
          onSuccess: () => {
            toast.success('Calendar updated successfully');
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update calendar');
          },
        }
      );
    } else {
      // Create new calendar
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Calendar created successfully');
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || 'Failed to create calendar');
        },
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{calendar ? 'Edit Calendar' : 'Create Calendar'}</span>
              {calendar && (
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
            </DialogTitle>
            <DialogDescription>
            {calendar
              ? 'Update your calendar details'
              : 'Create a new calendar to organize your events'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Calendar Name *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Calendar"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Calendar description (optional)"
              rows={3}
            />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-md transition-all ${
                    color === presetColor
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : calendar ? 'Update' : 'Create'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Share Calendar Dialog */}
    <ShareCalendarDialog
      open={showShareDialog}
      onOpenChange={setShowShareDialog}
      calendar={calendar}
    />
  </>
  );
};
