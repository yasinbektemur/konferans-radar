"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Conference } from "@/types/conference";
import { PastParticipationNotes } from "@/components/past-participation-notes";
import { TrustBadge, TrustChecklist } from "@/components/trust-indicator";
import { createClient } from "@/lib/supabase/client";
import { downloadConferenceIcs, formatDate, getDeadlineEntries, getModeStyles, getNearestDeadline } from "@/lib/utils";

const FOLLOWED_KEY = "bmed-followed-conferences";

export function ConferenceDetail({ conference }: { conference: Conference }) {
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
            window.localStorage.setItem(FOLLOWED_KEY, JSON.stringify(nextIds));
          }
        });
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(FOLLOWED_KEY, JSON.stringify(followedIds));
  }, [followedIds]);

  const isFollowing = followedIds.includes(conference.id);
  const nearestDeadline = useMemo(() => getNearestDeadline(conference), [conference]);
  const deadlineEntries = useMemo(() => getDeadlineEntries(conference), [conference]);

  const toggleFollow = async () => {
    const supabase = createClient();
    const nextValue = !isFollowing;

    setFollowedIds((current) => (current.includes(conference.id) ? current.filter((id) => id !== conference.id) : [...current, conference.id]));

    if (!supabase) {
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return;
    }

    if (nextValue) {
      await supabase.from("followed_conferences").upsert(
        { user_id: userData.user.id, conference_id: conference.id },
        { onConflict: "user_id,conference_id" },
      );
      return;
    }

    await supabase.from("followed_conferences").delete().eq("user_id", userData.user.id).eq("conference_id", conference.id);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="text-sm font-medium text-sky-600 hover:text-sky-500">
              ← Ana sayfaya dön
            </Link>
            <button
              type="button"
              onClick={toggleFollow}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                isFollowing ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-sky-600 text-white hover:bg-sky-500"
              }`}
            >
              {isFollowing ? "Takip ediliyor" : "Takip et"}
            </button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">{conference.type}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{conference.name}</h1>
              <p className="mt-2 text-lg text-slate-500 dark:text-slate-300">{conference.acronym}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getModeStyles(conference.mode)}`}>
                {conference.mode}
              </span>
              <TrustBadge trustLevel={conference.trustLevel} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Açıklama</h2>
              <p className="text-slate-600 dark:text-slate-300">{conference.description}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Tarih çizelgesi</h2>
              <div className="space-y-4">
                {deadlineEntries.length > 0 ? (
                  deadlineEntries.map((entry) => (
                    <div key={entry.key} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.label}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatDate(entry.value)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Deadline bilgisi yok.</p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Özet</h2>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between gap-3"><span>Yer</span><span className="font-medium text-slate-900 dark:text-white">{conference.city}, {conference.country}</span></div>
                <div className="flex justify-between gap-3"><span>Başlangıç</span><span className="font-medium text-slate-900 dark:text-white">{formatDate(conference.startDate)}</span></div>
                <div className="flex justify-between gap-3"><span>Bitiş</span><span className="font-medium text-slate-900 dark:text-white">{formatDate(conference.endDate)}</span></div>
                <div className="flex justify-between gap-3"><span>En yakın deadline</span><span className="font-medium text-slate-900 dark:text-white">{nearestDeadline ? `${nearestDeadline.label} (${nearestDeadline.daysLeft} gün)` : "Yok"}</span></div>
                <div className="flex justify-between gap-3"><span>Güven</span><span className="font-medium text-slate-900 dark:text-white">{conference.trustLevel}</span></div>
              </div>
            </div>

            <TrustChecklist conference={conference} />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">İçerik / yayın</h2>
              <div className="flex flex-wrap gap-2">
                {conference.topics.map((topic) => (
                  <span key={topic} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {topic}
                  </span>
                ))}
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between gap-3"><span>Yayıncı</span><span className="font-medium text-slate-900 dark:text-white">{conference.publication.publisher}</span></div>
                <div className="flex justify-between gap-3"><span>İndeks</span><span className="font-medium text-slate-900 dark:text-white">{conference.publication.indexing.join(", ") || "Yok"}</span></div>
              </div>
            </div>

            <PastParticipationNotes conferenceId={conference.id} conferenceName={conference.name} />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Ücret ve güven</h2>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between gap-3"><span>Ücret</span><span className="font-medium text-slate-900 dark:text-white">{conference.fees.amount ? `${conference.fees.amount} ${conference.fees.currency ?? ""}` : "Belirsiz"}</span></div>
                <div className="flex justify-between gap-3"><span>Öğrenci indirimi</span><span className="font-medium text-slate-900 dark:text-white">{conference.fees.studentDiscount ? "Evet" : "Hayır"}</span></div>
                <div className="flex justify-between gap-3"><span>Burs</span><span className="font-medium text-slate-900 dark:text-white">{conference.fees.scholarship ? "Evet" : "Hayır"}</span></div>
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{conference.trustNotes || "Güven notu yok."}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Dış bağlantı</h2>
              <a href={conference.officialUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
                Resmî sayfaya git
              </a>
              <button type="button" onClick={() => downloadConferenceIcs(conference)} className="mt-3 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Takvime ekle (.ics)
              </button>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Son doğrulama: {formatDate(conference.lastVerified)}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
