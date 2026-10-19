"use client";

import { useMemo, useState } from "react";
import type { Conference } from "@/types/conference";
import { formatDate, getDeadlineEntries } from "@/lib/utils";

const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function toDateKey(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function isSameDay(date: Date, target: Date) {
  return toDateKey(date) === toDateKey(target);
}

function getCellEvents(conferences: Conference[], date: Date) {
  const events: Array<{ id: string; kind: "conference" | "deadline"; label: string; tone: string; meta?: string }> = [];

  conferences.forEach((conference) => {
    const conferenceStart = conference.startDate ? new Date(conference.startDate) : null;
    const conferenceEnd = conference.endDate ? new Date(conference.endDate) : null;

    if (conferenceStart && conferenceEnd && date >= conferenceStart && date <= conferenceEnd) {
      events.push({
        id: `${conference.id}-conference`,
        kind: "conference",
        label: conference.acronym || conference.name,
        tone: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
        meta: "Konferans",
      });
    }

    getDeadlineEntries(conference).forEach((entry) => {
      const deadlineDate = new Date(entry.value);
      if (isSameDay(date, deadlineDate)) {
        events.push({
          id: `${conference.id}-${entry.key}`,
          kind: "deadline",
          label: entry.label,
          tone:
            entry.key === "abstract"
              ? "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800"
              : entry.key === "notification"
                ? "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800"
                : "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800",
          meta: "Deadline",
        });
      }
    });
  });

  return events.slice(0, 3);
}

const BASE_MONTH = new Date(2026, 0, 1);

export function MonthlyCalendar({ conferences }: { conferences: Conference[] }) {
  const [visibleMonth, setVisibleMonth] = useState<Date>(BASE_MONTH);

  const calendar = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - ((monthStart.getDay() + 6) % 7));

    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      cells.push({ date, inMonth: date.getMonth() === month });
    }

    return { monthStart, monthEnd, cells };
  }, [visibleMonth]);

  const monthLabel = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(visibleMonth);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Takvim</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Önceki
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth(BASE_MONTH)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Başlangıç
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Sonraki
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {dayNames.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendar.cells.map(({ date, inMonth }) => {
          const dayEvents = getCellEvents(conferences, date);
          const isToday = isSameDay(date, BASE_MONTH);

          return (
            <div
              key={toDateKey(date)}
              className={`min-h-[112px] rounded-xl border p-2 ${
                inMonth
                  ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70"
                  : "border-slate-100 bg-slate-100/70 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50"
              } ${isToday ? "ring-2 ring-sky-400" : ""}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{date.getDate()}</span>
                {dayEvents.some((event) => event.kind === "deadline") && (
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-label="deadline" />
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <span key={event.id} className={`inline-flex max-w-full rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${event.tone}`}>
                    {event.label.length > 12 ? `${event.label.slice(0, 12)}…` : event.label}
                  </span>
                ))}
              </div>

              {dayEvents.length === 0 && (
                <div className="mt-3 text-[10px] text-slate-300 dark:text-slate-600">-</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Konferans</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-sky-400" /> Abstract</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400" /> Notification</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-400" /> Diğer deadline</span>
      </div>

      <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        {calendar.monthStart && calendar.monthEnd ? (
          <p>
            {formatDate(toDateKey(calendar.monthStart) as unknown as string)} - {formatDate(toDateKey(calendar.monthEnd) as unknown as string)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
