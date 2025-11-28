import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Label } from '@shared/ui/label';
import { Switch } from '@shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Bell, Mail, Volume2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationsTab() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
    defaultReminderOffset: '15',
    snackbarPosition: 'top-right',
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Notification settings updated');
  };

  const handleSelectChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success('Notification settings updated');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email reminders for upcoming events
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle('emailNotifications')}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <div>
                <Label htmlFor="push-notifications" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get browser notifications for reminders
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={() => handleToggle('pushNotifications')}
            />
          </div>

          {/* Sound Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-gray-400" />
              <div>
                <Label htmlFor="sound-notifications" className="font-medium">
                  Sound Notifications
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Play sound when showing reminders
                </p>
              </div>
            </div>
            <Switch
              id="sound-notifications"
              checked={settings.soundEnabled}
              onCheckedChange={() => handleToggle('soundEnabled')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminder Settings</CardTitle>
          <CardDescription>
            Configure default reminder behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Reminder Offset */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <Label htmlFor="reminder-offset" className="font-medium">
                Default Reminder Time
              </Label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">
              How many minutes before an event should you be reminded
            </p>
            <Select
              value={settings.defaultReminderOffset}
              onValueChange={(value) => handleSelectChange('defaultReminderOffset', value)}
            >
              <SelectTrigger className="ml-8 w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes before</SelectItem>
                <SelectItem value="10">10 minutes before</SelectItem>
                <SelectItem value="15">15 minutes before</SelectItem>
                <SelectItem value="30">30 minutes before</SelectItem>
                <SelectItem value="60">1 hour before</SelectItem>
                <SelectItem value="1440">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Snackbar Position */}
          <div className="space-y-3">
            <Label htmlFor="snackbar-position" className="font-medium">
              Notification Position
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Where reminders appear on your screen
            </p>
            <Select
              value={settings.snackbarPosition}
              onValueChange={(value) => handleSelectChange('snackbarPosition', value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-center">Top Center</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
