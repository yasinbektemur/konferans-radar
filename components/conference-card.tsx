"use client";

import Link from "next/link";
import type { Conference } from "@/types/conference";
import { TrustBadge } from "@/components/trust-indicator";
import { downloadConferenceIcs, formatDate, getModeStyles, getNearestDeadline } from "@/lib/utils";

interface ConferenceCardProps {
  conference: Conference;
  isFollowing: boolean;
  onToggleFollow: (id: string) => void;
}

export function ConferenceCard({ conference, isFollowing, onToggleFollow }: ConferenceCardProps) {
  const nearestDeadline = getNearestDeadline(conference);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
              {conference.type}
            </p>
            <TrustBadge trustLevel={conference.trustLevel} />
          </div>
          <Link href={`/conference/${conference.id}`} className="mt-2 block text-xl font-semibold text-slate-900 hover:text-sky-700 dark:text-white dark:hover:text-sky-300">
            {conference.name}
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">{conference.acronym}</p>
        </div>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getModeStyles(conference.mode)}`}>
          {conference.mode}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <span>{conference.city}</span>
        <span>•</span>
        <span>{conference.country}</span>
      </div>

      <p className="mb-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
        {conference.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {conference.topics.slice(0, 4).map((topic) => (
          <span key={topic} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
            {topic}
          </span>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span className="rounded-full bg-indigo-50 px-2 py-1 font-medium text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:ring-indigo-800">
          {conference.publication.publisher}
        </span>
        {conference.publication.indexing.slice(0, 2).map((index) => (
          <span key={index} className="rounded-full bg-cyan-50 px-2 py-1 font-medium text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-950 dark:text-cyan-200 dark:ring-cyan-800">
            {index}
          </span>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/90">
        <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          <span>En yakın deadline</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{nearestDeadline ? `${nearestDeadline.daysLeft} gün` : "Yok"}</span>
        </div>
        {nearestDeadline ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{nearestDeadline.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(nearestDeadline.value)}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              nearestDeadline.tone === "danger"
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200"
                : nearestDeadline.tone === "warning"
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
            }`}>
              {nearestDeadline.daysLeft <= 0 ? "Süre doldu" : nearestDeadline.daysLeft}
            </span>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Deadline bilgisi yok.</p>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>{conference.startDate ? formatDate(conference.startDate) : "Başlangıç tarihi yok"}</span>
        <span>•</span>
        <span>{conference.endDate ? formatDate(conference.endDate) : "Bitiş tarihi yok"}</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onToggleFollow(conference.id)}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
            isFollowing
              ? "bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
              : "bg-sky-600 text-white hover:bg-sky-500"
          }`}
        >
          {isFollowing ? "Takip ediliyor" : "Takip et"}
        </button>
        <button
          type="button"
          onClick={() => downloadConferenceIcs(conference)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          ICS
        </button>
      </div>
    </article>
  );
}
