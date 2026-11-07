import { isSameDay, addHours } from "date-fns";

import type { CalendarEvent, EventColor, Label, Member } from "@/components/event-calendar";
import type { Card, RecurrenceType } from "@/types/card";
import { generateRecurringInstances, getCalendarRange } from "@/lib/recurring-calendar-utils";
import { listDisplayName } from "@/features/tasks/api";

function getEventStartEnd(dueDate: Date): { start: Date; end: Date } {
  // If due date is exactly midnight, keep event on the same day.
  if (
    dueDate.getHours() === 0 &&
    dueDate.getMinutes() === 0 &&
    dueDate.getSeconds() === 0 &&
    dueDate.getMilliseconds() === 0
  ) {
    return { start: dueDate, end: addHours(dueDate, 1) };
  }

  return { start: addHours(dueDate, -1), end: dueDate };
}

/**
 * API card type - what the backend actually returns
 * Different from frontend Card type (uses 'name' instead of 'title', 'deadline' instead of 'dueDate')
 */
type ApiCard = {
  id: string;
  name: string;
  description?: string | null;
  deadline?: Date | string | null;
  dueAt?: Date | string | null;
  startDate?: Date | string | null;
  dueComplete?: boolean | null;
  completed?: boolean | null;
  recurrence?: RecurrenceType;
  recurrenceDay?: number;
  recurrenceWeekday?: number;
  repeatFrequency?: Card["repeatFrequency"] | null;
  repeatInterval?: number | null;
  labels?: Array<{ color?: string }> | null;
};

/**
 * Accept both frontend Card and backend ApiCard
 */
type CardInput = Card | ApiCard;

