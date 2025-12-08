import React, { useState } from "react";
import { CreateEventButton } from "../CreateEventButton";
import { SmallCalendar } from "../SmallCalendar";
import { CalendarList } from "../CalendarList";
import { UpcomingEvents } from "../UpcomingEvents";
import { ScrollArea } from "@shared/ui/scroll-area";
import { Menu, X } from "lucide-react";
import { Button } from "@shared/ui/button";

export const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div className="p-5 shrink-0">
        <CreateEventButton />
      </div>
      <ScrollArea className="flex-1 h-0">
        <div className="px-5 pb-4">
          <SmallCalendar />
          <CalendarList />
          <UpcomingEvents />
        </div>
      </ScrollArea>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex border-r dark:border-gray-700 w-72 flex-col bg-white dark:bg-gray-800 transition-colors">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button - Bottom Left Corner */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed bottom-6 left-6 z-40 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Open sidebar menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
};
