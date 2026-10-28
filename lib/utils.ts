import type { Conference, DeadlineKey } from "@/types/conference";
import { DEADLINE_LABELS } from "@/lib/labels";

export function formatDate(date: string | null | undefined): string {
  if (!date) {
    return "Tarih belirsiz";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Tarih belirsiz";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getDaysUntil(date: string | null | undefined): number {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const target = new Date(date);
  const today = getTodayStart();
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDeadlineEntries(conference: Conference) {
  const entries: Array<{ key: DeadlineKey; label: string; value: string }> = [];

  (Object.keys(DEADLINE_LABELS) as DeadlineKey[]).forEach((key) => {
    const value = conference.deadlines[key];
    if (value) {
      entries.push({ key, label: DEADLINE_LABELS[key], value });
    }
  });

  return entries.sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());
}

export function getUpcomingDeadlineEntries(conference: Conference) {
  return getDeadlineEntries(conference).filter((entry) => getDaysUntil(entry.value) >= 0);
}

export function getNearestDeadline(conference: Conference) {
  const entries = getUpcomingDeadlineEntries(conference);
  if (!entries.length) {
    const expiredEntries = getDeadlineEntries(conference);
    const lastExpired = expiredEntries[expiredEntries.length - 1];
    if (!lastExpired) {
      return null;
    }

    return {
      ...lastExpired,
      label: lastExpired.label,
      daysLeft: 0,
      tone: "expired" as const,
      expired: true,
    };
  }

  const nearest = entries[0];
  const daysLeft = getDaysUntil(nearest.value);

  if (daysLeft <= 14) {
    return { ...nearest, daysLeft, tone: "danger" as const, expired: false };
  }

  if (daysLeft <= 30) {
    return { ...nearest, daysLeft, tone: "warning" as const, expired: false };
  }

  return { ...nearest, daysLeft, tone: "neutral" as const, expired: false };
}

export function getModeStyles(mode: Conference["mode"]): string {
  if (mode === "online") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (mode === "hybrid") return "bg-violet-100 text-violet-700 ring-violet-200";
  return "bg-sky-100 text-sky-700 ring-sky-200";
}

export function buildIcsContent(conference: Conference, deadlineKey?: DeadlineKey): string {
  const entry = deadlineKey ? conference.deadlines[deadlineKey] : getNearestDeadline(conference)?.value;
  if (!entry) {
    return "";
  }

  const start = new Date(entry);
  const ymd = (value: Date) =>
    value
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const title = `${conference.acronym || conference.name} - ${deadlineKey ? "Deadline" : "Konferans"}`;
  const description = `Konferans takibi: ${conference.name}. ${conference.description}`.replace(/\n/g, " ");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Biomedical Conference Radar//TR//",
    "BEGIN:VEVENT",
    `UID:${conference.id}-${deadlineKey ?? "nearest"}@conference-radar.local`,
    `DTSTAMP:${ymd(new Date())}`,
    `DTSTART:${ymd(start)}`,
    `DTEND:${ymd(new Date(start.getTime() + 60 * 60 * 1000))}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `URL:${conference.officialUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadConferenceIcs(conference: Conference, deadlineKey?: DeadlineKey) {
  const content = buildIcsContent(conference, deadlineKey);
  if (!content) {
    return;
  }

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${conference.id}-${deadlineKey ?? "deadline"}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}
