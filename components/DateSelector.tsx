"use client";
import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { isSameDay, isBetween, isBeforeDay, addDays } from "@/lib/utils";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DateSelectorProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onChange: (checkIn: Date | null, checkOut: Date | null) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // Returns 0=Mon … 6=Sun
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

interface CalendarMonthProps {
  year: number;
  month: number;
  checkIn: Date | null;
  checkOut: Date | null;
  hoverDate: Date | null;
  today: Date;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date | null) => void;
}

function CalendarMonth({
  year, month, checkIn, checkOut, hoverDate, today, onDayClick, onDayHover,
}: CalendarMonthProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const rangeEnd = checkOut ?? hoverDate;

  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-lynra-obsidian text-center mb-3 font-body">
        {MONTHS[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-y-0.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-lynra-haze font-medium py-1 font-body">
            {d}
          </div>
        ))}
        {cells.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} />;
          }

          const isPast = isBeforeDay(date, today);
          const isStart = checkIn ? isSameDay(date, checkIn) : false;
          const isEnd = checkOut ? isSameDay(date, checkOut) : false;
          const isInRange =
            checkIn && rangeEnd && !isSameDay(checkIn, date) && !isSameDay(rangeEnd, date)
              ? isBetween(date, checkIn, rangeEnd)
              : false;

          let cellClass =
            "relative flex items-center justify-center h-8 text-sm font-body cursor-pointer select-none transition-colors duration-100 ";

          if (isPast) {
            cellClass += "text-lynra-aluminium cursor-not-allowed ";
          } else if (isStart || isEnd) {
            cellClass += "bg-lynra-ember text-lynra-white rounded-lg font-semibold ";
          } else if (isInRange) {
            cellClass += "bg-lynra-ember/10 text-lynra-obsidian ";
          } else {
            cellClass += "text-lynra-obsidian hover:bg-lynra-ash rounded-lg ";
          }

          return (
            <div
              key={date.toISOString()}
              className={cellClass}
              onClick={() => !isPast && onDayClick(date)}
              onMouseEnter={() => !isPast && onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DateSelector({ checkIn, checkOut, onChange }: DateSelectorProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  function handlePrev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNext() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayClick(date: Date) {
    if (!checkIn || (!selectingEnd && checkOut)) {
      // Start fresh selection
      onChange(date, null);
      setSelectingEnd(true);
    } else if (selectingEnd) {
      if (isBeforeDay(date, checkIn) || isSameDay(date, checkIn)) {
        // Clicked before start — reset
        onChange(date, null);
        setSelectingEnd(true);
      } else {
        onChange(checkIn, date);
        setSelectingEnd(false);
      }
    }
  }

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div className="bg-lynra-white rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className="p-1.5 rounded-lg hover:bg-lynra-ash transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <CaretLeft size={16} weight="light" className="text-lynra-granite" />
        </button>
        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg hover:bg-lynra-ash transition-colors"
          aria-label="Next month"
        >
          <CaretRight size={16} weight="light" className="text-lynra-granite" />
        </button>
      </div>

      <div className="flex gap-6">
        <CalendarMonth
          year={viewYear}
          month={viewMonth}
          checkIn={checkIn}
          checkOut={checkOut}
          hoverDate={selectingEnd ? hoverDate : null}
          today={today}
          onDayClick={handleDayClick}
          onDayHover={setHoverDate}
        />
        <div className="hidden md:block w-px bg-lynra-aluminium self-stretch" />
        <CalendarMonth
          year={nextYear}
          month={nextMonth}
          checkIn={checkIn}
          checkOut={checkOut}
          hoverDate={selectingEnd ? hoverDate : null}
          today={today}
          onDayClick={handleDayClick}
          onDayHover={setHoverDate}
        />
      </div>

      {checkIn && !checkOut && (
        <p className="text-xs text-lynra-haze text-center mt-3 font-body">
          Select a check-out date
        </p>
      )}
    </div>
  );
}
