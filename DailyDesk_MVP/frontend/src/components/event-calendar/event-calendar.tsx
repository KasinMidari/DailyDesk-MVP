"use client";

import { RiCalendarCheckLine } from "@remixicon/react";
import { addDays, addMonths, addWeeks, endOfWeek, isSameMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { format } from "@/lib/date";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AgendaDaysToShow,
  AgendaView,
  addHoursToDate,
  CalendarDndProvider,
  type CalendarEvent,
  type CalendarView,
  DayView,
  EventDialog,
  EventGap,
  EventHeight,
  MonthView,
  WeekCellsHeight,
  WeekView,
} from "@/components/event-calendar";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const VIEW_LABEL: Record<string, string> = { month: "Tháng", week: "Tuần", day: "Ngày", agenda: "Lịch trình" };

export interface EventCalendarProps {
  events?: CalendarEvent[];
  onEventAdd?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => boolean | void;
  onEventDelete?: (eventId: string) => void;
  onEventSelect?: (event: CalendarEvent) => boolean | void;
  createLabel?: string;
  onCreateClick?: (date?: Date) => void;
  className?: string;
  initialView?: CalendarView;
  boardId?: string;
  lists?: Array<{ id: string; title: string }>;
}

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onEventSelect,
  createLabel,
  onCreateClick,
  className,
  initialView = "month",
  boardId,
  lists,
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(initialView);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  // Add keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea or contentEditable element
      // or if the event dialog is open
      if (
        isEventDialogOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "m":
          setView("month");
          break;
        case "w":
          setView("week");
          break;
        case "d":
          setView("day");
          break;
        case "a":
          setView("agenda");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEventDialogOpen]);

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (view === "agenda") {
      // For agenda view, go back 30 days (a full month)
      setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "agenda") {
      // For agenda view, go forward 30 days (a full month)
      setCurrentDate(addDays(currentDate, AgendaDaysToShow));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventSelect = (event: CalendarEvent) => {
        const handled = onEventSelect?.(event);
    if (handled !== false) {
      return;
    }
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventCreate = (startTime: Date) => {
    
    if (onCreateClick) {
      onCreateClick(startTime);
      return;
    }

    // Snap to 15-minute intervals
    const minutes = startTime.getMinutes();
    const remainder = minutes % 15;
    if (remainder !== 0) {
      if (remainder < 7.5) {
        // Round down to nearest 15 min
        startTime.setMinutes(minutes - remainder);
      } else {
        // Round up to nearest 15 min
        startTime.setMinutes(minutes + (15 - remainder));
      }
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    const newEvent: CalendarEvent = {
      allDay: false,
      end: addHoursToDate(startTime, 1),
      id: "",
      start: startTime,
      title: "",
    };
    setSelectedEvent(newEvent);
    setIsEventDialogOpen(true);
  };

  const handleEventSave = (event: CalendarEvent) => {
    if (event.id) {
      onEventUpdate?.(event);
      // Show toast notification when an event is updated
      toast(`Đã cập nhật "${event.title}"`, {
        description: format(new Date(event.start), "d/M/yyyy"),
      });
    } else {
      onEventAdd?.({
        ...event,
        id: Math.random().toString(36).substring(2, 11),
      });
      // Show toast notification when an event is added
      toast(`Đã thêm "${event.title}"`, {
        description: format(new Date(event.start), "d/M/yyyy"),
      });
    }
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleEventDelete = (eventId: string) => {
    const deletedEvent = events.find((e) => e.id === eventId);
    onEventDelete?.(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);

    // Show toast notification when an event is deleted
    if (deletedEvent) {
      toast(`Đã xoá "${deletedEvent.title}"`, {
        description: format(new Date(deletedEvent.start), "d/M/yyyy"),
      });
    }
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    const handled = onEventUpdate?.(updatedEvent);
    if (handled === false) {
      return;
    }

    // Show toast notification when an event is updated via drag and drop
    const listLabel = updatedEvent.location || "danh sách";
    toast(
      `Đã dời "${updatedEvent.title}" (${listLabel}) sang ${format(
        new Date(updatedEvent.start),
        "d/M/yyyy",
      )}`,
      { className: "text-base" },
    );
  };

  const viewTitle = useMemo(() => {
    if (view === "month") {
      return format(currentDate, "'Tháng' M, yyyy");
    }
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (isSameMonth(start, end)) {
        return format(start, "'Tháng' M, yyyy");
      }
      return `${format(start, "d/M")} – ${format(end, "d/M/yyyy")}`;
    }
    if (view === "day") {
      return (
        <>
          <span aria-hidden="true" className="min-[480px]:hidden">
            {format(currentDate, "d/M/yyyy")}
          </span>
          <span aria-hidden="true" className="max-[479px]:hidden min-md:hidden">
            {format(currentDate, "d 'tháng' M, yyyy")}
          </span>
          <span className="max-md:hidden">
            {format(currentDate, "EEEE, d 'tháng' M, yyyy")}
          </span>
        </>
      );
    }
    if (view === "agenda") {
      // Show the month range for agenda view
      const start = currentDate;
      const end = addDays(currentDate, AgendaDaysToShow - 1);

      if (isSameMonth(start, end)) {
        return format(start, "'Tháng' M, yyyy");
      }
      return `${format(start, "d/M")} – ${format(end, "d/M/yyyy")}`;
    }
    return format(currentDate, "'Tháng' M, yyyy");
  }, [currentDate, view]);

  return (
    <div
      className="flex flex-col rounded-lg border has-data-[slot=month-view]:flex-1"
      style={
        {
          "--event-gap": `${EventGap}px`,
          "--event-height": `${EventHeight}px`,
          "--week-cells-height": `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      <CalendarDndProvider onEventUpdate={handleEventUpdate}>
        <div
          className={cn(
            "flex items-center justify-between p-2 sm:p-4",
            className,
          )}
        >
          <div className="flex gap-1 items-center sm:gap-4">
            <Button
              className="max-[479px]:aspect-square max-[479px]:p-0!"
              onClick={handleToday}
              variant="outline"
            >
              <RiCalendarCheckLine
                aria-hidden="true"
                className="min-[480px]:hidden"
                size={16}
              />
              <span className="max-[479px]:sr-only">Hôm nay</span>
            </Button>
            <div className="flex items-center sm:gap-2">
              <Button
                aria-label="Trước"
                onClick={handlePrevious}
                size="icon"
                variant="ghost"
              >
                <ChevronLeftIcon aria-hidden="true" size={16} />
              </Button>
              <Button
                aria-label="Sau"
                onClick={handleNext}
                size="icon"
                variant="ghost"
              >
                <ChevronRightIcon aria-hidden="true" size={16} />
              </Button>
            </div>
            <h2 className="text-sm font-semibold sm:text-lg md:text-xl">
              {viewTitle}
            </h2>
          </div>
          <div className="flex gap-2 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-1.5 max-[479px]:h-8" variant="outline">
                  <span>
                    {VIEW_LABEL[view]}
                  </span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="opacity-60 -me-1"
                    size={16}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-32">
                <DropdownMenuItem onClick={() => setView("month")}>
                  Tháng <DropdownMenuShortcut>M</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("week")}>
                  Tuần <DropdownMenuShortcut>W</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("day")}>
                  Ngày <DropdownMenuShortcut>D</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("agenda")}>
                  Lịch trình <DropdownMenuShortcut>A</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              className="max-[479px]:aspect-square max-[479px]:p-0!"
              onClick={() => {
                if (onCreateClick) {
                  onCreateClick();
                  return;
                }
                setSelectedEvent(null); // Ensure we're creating a new event
                setIsEventDialogOpen(true);
              }}
              size="sm"
            >
              <PlusIcon
                aria-hidden="true"
                className="opacity-60 sm:-ms-1"
                size={16}
              />
              <span className="max-sm:sr-only">
                {createLabel || "Thêm task"}
              </span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col flex-1">
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventCreate={handleEventCreate}
              onEventSelect={handleEventSelect}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
            />
          )}
        </div>

        <EventDialog
          event={selectedEvent}
          isOpen={isEventDialogOpen}
          onClose={() => {
            setIsEventDialogOpen(false);
            setSelectedEvent(null);
          }}
          onDelete={handleEventDelete}
          onSave={handleEventSave}
          boardId={boardId}
          lists={lists}
        />
      </CalendarDndProvider>
    </div>
  );
}
