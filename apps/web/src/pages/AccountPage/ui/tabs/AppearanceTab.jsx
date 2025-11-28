import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Label } from '@shared/ui/label';
import { Switch } from '@shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    weekStartsOn: 'monday',
    showWeekNumbers: false,
    viewDensity: 'normal',
  });

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success('Appearance settings updated');
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Customize the appearance of your calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  theme === value
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`h-8 w-8 mx-auto mb-2 ${
                  theme === value ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  theme === value ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {label}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Theme preference is saved automatically and syncs across your devices
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar Display</CardTitle>
          <CardDescription>
            Customize how your calendar is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Week Start Day */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <Label htmlFor="week-starts" className="font-medium">
                Week starts on
              </Label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">
              Choose which day your week starts with
            </p>
            <Select
              value={settings.weekStartsOn}
              onValueChange={(value) => handleSettingChange('weekStartsOn', value)}
            >
              <SelectTrigger className="ml-8 w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show Week Numbers */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="week-numbers" className="font-medium">
                Show week numbers
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Display week numbers in the calendar
              </p>
            </div>
            <Switch
              id="week-numbers"
              checked={settings.showWeekNumbers}
              onCheckedChange={(checked) => handleSettingChange('showWeekNumbers', checked)}
            />
          </div>

          {/* View Density */}
          <div className="space-y-3">
            <Label htmlFor="view-density" className="font-medium">
              View density
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Adjust how much information is shown in calendar views
            </p>
            <Select
              value={settings.viewDensity}
              onValueChange={(value) => handleSettingChange('viewDensity', value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced</CardTitle>
          <CardDescription>
            Advanced appearance customization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="font-medium">Custom theme colors</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
                Customize accent colors for your calendar (Coming soon)
              </p>
              <Button variant="outline" disabled>
                Customize Colors
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
