import { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
  weekStartsOn: 'monday',
  showWeekNumbers: false,
  viewDensity: 'normal',
};

export function useCalendarSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('calendarSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('calendarSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}
