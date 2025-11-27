import { useState, useEffect } from 'react';
import { Button } from '@shared/ui/button';

export const ReminderForm = ({
  initialData = {},
  calendars = [],
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    calendar: initialData.calendar?._id || calendars[0]?._id || '',
    start: initialData.start
      ? new Date(initialData.start).toISOString().slice(0, 16)
      : '',
    time_zone: initialData.time_zone || 'Europe/Moscow',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Enter reminder title';
    }

    if (!formData.calendar) {
      newErrors.calendar = 'Select calendar';
    }

    if (!formData.start) {
      newErrors.start = 'Set date and time';
    } else {
      const selectedDate = new Date(formData.start);
      const now = new Date();
      if (selectedDate < now) {
        newErrors.start = 'Date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = {
      ...formData,
      start: new Date(formData.start).toISOString(),
    };

    onSubmit(submitData);
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-semibold text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Call doctor"
          className={`px-3 py-2.5 border-2 rounded-lg text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-text ${
            errors.title ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
          }`}
          maxLength={300}
        />
        {errors.title && <span className="text-sm text-red-500 -mt-1">{errors.title}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-semibold text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Additional information..."
          className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-900 transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-y min-h-20 cursor-text"
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="calendar" className="text-sm font-semibold text-gray-700">
          Calendar <span className="text-red-500">*</span>
        </label>
        <select
          id="calendar"
          name="calendar"
          value={formData.calendar}
          onChange={handleChange}
          className={`px-3 py-2.5 border-2 rounded-lg text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
            errors.calendar ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
          }`}
        >
          <option value="">Select calendar</option>
          {calendars?.map(cal => cal && (
            <option key={cal._id} value={cal._id}>
              {cal.title || 'Untitled'}
            </option>
          ))}
        </select>
        {errors.calendar && <span className="text-sm text-red-500 -mt-1">{errors.calendar}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="start" className="text-sm font-semibold text-gray-700">
          Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          id="start"
          name="start"
          value={formData.start}
          onChange={handleChange}
          className={`px-3 py-2.5 border-2 rounded-lg text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-text ${
            errors.start ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
          }`}
        />
        {errors.start && <span className="text-sm text-red-500 -mt-1">{errors.start}</span>}
      </div>

      <div className="flex gap-3 justify-end mt-2 pt-5 border-t border-gray-200">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          size="default"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="default"
          size="default"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : initialData._id ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