/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor | string): string {
  const eventColor = color || "sky";

  switch (eventColor) {
    case "sky":
      return "bg-muted hover:bg-accent text-foreground ring-1 ring-inset ring-rule";
    case "amber":
      return "bg-status-doing-soft hover:brightness-[0.97] text-foreground ring-1 ring-inset ring-status-doing/40";
    case "violet":
      return "bg-transparent hover:bg-muted/50 text-muted-foreground";
    case "rose":
      // Quá hạn: nền đỏ nhạt, chữ mực đỏ đậm, một mép đỏ 3px. Chữ đỏ tươi in
      // đậm trên hàng chục chip biến cả tháng thành màu đỏ.
      return "bg-red-ink/10 hover:bg-red-ink/16 text-overdue-ink border-l-[3px] border-red-ink";
    case "emerald":
      return "bg-transparent hover:bg-muted/50 text-muted-foreground";
    case "orange":
      return "bg-status-doing-soft hover:brightness-[0.97] text-foreground";
    default:
      return "bg-muted hover:bg-accent text-foreground ring-1 ring-inset ring-rule";
  }
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(
  isFirstDay: boolean,
  isLastDay: boolean,
): string {
  if (isFirstDay && isLastDay) {
    return "rounded"; // Both ends rounded
  }
  if (isFirstDay) {
    return "rounded-l rounded-r-none"; // Only left end rounded
  }
  if (isLastDay) {
    return "rounded-r rounded-l-none"; // Only right end rounded
  }
  return "rounded-none"; // No rounded corners
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return event.allDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}


/**
 * Convert a Card to a CalendarEvent
 * 
 * Only cards with dueDate/deadline will be converted to events. The event will be created
 * with a 1-hour duration ending at the card's due date.
 * 
 * Works with both frontend Card type (title, dueDate) and backend API response (name, deadline).
 * 
 * @param card - The card to convert (Card or API response format)
 * @param listName - Optional list name to include in event location
 * @param listId - Optional list ID
 * @returns CalendarEvent if card has a due date, null otherwise
 * 
 * @example
 * const card = {
 *   id: "card-1",
 *   title: "Complete docs",
 *   dueDate: new Date("2026-01-10T15:00:00"),
 *   labels: [{ color: "red", name: "Urgent" }],
 * };
 * 
 * const event = cardToCalendarEvent(card, "To Do", "list-1");
 * // Returns:
 * // {
 * //   id: "card-1",
 * //   title: "Complete docs",
 * //   start: Date("2026-01-10T14:00:00"), // 1 hour before
 * //   end: Date("2026-01-10T15:00:00"),
 * //   color: "rose",
 * //   location: "To Do",
 * //   listId: "list-1",
 * //   labels: [{ color: "red", name: "Urgent" }],
 * // }
 */
export function cardToCalendarEvent(card: CardInput, listName?: string, listId?: string): CalendarEvent | null {
  // Handle 'dueAt' (backend) first, then 'dueDate' (frontend), then 'deadline' (backend)
  const dueDateValue =
    ('dueAt' in card && card.dueAt) ||
    ('dueDate' in card && card.dueDate) ||
    ('deadline' in card && card.deadline);
  const startDateValue = ('startDate' in card && card.startDate) || null;

  if (!dueDateValue && !startDateValue) {
    return null; // Only cards with due dates or start dates should appear in calendar
  }

  // Convert to Date if it's a string
  const dueDate = dueDateValue
    ? (typeof dueDateValue === 'string' ? new Date(dueDateValue) : dueDateValue)
    : null;
  const startDate = startDateValue
    ? (typeof startDateValue === 'string' ? new Date(startDateValue) : startDateValue)
    : null;
  
  // Handle both 'name' (backend) and 'title' (frontend) fields
  const title = ('title' in card && card.title) || ('name' in card && card.name) || "Untitled";
  
  // Màu chip nói TRẠNG THÁI, không nói nhãn. Màu nhãn là danh tính, đặt nó lên
  // chip thì cả tháng thành bảy màu và không màu nào còn báo điều gì cần làm.
  // Chỉ việc quá hạn mới có màu; còn lại là chip trung tính.
  const isOverdueCard = !!dueDate && dueDate.getTime() < Date.now();

  const { start, end } = dueDate
    ? getEventStartEnd(dueDate)
    : { start: startDate!, end: addHours(startDate!, 1) };
  
  // Get description - handle null/undefined
  const description = 'description' in card ? card.description : undefined;
  
  // Get labels and members from card
  const labels = 'labels' in card ? card.labels : undefined;
  const members = 'members' in card ? card.members : undefined;
  const isDone =
    ('dueComplete' in card && card.dueComplete) ||
    ('completed' in card && card.completed) ||
    false;
  const repeatFrequency =
    ('repeatFrequency' in card && card.repeatFrequency) ||
    ('recurrence' in card && card.recurrence ? "weekly" : null);
  const repeatInterval =
    ('repeatInterval' in card && card.repeatInterval) || null;
  
  return {
    id: card.id,
    title: title,
    description: description ?? undefined,
    start: start,
    end: end,
    allDay: false,
    color: isOverdueCard && !isDone ? "rose" : "sky",
    location: listName, // Use list name as location
    listId: listId || ('listId' in card ? card.listId : undefined),
    startDate: startDate ?? undefined,
    dueAt: dueDate ?? undefined,
    labels: labels as unknown as Label[] | undefined,
    members: members as unknown as Member[] | undefined,
    repeatFrequency: repeatFrequency ?? undefined,
    repeatInterval: repeatInterval ?? undefined,
    isDone,
  };
}

/**
 * Convert multiple Cards to CalendarEvents
 * Filters out cards without due dates
 * @param cards - Array of cards (frontend Card or backend ApiCard)
 * @param listName - Optional list name to include in event location
 * @param listId - Optional list ID
 */
export function cardsToCalendarEvents(cards: CardInput[], listName?: string, listId?: string): CalendarEvent[] {
  return cards
    .map((card) => cardToCalendarEvent(card, listName, listId))
    .filter((event): event is CalendarEvent => event !== null);
}

/**
 * Convert all cards from multiple lists to calendar events
 * @param lists - Array of lists containing cards
 * @param viewDate - Current calendar view date (for determining range)
 * @param viewType - Calendar view type (month/week/day/agenda)
 * @returns Array of calendar events with list names as locations, including recurring instances
 */
export function listsCardsToCalendarEvents(
  lists: Array<{ id: string; name?: string; title?: string; cards: CardInput[] }>,
  viewDate?: Date,
  viewType?: "month" | "week" | "day" | "agenda"
): CalendarEvent[] {
  const allEvents: CalendarEvent[] = [];
  
  // Determine the date range for generating recurring events
  const range = viewDate && viewType 
    ? getCalendarRange(viewDate, viewType)
    : { start: new Date(), end: addHours(new Date(), 24 * 90) }; // Default 90 days
  
  for (const list of lists) {
    const listName = listDisplayName(list.name || list.title || "Danh sách không tên");
    
    for (const card of list.cards) {
      // Get the recurrence info from the card
      const recurrence = 'recurrence' in card ? card.recurrence : undefined;
      const recurrenceDay = 'recurrenceDay' in card ? card.recurrenceDay : undefined;
      const recurrenceWeekday = 'recurrenceWeekday' in card ? card.recurrenceWeekday : undefined;
      
      const baseEvent = cardToCalendarEvent(card, listName, list.id);
      
      if (!baseEvent) continue;
      
      // If card has recurrence, generate instances
      if (recurrence && recurrence !== "never") {
        const instances = generateRecurringInstances(
          baseEvent.end, // Use end date (which is the due date)
          recurrence,
          recurrenceDay,
          recurrenceWeekday,
          range.start,
          range.end
        );
        
        // Create an event for each instance
        instances.forEach((instance, index) => {
          const { start: eventStart, end: eventEnd } = getEventStartEnd(instance.instanceDate);
          
          allEvents.push({
            ...baseEvent,
            id: instance.isOriginal ? baseEvent.id : `${baseEvent.id}-recurring-${index}`,
            start: eventStart,
            end: eventEnd,
            title: instance.isOriginal ? baseEvent.title : `${baseEvent.title}`,
            isRecurring: true,
            isRecurringInstance: !instance.isOriginal,
          });
        });
      } else {
        // Non-recurring event, add as is
        allEvents.push(baseEvent);
      }
    }
  }
  
  return allEvents;
}

