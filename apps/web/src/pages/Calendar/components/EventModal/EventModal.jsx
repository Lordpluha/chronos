import React, { useContext, useState, useEffect } from "react";
import { CalendarContext } from "@shared/context/CalendarContext";
import { Button } from "@shared/ui/button";

export const EventModal = () => {
  const {
    showEventModal,
    setShowEventModal,
    daySelected,
    dispatchCalEvent,
    setSelectedEvent,
    selectedEvent,
  } = useContext(CalendarContext);

  const [title, setTitle] = useState(selectedEvent ? selectedEvent.title : "");
  const [description, setDescription] = useState(
    selectedEvent ? selectedEvent.description : ""
  );
  const labelsClasses = [
    { name: "indigo", class: "bg-indigo-500" },
    { name: "gray", class: "bg-gray-500" },
    { name: "green", class: "bg-green-500" },
    { name: "blue", class: "bg-blue-500" },
    { name: "red", class: "bg-red-500" },
    { name: "purple", class: "bg-purple-500" },
  ];
  const [selectedLabel, setSelectedLabel] = useState(
    selectedEvent
      ? selectedEvent.label
      : labelsClasses[0].name
  );

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title);
      setDescription(selectedEvent.description || "");
      setSelectedLabel(selectedEvent.label);
    } else {
      setTitle("");
      setDescription("");
      setSelectedLabel(labelsClasses[0].name);
    }
  }, [selectedEvent]);

  if (!showEventModal) {
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const calendarEvent = {
      title,
      description,
      label: selectedLabel,
      day: daySelected.valueOf(),
      id: selectedEvent ? selectedEvent.id : Date.now(),
    };
    if (selectedEvent) {
      dispatchCalEvent({ type: "update", payload: calendarEvent });
    } else {
      dispatchCalEvent({ type: "push", payload: calendarEvent });
    }

    setShowEventModal(false);
    setSelectedEvent(null);
  }

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center z-50">
      <form className="bg-white rounded-lg shadow-2xl w-1/4 relative z-50">
        <header className="bg-gray-100 px-4 py-2 flex justify-between items-center">
          <button className="cursor-pointer">
            <img src="/drag-icon.svg" alt="" />
          </button>
          {selectedEvent && (
            <button
              className="cursor-pointer"
              type="button"
              onClick={() => {
                dispatchCalEvent({ type: "delete", payload: selectedEvent });
                setShowEventModal(false);
                setSelectedEvent(null);
              }}
            >
              <img src="/trash-icon.svg" alt="" />
            </button>
          )}
          <button
            className="cursor-pointer"
            type="button"
            onClick={() => {
              setShowEventModal(false);
              setSelectedEvent(null);
            }}
          >
            <img src="/modal-close-icon.svg" alt="" />
          </button>
        </header>
        <div className="p-3">
          <div className="grid grid-cols-1/5 items-end gap-y-7">
            <input
              type="text"
              name="title"
              placeholder="Add a title"
              value={title}
              required
              className="pt-3 border-0 text-gray-600 text-xl font-semibold pb-2 w-full border-b-2 border-gray-200 focus:outline-none focus:ring-0 focus:border-blue-500"
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <img src="/clock-icon.png" alt="" />
              <p>{daySelected ? daySelected.format("dddd, MMMM DD") : ""}</p>
            </div>
            <input
              type="text"
              name="description"
              placeholder="Add a description"
              value={description}
              required
              className="pt-3 border-0 text-gray-600 text-xl font-semibold pb-2 w-full border-b-2 border-gray-200 focus:outline-none focus:ring-0 focus:border-blue-500"
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <img src="/bookmark-icon.svg" alt="" />
              <div className="flex gap-x-2">
                {labelsClasses.map((label, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedLabel(label.name)}
                    className={`${label.class} w-8 h-8 rounded-full flex items-center justify-center cursor-pointer`}
                  >
                    {selectedLabel === label.name && (
                      <img src="/check-icon.svg" alt="" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="flex justify-end border-t p-3 mt-5">
          <Button onClick={handleSubmit} type="submit" variant="secondary">
            Save
          </Button>
        </footer>
      </form>
    </div>
  );
};
