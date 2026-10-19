"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Conference } from "@/types/conference";
import { ConferenceCard } from "@/components/conference-card";
import { UpcomingDeadlinesTimeline } from "@/components/upcoming-deadlines-timeline";
import { AuthForm } from "@/components/auth-form";
import { ProjectMatcher } from "@/components/project-matcher";
import { createClient } from "@/lib/supabase/client";
import { getTopics, getPublicationPublishers } from "@/lib/data";
import { getNearestDeadline } from "@/lib/utils";

const FOLLOWED_KEY = "bmed-followed-conferences";

export function ConferenceDashboard({ initialConferences }: { initialConferences: Conference[] }) {
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [publicationFilter, setPublicationFilter] = useState("all");
  const [indexedOnly, setIndexedOnly] = useState(false);
  const [nearDeadlineOnly, setNearDeadlineOnly] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [typeTab, setTypeTab] = useState("all");
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

    const syncFollowedIds = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        const saved = window.localStorage.getItem(FOLLOWED_KEY);
        if (saved) {
          try {
            setFollowedIds(JSON.parse(saved) as string[]);
          } catch {
            setFollowedIds([]);
          }
        }
        return;
      }

      const { data: rows, error } = await supabase
        .from("followed_conferences")
        .select("conference_id")
        .eq("user_id", userData.user.id);

      if (!error) {
        const nextIds = (rows ?? []).map((row) => String(row.conference_id));
        setFollowedIds(nextIds);
        window.localStorage.setItem(FOLLOWED_KEY, JSON.stringify(nextIds));
      }
    };

    void syncFollowedIds();
  }, []);

  const topics = useMemo(() => getTopics(), []);
  const publishers = useMemo(() => getPublicationPublishers(), []);

  const filteredConferences = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = initialConferences.filter((conference) => {
      const matchesSearch =
        !normalizedSearch ||
        [conference.name, conference.acronym, conference.city, conference.country, conference.description, ...conference.topics]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesTopic = selectedTopic === "all" || conference.topics.includes(selectedTopic);
      const matchesCountry =
        countryFilter === "all" ||
        (countryFilter === "domestic" && conference.country === "Türkiye") ||
        (countryFilter === "international" && conference.country !== "Türkiye");
      const matchesPublication = publicationFilter === "all" || conference.publication.publisher === publicationFilter;
      const matchesIndexed = !indexedOnly || conference.publication.indexing.length > 0;
      const nearest = getNearestDeadline(conference);
      const matchesNearDeadline = !nearDeadlineOnly || (nearest ? nearest.daysLeft <= 30 : false);
      const matchesTypeTab =
        typeTab === "all" ||
        (typeTab === "calls" ? ["conference", "workshop"].includes(conference.type) : conference.type === typeTab);

      const matchesStartDate = !startDate || !conference.startDate || new Date(conference.startDate) >= new Date(startDate);
      const matchesEndDate = !endDate || !conference.startDate || new Date(conference.startDate) <= new Date(endDate);

      return (
        matchesSearch &&
        matchesTopic &&
        matchesCountry &&
        matchesPublication &&
        matchesIndexed &&
        matchesNearDeadline &&
        matchesTypeTab &&
        matchesStartDate &&
        matchesEndDate
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "conference-date") {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        return dateA - dateB;
      }

      const aDeadline = getNearestDeadline(a);
      const bDeadline = getNearestDeadline(b);
      const aDays = aDeadline ? aDeadline.daysLeft : Number.MAX_SAFE_INTEGER;
      const bDays = bDeadline ? bDeadline.daysLeft : Number.MAX_SAFE_INTEGER;
      return aDays - bDays;
    });
  }, [countryFilter, endDate, indexedOnly, initialConferences, nearDeadlineOnly, publicationFilter, search, selectedTopic, sortBy, startDate, typeTab]);

  const toggleFollow = async (id: string) => {
    const nextValue = !followedIds.includes(id);
    setFollowedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return;
    }

    if (nextValue) {
      await supabase.from("followed_conferences").upsert(
        { user_id: userData.user.id, conference_id: id },
        { onConflict: "user_id,conference_id" },
      );
      return;
    }

    await supabase.from("followed_conferences").delete().eq("user_id", userData.user.id).eq("conference_id", id);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400">
                Biomedical AR-GE
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Konferans Radarı</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/takvim"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Takvim
              </Link>
              <Link
                href="/harita"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Harita
              </Link>
              <Link
                href="/panel"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Ekip panosu
              </Link>
              <Link
                href="/settings"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Bildirimler
              </Link>
              <Link
                href="/followed"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Takip ettiklerim ({followedIds.length})
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <AuthForm />
          </div>

          <div className="mt-4">
            <label className="relative block">
              <span className="sr-only">Arama</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Konferans, şehir, konu, ülke ara..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>
        </header>

        <UpcomingDeadlinesTimeline conferences={initialConferences} />

        <div className="mb-6">
          <ProjectMatcher conferences={initialConferences} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Filtreler
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Konu
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(event) => setSelectedTopic(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="all">Tümü</option>
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Ülke
                  </label>
                  <select
                    value={countryFilter}
                    onChange={(event) => setCountryFilter(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="all">Tümü</option>
                    <option value="domestic">Yurt içi</option>
                    <option value="international">Yurt dışı</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Yayın türü
                  </label>
                  <select
                    value={publicationFilter}
                    onChange={(event) => setPublicationFilter(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="all">Tümü</option>
                    {publishers.map((publisher) => (
                      <option key={publisher} value={publisher}>{publisher}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input type="checkbox" checked={indexedOnly} onChange={() => setIndexedOnly((current) => !current)} />
                    Sadece indeksli
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input type="checkbox" checked={nearDeadlineOnly} onChange={() => setNearDeadlineOnly((current) => !current)} />
                    Deadline yaklaşanlar
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Tarih aralığı
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Sonuç sayısı</p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{filteredConferences.length} etkinlik</h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 dark:text-slate-300">Sıralama</label>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="deadline">En yakın deadline</option>
                  <option value="conference-date">Konferans tarihi</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Tümü" },
                  { value: "calls", label: "Çağrılar" },
                  { value: "grant", label: "Hibe" },
                  { value: "competition", label: "Yarışma" },
                  { value: "fair", label: "Fuar" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setTypeTab(tab.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      typeTab === tab.value
                        ? "bg-sky-600 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {filteredConferences.length > 0 ? (
                filteredConferences.map((conference) => (
                  <ConferenceCard
                    key={conference.id}
                    conference={conference}
                    isFollowing={followedIds.includes(conference.id)}
                    onToggleFollow={toggleFollow}
                  />
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Filtrelere uygun konferans bulunamadı.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
