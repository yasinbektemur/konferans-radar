"use client";

import Link from "next/link";
import type { Conference } from "@/types/conference";
import { formatDate, getNearestDeadline } from "@/lib/utils";

export function UpcomingDeadlinesTimeline({ conferences }: { conferences: Conference[] }) {
  const items = conferences
    .map((conference) => ({
      conference,
      deadline: getNearestDeadline(conference),
    }))
    .filter((item) => item.deadline)
    .sort((a, b) => (a.deadline!.daysLeft ?? 0) - (b.deadline!.daysLeft ?? 0))
    .slice(0, 6);

  if (!items.length) {
    return null;
  }

  return (
    <section className="mb-6 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-4 shadow-sm dark:border-sky-900 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Akış</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Yaklaşan deadline&apos;lar</h2>
        </div>
        <Link href="/takvim" className="text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">
          Takvime bak
        </Link>
      </div>

      <div className="relative space-y-4 before:absolute before:left-[12px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-sky-200 dark:before:bg-sky-800">
        {items.map(({ conference, deadline }) => {
          const toneClass =
            deadline!.tone === "danger"
              ? "bg-red-500"
              : deadline!.tone === "warning"
                ? "bg-amber-500"
                : "bg-emerald-500";

          return (
            <div key={conference.id} className="relative pl-8">
              <span className={`absolute left-0 top-1.5 inline-block h-6 w-6 rounded-full border-4 border-white ${toneClass} dark:border-slate-900`} aria-hidden="true" />
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{conference.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {deadline!.label} · {formatDate(deadline!.value)}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                    deadline!.tone === "danger"
                      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200"
                      : deadline!.tone === "warning"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                  }`}>
                    {deadline!.daysLeft <= 0 ? "Süre doldu" : `${deadline!.daysLeft} gün`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
