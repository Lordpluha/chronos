import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { useCalendars } from '@shared/hooks/useCalendars';
import { Calendar, Download, Trash2, Star, Share2 } from 'lucide-react';
import { ShareCalendarDialog } from '@features/Calendar/ShareCalendar/ShareCalendarDialog';
import { toast } from 'sonner';

export function CalendarsTab() {
  const { data: calendarsData, isLoading, error } = useCalendars();
  // API возвращает массив напрямую, а не { data: [] }
  const calendars = Array.isArray(calendarsData) ? calendarsData : (calendarsData?.data || []);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState(null);

  // Debug logging - оставим для проверки
  console.log('📊 CalendarsTab Debug:');
  console.log('  Raw data:', calendarsData);
  console.log('  Is Array?:', Array.isArray(calendarsData));
  console.log('  Calendars array:', calendars);
  console.log('  Calendars length:', calendars.length);
  console.log('  Is loading:', isLoading);
  console.log('  Error:', error);

  const handleSetDefault = (calendarId) => {
    // TODO: Implement set default calendar API call
    toast.success('Default calendar updated');
  };

  const handleExport = (calendar) => {
    // TODO: Implement .ics export
    toast.success(`Exporting ${calendar.title}...`);
  };

  const handleDelete = (calendarId) => {
    // TODO: Implement delete calendar with confirmation
    if (confirm('Are you sure you want to delete this calendar?')) {
      toast.success('Calendar deleted');
    }
  };

  const handleShare = (calendar) => {
    setSelectedCalendar(calendar);
    setShowShareDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Loading calendars...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            <p className="font-medium">Error loading calendars</p>
            <p className="text-sm mt-2">{error.message || 'Unknown error'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Calendars</CardTitle>
          <CardDescription>
            Manage your calendars and set default preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calendars.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No calendars found</p>
              <p className="text-sm mb-4">Create your first calendar to get started</p>
              <Button
                onClick={() => toast.info('Calendar creation coming soon')}
                variant="outline"
              >
                Create Calendar
              </Button>
            </div>
          ) : (
            calendars.map((calendar) => (
              <div
                key={calendar._id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: calendar.color || '#3b82f6' }}
                  >
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {calendar.title}
                      </h3>
                      {calendar.is_default && (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {calendar.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {calendar.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{calendar.events?.length || 0} events</span>
                      <span className="capitalize">{calendar.visibility}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!calendar.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(calendar._id)}
                      className="text-gray-600 hover:text-indigo-600"
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(calendar)}
                    className="text-gray-600 hover:text-green-600"
                    title="Share calendar"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport(calendar)}
                    className="text-gray-600 hover:text-blue-600"
                    title="Export calendar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(calendar._id)}
                    className="text-gray-600 hover:text-red-600"
                    disabled={calendar.is_default}
                    title="Delete calendar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import / Export</CardTitle>
          <CardDescription>
            Backup or transfer your calendar data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export all calendars</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Download all your calendars in .ics format
              </p>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium">Import calendar</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Import events from .ics file
              </p>
            </div>
            <Button variant="outline">
              Import .ics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Calendar Dialog */}
      <ShareCalendarDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        calendar={selectedCalendar}
      />
    </>
  );
}
