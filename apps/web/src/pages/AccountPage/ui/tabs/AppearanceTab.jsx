import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { Button } from "@shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useTheme } from "@shared/context/ThemeContext";
import { useCalendarSettings } from "@shared/hooks/useCalendarSettings";
import { Moon, Sun, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useCalendarSettings();

  console.log("🎨 AppearanceTab - Current theme:", theme);
  console.log("⚙️ AppearanceTab - Current settings:", settings);

  const handleThemeChange = (newTheme) => {
    console.log("🔄 Changing theme from", theme, "to", newTheme);
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleSettingChange = (key, value) => {
    console.log("🔄 Changing setting", key, "to", value);
    updateSetting(key, value);
    toast.success("Appearance settings updated");
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
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
          <div className="grid grid-cols-2 gap-4">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={`p-4 border-2 rounded-lg transition-all ${
                  theme === value
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Icon
                  className={`h-8 w-8 mx-auto mb-2 ${
                    theme === value
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    theme === value
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {label}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Theme preference is saved automatically and syncs across your
            devices
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
              onValueChange={(value) =>
                handleSettingChange("weekStartsOn", value)
              }
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
        </CardContent>
      </Card>
    </>
  );
}
