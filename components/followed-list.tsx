"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getDeadlineEntries, getNearestDeadline } from "@/lib/utils";
import type { Conference } from "@/types/conference";

const FOLLOWED_KEY = "bmed-followed-conferences";

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function FollowedList({ conferences }: { conferences: Conference[] }) {
  const [currentDate] = useState<Date | null>(() => (typeof window === "undefined" ? null : new Date()));
  const [isReady, setIsReady] = useState(false);
  const [followedIds, setFollowedIds] = useState<string[]>(() => {
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

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FOLLOWED_KEY, JSON.stringify(followedIds));
    }
  }, [followedIds]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        return;
      }

      supabase
        .from("followed_conferences")
        .select("conference_id")
        .eq("user_id", data.user.id)
        .then(({ data: rows, error }) => {
          if (!error) {
            const nextIds = (rows ?? []).map((row) => String(row.conference_id));
            setFollowedIds(nextIds);
          }
        });
    });
  }, []);

  const followedConferences = useMemo(
    () => conferences.filter((conference) => followedIds.includes(conference.id)),
    [conferences, followedIds],
  );

  const sortableConferences = useMemo(
    () =>
      followedConferences
        .map((conference) => {
          const nearestDeadline = getNearestDeadline(conference);
          return {
            conference,
            nearestDeadline,
            daysLeft: nearestDeadline?.daysLeft ?? Number.POSITIVE_INFINITY,
          };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [followedConferences],
  );

  const monthlyDeadlines = useMemo(() => {
    if (!currentDate) {
      return 0;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return followedConferences.reduce((count, conference) => {
      return count + getDeadlineEntries(conference).filter((entry) => {
        const date = new Date(entry.value);
        return date.getFullYear() === year && date.getMonth() === month;
      }).length;
    }, 0);
  }, [currentDate, followedConferences]);

  const toggleFollow = async (id: string) => {
    const supabase = createClient();
    if (!supabase) {
      setFollowedIds((current) => current.filter((item) => item !== id));
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return;
    }

    await supabase.from("followed_conferences").delete().eq("user_id", userData.user.id).eq("conference_id", id);
    setFollowedIds((current) => current.filter((item) => item !== id));
  };

  const exportFollowedToCalendar = () => {
    if (!sortableConferences.length) {
      return;
    }

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Biomedical Conference Radar//TR//",
    ];

    sortableConferences.forEach(({ conference, nearestDeadline }) => {
      const target = nearestDeadline?.value ?? conference.startDate;
      if (!target) {
        return;
      }

      const start = new Date(target);
      const startValue = start
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");

      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const endValue = end
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");

      lines.push(
        "BEGIN:VEVENT",
        `UID:${conference.id}-${nearestDeadline ? "deadline" : "start"}@conference-radar.local`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
        `DTSTART:${startValue}`,
        `DTEND:${endValue}`,
        `SUMMARY:${escapeIcsText(`${conference.acronym || conference.name} deadline`)}`,
        `DESCRIPTION:${escapeIcsText(`${conference.name} için ${nearestDeadline?.label ?? "deadline"} tarihi`)}`,
        `URL:${escapeIcsText(conference.officialUrl)}`,
        "END:VEVENT",
      );
    });

    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "takip-edilen-konferanslar.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-slate-900 dark:text-slate-100 md:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Takip</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Takip ettiklerim</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" aria-label="Takip edilen konferansları takvime ekle" onClick={exportFollowedToCalendar} disabled={!sortableConferences.length}>
                Takvime ekle
              </Button>
              <Link href="/" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-transparent px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Ana sayfa
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Toplam</p>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{followedConferences.length}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">takip edilen konferans</p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Bu ay</p>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{monthlyDeadlines}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">deadline</p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">En yakın</p>
            <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
              {sortableConferences[0]?.nearestDeadline ? `${sortableConferences[0].nearestDeadline.daysLeft} gün` : "Belirsiz"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">önümüzdeki adım</p>
          </div>
        </section>

        {!isReady ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`follow-skeleton-${index}`} className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
                <div className="skeleton h-4 w-24 rounded-full" />
                <div className="mt-4 skeleton h-6 w-3/4 rounded-xl" />
                <div className="mt-3 skeleton h-4 w-1/2 rounded-xl" />
                <div className="mt-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="skeleton h-24 rounded-2xl" />
                  <div className="skeleton h-24 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : followedConferences.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-soft dark:border-slate-700 dark:bg-slate-900/80">
            <div className="mx-auto max-w-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Takip listesi boş</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Henüz takip edilen konferans yok.</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">İlgili etkinlikleri ekleyerek yaklaşan deadline’ları takip etmeye başlayabilirsin.</p>
              <Link href="/" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition hover:bg-brand-500">
                Konferansları keşfet
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortableConferences.map(({ conference, nearestDeadline, daysLeft }) => (
              <article key={conference.id} className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">{conference.acronym || "Konferans"}</span>
                      <Badge tone={conference.trustLevel === "verified" ? "success" : conference.trustLevel === "suspicious" ? "danger" : "warning"}>{conference.trustLevel}</Badge>
                    </div>

                    <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{conference.name}</h2>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span>{conference.city}, {conference.country}</span>
                      <span>•</span>
                      <span>{conference.startDate ? formatDate(conference.startDate) : "Tarih yok"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch gap-2 lg:min-w-[170px]">
                    <Button variant="secondary" size="sm" onClick={() => toggleFollow(conference.id)}>
                      Takipten çıkar
                    </Button>
                    <Link href={`/conference/${conference.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-transparent px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                      Detay
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Önümüzdeki adım</p>
                      <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {nearestDeadline ? nearestDeadline.label : "Deadline yok"}
                      </span>
                    </div>

                    <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                      {nearestDeadline ? `Özet: ${daysLeft} gün kaldı` : "Özet: tarih yok"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {nearestDeadline ? `${nearestDeadline.label} - ${formatDate(nearestDeadline.value)}` : "Bu konferans için deadline bilgisi henüz eklenmemiş."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sonraki deadline</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{nearestDeadline ? nearestDeadline.label : "Belirsiz"}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {nearestDeadline ? `${formatDate(nearestDeadline.value)} • ${daysLeft} gün kaldı` : "Deadline bilgisi yok"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
