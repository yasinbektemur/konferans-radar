"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Conference } from "@/types/conference";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getDeadlineEntries, getDaysUntil } from "@/lib/utils";

const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const FOLLOWED_KEY = "bmed-followed-conferences";

function toDateKey(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function isSameDay(date: Date, target: Date) {
  return toDateKey(date) === toDateKey(target);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getLocalDateFromValue(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getCalendarEvents(conferences: Conference[], date: Date) {
  const entries: Array<{
    id: string;
    kind: "conference" | "deadline";
    title: string;
    subtitle: string;
    tone: string;
    icon: string;
    conference: Conference;
  }> = [];

  conferences.forEach((conference) => {
    const conferenceStart = getLocalDateFromValue(conference.startDate);
    const conferenceEnd = getLocalDateFromValue(conference.endDate);

    if (conferenceStart && conferenceEnd && date >= conferenceStart && date <= conferenceEnd) {
      entries.push({
        id: `${conference.id}-conference`,
        kind: "conference",
        title: conference.acronym || conference.name,
        subtitle: "Konferans",
        tone: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
        icon: "●",
        conference,
      });
    }

    getDeadlineEntries(conference).forEach((entry) => {
      const deadlineDate = getLocalDateFromValue(entry.value);
      if (deadlineDate && isSameDay(date, deadlineDate)) {
        const tone =
          entry.key === "abstract"
            ? "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800"
            : entry.key === "notification"
              ? "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800"
              : "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800";

        entries.push({
          id: `${conference.id}-${entry.key}`,
          kind: "deadline",
          title: entry.label,
          subtitle: conference.acronym || conference.name,
          tone,
          icon: "◉",
          conference,
        });
      }
    });
  });

  return entries.slice(0, 4);
}

const today = new Date();

export function MonthlyCalendar({ conferences }: { conferences: Conference[] }) {
  const [visibleMonth, setVisibleMonth] = useState<Date>(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);
  const [followedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const saved = window.localStorage.getItem(FOLLOWED_KEY);
    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved) as string[];
    } catch {
      return [];
    }
  });

  const calendar = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - ((monthStart.getDay() + 6) % 7));

    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      cells.push({ date, inMonth: date.getMonth() === month });
    }

    return { monthStart, cells };
  }, [visibleMonth]);

  const filteredConferences = useMemo(() => {
    if (!showFollowedOnly) {
      return conferences;
    }

    return conferences.filter((conference) => followedIds.includes(conference.id));
  }, [conferences, followedIds, showFollowedOnly]);

  const selectedEvents = useMemo(
    () => getCalendarEvents(filteredConferences, selectedDate),
    [filteredConferences, selectedDate],
  );

  const monthLabel = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(visibleMonth);

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 md:p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Takvim</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{monthLabel}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" aria-label="Bugün için görünümü sıfırla" onClick={() => setVisibleMonth(startOfMonth(today))}>
            Bugün
          </Button>
          <Button type="button" variant="secondary" size="sm" aria-label="Önceki aya git" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}>
            Önceki
          </Button>
          <Button type="button" variant="secondary" size="sm" aria-label="Sonraki aya git" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}>
            Sonraki
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sadece takip ettiklerim</p>
        </div>
        <button
          type="button"
          aria-label="Takip edilenleri göster"
          onClick={() => setShowFollowedOnly((current) => !current)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${showFollowedOnly ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white transition ${showFollowedOnly ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div>
          <div className="mb-3 hidden grid-cols-7 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 md:grid">
            {dayNames.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid gap-2 md:grid-cols-7">
            {calendar.cells.map(({ date, inMonth }) => {
              const dayEvents = getCalendarEvents(filteredConferences, date);
              const isToday = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDate);

              return (
                <button
                  key={toDateKey(date)}
                  type="button"
                  aria-label={`${new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(date)} için etkinlikler`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[120px] rounded-2xl border p-2 text-left transition ${
                    inMonth
                      ? "border-slate-200 bg-slate-50/80 hover:border-brand-200 hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-brand-800 dark:hover:bg-slate-800"
                      : "border-slate-100 bg-slate-100/50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-500"
                  } ${isToday ? "ring-2 ring-brand-300 dark:ring-brand-700" : ""} ${isSelected ? "border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/20" : ""}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold ${isToday ? "text-brand-700 dark:text-brand-300" : "text-slate-700 dark:text-slate-200"}`}>
                      {date.getDate()}
                    </span>
                    {dayEvents.some((event) => event.kind === "deadline") && <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-label="deadline" />}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span key={event.id} className={`inline-flex w-full max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${event.tone}`}>
                        <span>{event.icon}</span>
                        <span className="truncate">{event.title}</span>
                      </span>
                    ))}
                  </div>

                  {dayEvents.length === 0 && <div className="mt-3 text-[10px] opacity-60">-</div>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-800/80">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Etkinlikler</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(selectedDate)}</h3>
            </div>
            <Badge tone="default">{selectedEvents.length}</Badge>
          </div>

          <div className="space-y-3">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => {
                const nearest = getDaysUntil(event.conference.startDate);
                return (
                  <Link
                    key={event.id}
                    href={`/conference/${event.conference.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-700 dark:hover:bg-brand-950/30"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${event.tone}`}>
                        <span>{event.icon}</span>
                        {event.kind === "conference" ? "Konferans" : "Deadline"}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{event.conference.type}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.subtitle}</p>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <p>{event.kind === "conference" ? `${formatDate(event.conference.startDate)} - ${formatDate(event.conference.endDate)}` : `Kalan: ${nearest >= 0 ? `${nearest} gün` : `${Math.abs(nearest)} gün geçti`}`}</p>
                      <p>{event.conference.city}, {event.conference.country}</p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Bu günde etkinlik bulunmuyor.
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" /> Konferans</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-sky-400" /> Abstract</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400" /> Notification</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-400" /> Diğer deadline</span>
      </div>
    </section>
  );
}
