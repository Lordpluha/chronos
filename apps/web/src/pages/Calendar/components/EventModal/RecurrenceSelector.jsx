import React, { useState, useEffect } from "react";
import { Label } from "@shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { Input } from "@shared/ui/input";
import { Checkbox } from "@shared/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@shared/ui/radio-group";
import { Repeat, X } from "lucide-react";
import { Button } from "@shared/ui/button";

const WEEKDAYS = [
  { value: "MO", label: "Mon" },
  { value: "TU", label: "Tue" },
  { value: "WE", label: "Wed" },
  { value: "TH", label: "Thu" },
  { value: "FR", label: "Fri" },
  { value: "SA", label: "Sat" },
  { value: "SU", label: "Sun" },
];

export const RecurrenceSelector = ({ value, onChange, disabled }) => {
  const [isRecurring, setIsRecurring] = useState(!!value);
  const [frequency, setFrequency] = useState(value?.frequency || "weekly");
  const [interval, setInterval] = useState(value?.interval || 1);
  const [byWeekday, setByWeekday] = useState(value?.byWeekday || []);
  const [endType, setEndType] = useState(
    value?.until ? "until" : value?.count ? "count" : "never"
  );
  const [count, setCount] = useState(value?.count || 10);
  const [until, setUntil] = useState(
    value?.until ? new Date(value.until).toISOString().split("T")[0] : ""
  );

  useEffect(() => {
    if (!isRecurring) {
      onChange(null);
      return;
    }

    const recurrence = {
      frequency,
      interval: Number(interval),
    };

    if (frequency === "weekly" && byWeekday.length > 0) {
      recurrence.byWeekday = byWeekday;
    }

    if (endType === "count") {
      recurrence.count = Number(count);
    } else if (endType === "until" && until) {
      recurrence.until = new Date(until).toISOString();
    }

    onChange(recurrence);
  }, [isRecurring, frequency, interval, byWeekday, endType, count, until]);

  const toggleWeekday = (day) => {
    if (disabled) return;
    setByWeekday((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (!isRecurring) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Recurrence
        </Label>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-gray-600"
          onClick={() => !disabled && setIsRecurring(true)}
          disabled={disabled}
        >
          <Repeat className="h-4 w-4 mr-2" />
          Add recurrence
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Recurrence
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => !disabled && setIsRecurring(false)}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label htmlFor="frequency" className="text-xs text-gray-600">
          Repeat every
        </Label>
        <div className="flex gap-2">
          <Input
            id="interval"
            type="number"
            min="1"
            max="99"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-20"
            disabled={disabled}
          />
          <Select value={frequency} onValueChange={setFrequency} disabled={disabled}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Day{interval > 1 ? "s" : ""}</SelectItem>
              <SelectItem value="weekly">Week{interval > 1 ? "s" : ""}</SelectItem>
              <SelectItem value="monthly">Month{interval > 1 ? "s" : ""}</SelectItem>
              <SelectItem value="yearly">Year{interval > 1 ? "s" : ""}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Weekly: Select days */}
      {frequency === "weekly" && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Repeat on</Label>
          <div className="flex gap-1">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWeekday(day.value)}
                disabled={disabled}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-colors ${
                  byWeekday.includes(day.value)
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-500 hover:text-white"}`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* End condition */}
      <div className="space-y-3">
        <Label className="text-xs text-gray-600">Ends</Label>
        <RadioGroup value={endType} onValueChange={setEndType} disabled={disabled}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="never" id="never" disabled={disabled} />
            <Label htmlFor="never" className="text-sm font-normal cursor-pointer">
              Never
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="count" id="count" disabled={disabled} />
            <Label htmlFor="count" className="text-sm font-normal cursor-pointer">
              After
            </Label>
            <Input
              type="number"
              min="1"
              max="999"
              value={count}
              onChange={(e) => {
                setCount(e.target.value);
                setEndType("count");
              }}
              className="w-20 h-8"
              disabled={disabled || endType !== "count"}
            />
            <span className="text-sm text-gray-600">occurrences</span>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="until" id="until" disabled={disabled} />
            <Label htmlFor="until" className="text-sm font-normal cursor-pointer">
              On
            </Label>
            <Input
              type="date"
              value={until}
              onChange={(e) => {
                setUntil(e.target.value);
                setEndType("until");
              }}
              className="flex-1 h-8"
              disabled={disabled || endType !== "until"}
            />
          </div>
        </RadioGroup>
      </div>

      {/* Summary */}
      <div className="pt-3 border-t text-xs text-gray-600">
        {getSummary(frequency, interval, byWeekday, endType, count, until)}
      </div>
    </div>
  );
};

function getSummary(frequency, interval, byWeekday, endType, count, until) {
  let summary = "Repeats ";

  if (interval === 1) {
    summary += frequency === "daily" ? "daily" : frequency === "weekly" ? "weekly" : frequency === "monthly" ? "monthly" : "yearly";
  } else {
    summary += `every ${interval} ${frequency === "daily" ? "days" : frequency === "weekly" ? "weeks" : frequency === "monthly" ? "months" : "years"}`;
  }

  if (frequency === "weekly" && byWeekday.length > 0) {
    const dayNames = byWeekday.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(", ");
    summary += ` on ${dayNames}`;
  }

  if (endType === "count") {
    summary += `, ${count} times`;
  } else if (endType === "until" && until) {
    summary += `, until ${new Date(until).toLocaleDateString()}`;
  }

  return summary;
}
