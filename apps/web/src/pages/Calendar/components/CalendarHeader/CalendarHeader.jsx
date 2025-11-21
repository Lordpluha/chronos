import React, { useContext } from "react";
import dayjs from "dayjs";
import Logo from "@shared/components/common/Logo";
import UserAccountInfo from "@shared/components/common/UserAccountInfo";
import { Button } from "@shared/ui/button";
import { CalendarContext } from "@shared/context/CalendarContext";

export function CalendarHeader() {
  const { monthIndex, setMonthIndex, viewMode, setViewMode, daySelected, setDaySelected } = useContext(CalendarContext);

  function handlePrev() {
    if (viewMode === 'day') {
      setDaySelected(daySelected.subtract(1, 'day'));
      setMonthIndex(daySelected.subtract(1, 'day').month());
    } else if (viewMode === 'week') {
      setDaySelected(daySelected.subtract(1, 'week'));
      setMonthIndex(daySelected.subtract(1, 'week').month());
    } else if (viewMode === 'month') {
      setMonthIndex(monthIndex - 1);
    } else if (viewMode === 'year') {
      setMonthIndex(monthIndex - 12);
    }
  }

  function handleNext() {
    if (viewMode === 'day') {
      setDaySelected(daySelected.add(1, 'day'));
      setMonthIndex(daySelected.add(1, 'day').month());
    } else if (viewMode === 'week') {
      setDaySelected(daySelected.add(1, 'week'));
      setMonthIndex(daySelected.add(1, 'week').month());
    } else if (viewMode === 'month') {
      setMonthIndex(monthIndex + 1);
    } else if (viewMode === 'year') {
      setMonthIndex(monthIndex + 12);
    }
  }

  function handleToday() {
    const today = dayjs();
    setDaySelected(today);
    setMonthIndex(today.month());
  }

  function getDisplayText() {
    if (viewMode === 'day') {
      return daySelected.format('MMMM DD, YYYY');
    } else if (viewMode === 'week') {
      const startOfWeek = daySelected.startOf('week');
      const endOfWeek = daySelected.endOf('week');
      return `${startOfWeek.format('MMM DD')} - ${endOfWeek.format('MMM DD, YYYY')}`;
    } else if (viewMode === 'year') {
      return dayjs(new Date(dayjs().year(), monthIndex)).format('YYYY');
    } else {
      return dayjs(new Date(dayjs().year(), monthIndex)).format('MMMM YYYY');
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-8">
            <Logo />
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="icon" onClick={handlePrev}>
                <img src="/arrow-left-icon.svg" alt="" />
              </Button>
              <Button variant="secondary" size="default" className="px-6" onClick={handleToday}>
                Today
              </Button>
              <Button variant="secondary" size="icon" onClick={handleNext}>
                <img src="/arrow-right-icon.svg" alt="" />
              </Button>
            </div>
            <h2 className="text-3xl font-semibold min-w-[320px]">
              {getDisplayText()}
            </h2>
          </div>

          {/* Center - View mode buttons */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'year'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Year
            </button>
          </div>

          <UserAccountInfo />
        </div>
      </div>
    </header>
  );
}
