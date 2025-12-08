import React, { useContext, useState } from "react";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import Logo from "@shared/components/common/Logo";
import UserAccountInfo from "@shared/components/common/UserAccountInfo";
import { Button } from "@shared/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@shared/ui/sheet";
import { CalendarContext } from "@shared/context/CalendarContext";
import { useTheme } from "@shared/context/ThemeContext";
import { useCalendarSettings } from "@shared/hooks/useCalendarSettings";
import { ROUTES } from "@shared/routes";

export function CalendarHeader() {
  const navigate = useNavigate();
  const { monthIndex, setMonthIndex, viewMode, setViewMode, daySelected, setDaySelected } = useContext(CalendarContext);
  const { theme, toggleTheme } = useTheme();
  const { settings } = useCalendarSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      const weekStartDay = settings.weekStartsOn === 'sunday' ? 0 : 1;
      const startOfWeek = daySelected.day(weekStartDay);
      const endOfWeek = startOfWeek.add(6, 'day');
      return `${startOfWeek.format('MMM DD')} - ${endOfWeek.format('MMM DD, YYYY')}`;
    } else if (viewMode === 'year') {
      return dayjs(new Date(dayjs().year(), monthIndex)).format('YYYY');
    } else {
      return dayjs(new Date(dayjs().year(), monthIndex)).format('MMMM YYYY');
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700 transition-colors">
      <div className="mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10">
        {/* Mobile & Tablet Layout (< 1280px) - with burger menu */}
        <div className="xl:hidden">
          {/* Row 1: Burger + Logo + Theme + User */}
          <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              {/* Sheet Component for Burger Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                  <SheetHeader>
                    <SheetTitle className="text-left">Navigation</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 mt-6">
                    <button
                      onClick={() => {
                        navigate(ROUTES.reminders);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-indigo-600 dark:text-indigo-400">
                        <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Reminders</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate(ROUTES.tasks);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-600 dark:text-green-400">
                        <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Tasks</span>
                    </button>
                  </nav>
                </SheetContent>
              </Sheet>
              <Logo />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="5" strokeWidth="2"/>
                    <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="1" y1="12" x2="3" y2="12" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              <UserAccountInfo />
            </div>
          </div>

          {/* Row 2: Navigation + Date */}
          <div className="flex items-center justify-between py-2 md:border-b md:dark:border-gray-700">
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={handlePrev}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="md:w-5 md:h-5">
                  <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              <Button variant="secondary" size="default" className="px-3 h-8 md:h-9 text-xs md:text-sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="secondary" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={handleNext}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="md:w-5 md:h-5">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>
            <h2 className="text-sm md:text-base lg:text-lg font-semibold dark:text-gray-100 truncate max-w-40 md:max-w-none">
              {getDisplayText()}
            </h2>
          </div>

          {/* Row 3: View modes */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5 mb-2 md:mb-3">
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-all ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`flex-1 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-all ${
                viewMode === 'year'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Desktop Layout (≥ 1280px) - Full layout with all buttons */}
        <div className="hidden xl:flex items-center justify-between py-3 lg:py-4 gap-2 lg:gap-4">
          {/* Left section */}
          <div className="flex items-center gap-2 lg:gap-3 xl:gap-4 min-w-0 shrink">
            <Logo />
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="icon" className="h-9 w-9 lg:h-10 lg:w-10" onClick={handlePrev}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="lg:w-5 lg:h-5">
                  <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              <Button variant="secondary" size="default" className="px-3 lg:px-4 xl:px-6 h-9 lg:h-10 text-xs lg:text-sm whitespace-nowrap" onClick={handleToday}>
                Today
              </Button>
              <Button variant="secondary" size="icon" className="h-9 w-9 lg:h-10 lg:w-10" onClick={handleNext}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="lg:w-5 lg:h-5">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>
            <h2 className="text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-semibold dark:text-gray-100 whitespace-nowrap truncate max-w-[200px] lg:max-w-[250px] xl:max-w-none">
              {getDisplayText()}
            </h2>
          </div>

          {/* Center - View mode buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 lg:p-1 gap-0.5 lg:gap-1 shrink-0">
            <button
              onClick={() => setViewMode('day')}
              className={`px-2 lg:px-4 xl:px-5 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2 lg:px-4 xl:px-5 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-2 lg:px-4 xl:px-5 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-2 lg:px-4 xl:px-5 py-1.5 lg:py-2 text-xs lg:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                viewMode === 'year'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Year
            </button>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-1.5 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="lg:w-6 lg:h-6">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="lg:w-6 lg:h-6">
                  <circle cx="12" cy="12" r="5" strokeWidth="2"/>
                  <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="1" y1="12" x2="3" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <button
              onClick={() => navigate(ROUTES.reminders)}
              className="hidden xl:flex items-center gap-2 px-2 lg:px-3 xl:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors whitespace-nowrap"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="lg:w-5 lg:h-5">
                <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden 2xl:inline">Reminders</span>
            </button>
            <button
              onClick={() => navigate(ROUTES.tasks)}
              className="hidden xl:flex items-center gap-2 px-2 lg:px-3 xl:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors whitespace-nowrap"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="lg:w-5 lg:h-5">
                <path d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden 2xl:inline">Tasks</span>
            </button>
            <UserAccountInfo />
          </div>
        </div>
      </div>
    </header>
  );
}
