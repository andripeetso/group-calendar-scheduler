"use client";

import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
} from "date-fns";
import { CalendarIcon, CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResultsCalendarProps {
  month: Date;
  dateCounts: {
    date: string;
    _count: { date: number };
    voters: string[];
  }[];
}

export function ResultsCalendar({ month, dateCounts }: ResultsCalendarProps) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });

  const maxCount = Math.max(...dateCounts.map((d) => d._count.date ?? 0), 1);

  const getDateCount = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return dateCounts.find((d) => d.date === dateStr)?._count.date ?? 0;
  };

  const getOverlayColor = (count: number) => {
    if (count === 0) return "";
    const percentage = count / maxCount;

    if (percentage > 0.8) return "bg-green-500/50";
    if (percentage > 0.4) return "bg-blue-400/50";
    return "bg-blue-300/50";
  };

  const getVotersForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dateData = dateCounts.find((d) => d.date === dateStr);

    // Get all unique voters from all dates
    const allVoters = Array.from(new Set(dateCounts.flatMap((d) => d.voters)));

    // Get available voters for this date
    const availableVoters = dateData?.voters || [];

    // Get unavailable voters (voted but not available on this date)
    const unavailableVoters = allVoters.filter(
      (voter) => !availableVoters.includes(voter)
    );

    return {
      available: availableVoters.map((name) => ({ name, available: true })),
      unavailable: unavailableVoters.map((name) => ({
        name,
        available: false,
      })),
    };
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {format(month, "MMMM yyyy").replace(
            /^[A-Za-z]+/,
            (month) =>
              ({
                January: "Jaanuar",
                February: "Veebruar",
                March: "Märts",
                April: "Aprill",
                May: "Mai",
                June: "Juuni",
                July: "Juuli",
                August: "August",
                September: "September",
                October: "Oktoober",
                November: "November",
                December: "Detsember",
              }[month] || month)
          )}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["E", "T", "K", "N", "R", "L", "P"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
        {Array.from({ length: (start.getDay() + 6) % 7 }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const count = getDateCount(day);
          const overlayColor = getOverlayColor(count);
          const { available, unavailable } = getVotersForDay(day);

          return (
            <TooltipProvider key={day.toString()}>
              <Tooltip delayDuration={50}>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      relative aspect-square flex items-center justify-center
                      ${
                        !isSameMonth(day, month)
                          ? "text-gray-700"
                          : "text-gray-300"
                      }
                      ${count > 0 ? "bg-gray-700/50 rounded-lg" : ""}
                    `}
                  >
                    {count > 0 && (
                      <div
                        className={`absolute inset-0 rounded-lg ${overlayColor} transition-colors duration-200`}
                        style={{ opacity: count > 0 ? 0.5 : 0 }}
                      />
                    )}
                    <span
                      className={`relative z-10 text-sm ${
                        count === maxCount && count > 0
                          ? "text-yellow-300 font-bold"
                          : ""
                      } ${count > 0 ? "font-medium" : ""}`}
                    >
                      {format(day, "d")}
                      {count > 0 && (
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400">
                          {count}
                        </span>
                      )}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <div className="p-2">
                    <p className="font-medium mb-2">
                      {format(day, "d. MMMM yyyy")}
                    </p>
                    {count > 0 ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-400">
                          {count} {count === 1 ? "inimene" : "inimest"} saab
                          tulla
                        </p>
                        {available.map((voter) => (
                          <div
                            key={voter.name}
                            className="flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/20"
                          >
                            <span>{voter.name}</span>
                            <CheckIcon className="w-3 h-3" />
                          </div>
                        ))}
                        {unavailable.map((voter) => (
                          <div
                            key={voter.name}
                            className="flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/20"
                          >
                            <span>{voter.name}</span>
                            <Cross1Icon className="w-3 h-3" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Pole hääletanud kasutajaid
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
