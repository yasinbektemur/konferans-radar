"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Conference } from "@/types/conference";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrustBadge, TrustChecklist } from "@/components/trust-indicator";
import { createClient } from "@/lib/supabase/client";
import { getAllConferences } from "@/lib/data";
import { downloadConferenceIcs, formatDate, getDaysUntil, getNearestDeadline } from "@/lib/utils";

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

    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        return;
      }

      void supabase
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

  const relevantConferences = useMemo(() => {
    const matches = getAllConferences().filter(
      (item) => item.id !== conference.id && item.topics.some((topic) => conference.topics.includes(topic)),
    );

    return matches.slice(0, 3);
  }, [conference]);

  const timelineEntries = [
    { key: "abstract", label: "Özet", date: conference.deadlines.abstract },
    { key: "fullPaper", label: "Tam metin", date: conference.deadlines.fullPaper },
    { key: "notification", label: "Kabul bildirimi", date: conference.deadlines.notification },
    { key: "cameraReady", label: "Kamera hazır", date: conference.deadlines.cameraReady },
    { key: "registration", label: "Kayıt", date: conference.deadlines.registration },
    { key: "conference-date", label: "Konferans tarihi", date: conference.startDate },
  ];

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

  const formatInfo = (value: string | number | boolean | null | undefined, fallback = "Henüz açıklanmadı") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    if (typeof value === "boolean") {
      return value ? "Evet" : "Hayır";
    }

    return String(value);
  };

  return (
    <main className="min-h-screen bg-transparent px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="transition hover:text-brand-700 dark:hover:text-brand-300">
            Ana sayfa
          </Link>
          <span>/</span>
          <span>Konferanslar</span>
          <span>/</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{conference.name}</span>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 transition hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-200">
            ← Geri dön
          </Link>
          <Button type="button" variant="secondary" size="sm" onClick={() => downloadConferenceIcs(conference)}>
            Takvime ekle
          </Button>
        </div>

        <header className="mb-6 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="default">{conference.type}</Badge>
                <Badge tone="default">{conference.acronym || "Acronym yok"}</Badge>
                <Badge tone="default">{conference.publication.publisher}</Badge>
                <TrustBadge trustLevel={conference.trustLevel} />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">{conference.name}</h1>
                <p className="mt-2 text-base text-slate-600 dark:text-slate-300">{conference.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant={isFollowing ? "secondary" : "primary"} onClick={toggleFollow}>
                {isFollowing ? "Takip ediliyor" : "Takip et"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => window.open(conference.officialUrl, "_blank", "noopener,noreferrer")}>
                Kaynağı doğrula
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <section className="space-y-6">
            <Card className="p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Zaman çizelgesi</h2>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Deadline</span>
              </div>

              <div className="space-y-3">
                {timelineEntries.map((entry) => {
                  const formattedDate = entry.date ? new Date(entry.date) : null;
                  const safeDate = formattedDate && !Number.isNaN(formattedDate.getTime()) ? formattedDate : null;
                  const daysLeft = safeDate ? getDaysUntil(entry.date ?? null) : null;
                  const isPast = typeof daysLeft === "number" && daysLeft < 0;
                  const isUpcoming = typeof daysLeft === "number" && daysLeft >= 0 && daysLeft <= 30;

                  const toneClasses = !safeDate
                    ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                    : isPast
                      ? "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-500"
                      : isUpcoming
                        ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200"
                        : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

                  const statusText = !safeDate
                    ? "Henüz açıklanmadı"
                    : isPast
                      ? `${Math.abs(daysLeft ?? 0)} gün geçti`
                      : daysLeft === 0
                        ? "Bugün"
                        : `${daysLeft} gün kaldı`;

                  return (
                    <div key={entry.key} className={`flex items-start gap-4 rounded-2xl border p-4 ${toneClasses}`}>
                      <div className={`mt-1 h-2.5 w-2.5 rounded-full ${!safeDate ? "bg-slate-300 dark:bg-slate-600" : isPast ? "bg-slate-400" : isUpcoming ? "bg-brand-500" : "bg-sky-500"}`} />
                      <div className="flex-1">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.label}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{safeDate ? formatDate(entry.date ?? undefined) : "Henüz açıklanmadı"}</p>
                          </div>
                          <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{statusText}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Konum ve mod</h3>
                <dl className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Konum</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{formatInfo(`${conference.city}, ${conference.country}`)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Mod</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{formatInfo(conference.mode)}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Yayın ve indeks</h3>
                <dl className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Yayıncı</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{formatInfo(conference.publication.publisher)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>İndeks</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{conference.publication.indexing.length ? conference.publication.indexing.join(", ") : "Henüz açıklanmadı"}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Ücret ve burs</h3>
                <dl className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Ücret</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{conference.fees.amount ? `${conference.fees.amount} ${conference.fees.currency ?? ""}` : "Henüz açıklanmadı"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Öğrenci indirimi</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{formatInfo(conference.fees.studentDiscount)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Burs</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{formatInfo(conference.fees.scholarship)}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Konular</h3>
                <div className="flex flex-wrap gap-2">
                  {conference.topics.length ? (
                    conference.topics.map((topic) => (
                      <span key={topic} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-300">Henüz açıklanmadı</span>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Güvenilirlik</h2>
                <TrustBadge trustLevel={conference.trustLevel} />
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{conference.trustNotes || "Henüz açıklanmadı"}</p>
                </div>

                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                  <span>Son doğrulama</span>
                  <span className="font-medium text-slate-900 dark:text-white">{conference.lastVerified ? formatDate(conference.lastVerified) : "Henüz açıklanmadı"}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={conference.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
                  >
                    Kaynağı doğrula
                  </a>
                  <Button type="button" variant="secondary" size="sm" onClick={() => downloadConferenceIcs(conference)}>
                    .ics indir
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Hızlı özet</h3>
              <dl className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <dt>Başlangıç</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{conference.startDate ? formatDate(conference.startDate) : "Henüz açıklanmadı"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Bitiş</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{conference.endDate ? formatDate(conference.endDate) : "Henüz açıklanmadı"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Yakın deadline</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{nearestDeadline ? `${nearestDeadline.label} • ${nearestDeadline.daysLeft}g` : "Henüz açıklanmadı"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Konum</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{conference.city || "Henüz açıklanmadı"}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Benzer konferanslar</h3>
              <div className="space-y-3">
                {relevantConferences.length ? (
                  relevantConferences.map((item) => (
                    <Link key={item.id} href={`/conference/${item.id}`} className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-brand-200 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-900 dark:hover:bg-brand-950/30">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.acronym}</p>
                        </div>
                        <Badge tone={item.trustLevel === "verified" ? "success" : item.trustLevel === "suspicious" ? "danger" : "warning"}>{item.trustLevel}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.city}, {item.country}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">Benzer konferans bulunamadı.</p>
                )}
              </div>
            </Card>

            <TrustChecklist conference={conference} />
          </aside>
        </div>
      </div>
    </main>
  );
}
