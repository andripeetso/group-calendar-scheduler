import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { CalendarIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { et } from "date-fns/locale";

interface CalendarProps {
  month: Date;
  selectedDates: Date[];
  onDateSelect: (date: Date) => void;
}

export function Calendar({
  month,
  selectedDates,
  onDateSelect,
}: CalendarProps) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  // Get the days needed from the previous month to fill the first week
  const firstDayOfMonth = (start.getDay() + 6) % 7;
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() - (firstDayOfMonth - i));
    return date;
  });

  const currentMonthDays = eachDayOfInterval({ start, end });
  const days = [...prevMonthDays, ...currentMonthDays];
  const today = startOfDay(new Date());

  const isSelected = (date: Date) =>
    selectedDates.some(
      (selectedDate) =>
        format(selectedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    days.forEach((day) => {
      if (
        isSameMonth(day, month) &&
        !isBefore(day, today) &&
        !isSelected(day)
      ) {
        onDateSelect(day);
      }
    });
  };

  const handleDateClick = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    onDateSelect(date);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {format(month, "MMMM", { locale: et })} {format(month, "yyyy")}
        </h2>
        <Button
          type="button"
          onClick={handleSelectAll}
          variant="ghost"
          size="sm"
          className="text-yellow-500 hover:text-yellow-400 hover:bg-transparent"
        >
          <CheckIcon className="w-4 h-4 mr-1" />
          Vali kõik
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["E", "T", "K", "N", "R", "L", "P"].map((day, index) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {["E", "T", "K", "N", "R", "L", "P"][index]}
          </div>
        ))}
        {days.map((day) => {
          const isPastDate = isBefore(day, today);
          return (
            <Button
              key={day.toString()}
              type="button"
              onClick={(e) => handleDateClick(e, day)}
              disabled={!isSameMonth(day, month) || isPastDate}
              variant="ghost"
              size="sm"
              className={cn(
                "p-2 text-sm rounded-full transition-colors",
                !isSameMonth(day, month) || isPastDate
                  ? "text-gray-700 cursor-not-allowed"
                  : "hover:bg-gray-700 text-gray-300",
                isSelected(day) &&
                  isSameMonth(day, month) &&
                  "bg-yellow-500 text-gray-900 hover:bg-yellow-400",
                isToday(day) && "border border-yellow-500"
              )}
            >
              {format(day, "d")}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
