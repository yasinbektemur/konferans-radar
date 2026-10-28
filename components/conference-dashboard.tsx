"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Conference } from "@/types/conference";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getTopics, getPublicationPublishers } from "@/lib/data";
import { formatModeLabel, formatTrustLabel, formatConferenceType } from "@/lib/labels";
import { formatDate, getDaysUntil, getNearestDeadline, getUpcomingDeadlineEntries } from "@/lib/utils";

const FOLLOWED_KEY = "bmed-followed-conferences";

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const stored = window.localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return stored === "dark" || stored === "light" ? stored : systemDark ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-label={theme === "dark" ? "Açık tema moduna geç" : "Koyu tema moduna geç"}
      aria-pressed={theme === "dark"}
      title={theme === "dark" ? "Açık tema moduna geç" : "Koyu tema moduna geç"}
      onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      className="min-w-[110px]"
    >
      {theme === "dark" ? "Açık tema" : "Koyu tema"}
    </Button>
  );
}

function DeadlineStrip({ conferences }: { conferences: Conference[] }) {
  const items = conferences
    .map((conference) => ({ conference, nearest: getNearestDeadline(conference) }))
    .filter((entry) => entry.nearest)
    .sort((a, b) => (a.nearest ? a.nearest.daysLeft : 999) - (b.nearest ? b.nearest.daysLeft : 999))
    .slice(0, 6);

  if (!items.length) {
    return null;
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-3">
        {items.map(({ conference, nearest }) => {
          const tone = nearest?.tone === "danger" ? "danger" : nearest?.tone === "warning" ? "warning" : nearest?.expired ? "success" : "success";
          const toneClasses = {
            danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
            warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
            success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
          }[tone];

          return (
            <div key={conference.id} className={`flex min-w-[220px] items-center justify-between gap-4 rounded-2xl border px-4 py-3 sm:min-w-[260px] ${toneClasses}`}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">Deadline</p>
                <p className="mt-1 text-sm font-semibold">{conference.name}</p>
                <p className="text-xs opacity-80">{nearest ? (nearest.expired ? "Süresi doldu" : `${nearest.label} • ${formatDate(nearest.value)}`) : "Deadline yok"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">{nearest?.expired ? "Durum" : "Kalan"}</p>
                <p className="text-xl font-bold">{nearest ? (nearest.expired ? 0 : nearest.daysLeft) : "—"}</p>
                <p className="text-[10px] uppercase tracking-[0.22em] opacity-80">{nearest?.expired ? "gün" : "gün"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HomeConferenceCard({ conference, isFollowing, onToggleFollow }: { conference: Conference; isFollowing: boolean; onToggleFollow: (id: string) => void; }) {
  const nearest = getNearestDeadline(conference);
  const deadlineTone = nearest?.tone === "danger" ? "danger" : nearest?.tone === "warning" ? "warning" : "success";
  const deadlineClasses = {
    danger: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900",
    warning: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900",
  }[deadlineTone];

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">{formatConferenceType(conference.type)}</span>
              <Badge tone={conference.trustLevel === "verified" ? "success" : conference.trustLevel === "suspicious" ? "danger" : "warning"}>{formatTrustLabel(conference.trustLevel)}</Badge>
            </div>
            <Link href={`/conference/${conference.id}`} className="block text-lg font-semibold text-slate-900 transition hover:text-brand-700 dark:text-white dark:hover:text-brand-300">
              {conference.name}
            </Link>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{conference.acronym}</p>
          </div>
          <Badge tone={conference.mode === "online" ? "success" : conference.mode === "hybrid" ? "warning" : "default"}>{formatModeLabel(conference.mode)}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span>{conference.city}</span>
          <span>•</span>
          <span>{conference.country}</span>
          <span>•</span>
          <span>{conference.startDate ? formatDate(conference.startDate) : "Tarih yok"}</span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{conference.description}</p>

        <div className="flex flex-wrap gap-2">
          {conference.topics.slice(0, 4).map((topic) => (
            <span key={topic} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
              {topic}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone="default">{conference.publication.publisher}</Badge>
          {conference.publication.indexing.slice(0, 2).map((item) => (
            <Badge key={item} tone="default">{item}</Badge>
          ))}
        </div>

        <div className={`rounded-2xl border p-3 ring-1 ${nearest?.expired ? "border-slate-200 bg-slate-100 text-slate-500 ring-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 dark:ring-slate-700" : deadlineClasses}`}>
          <div className="mb-1 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80">
            <span>En yakın deadline</span>
            <span>{nearest ? (nearest.expired ? "Süresi doldu" : `${nearest.daysLeft} gün`) : "Yok"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{nearest ? (nearest.expired ? "Süresi doldu" : nearest.label) : "Deadline bilgisi yok"}</p>
              <p className="text-xs opacity-75">{nearest ? formatDate(nearest.value) : "—"}</p>
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-800 dark:bg-slate-900/80 dark:text-slate-100">
              {nearest ? (nearest.expired ? "0" : nearest.daysLeft) : "—"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant={isFollowing ? "secondary" : "primary"} size="sm" className="flex-1" onClick={() => onToggleFollow(conference.id)}>
            {isFollowing ? "Takip ediliyor" : "Takip et"}
          </Button>
          <Link href={`/conference/${conference.id}`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-transparent px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Detay
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function ConferenceDashboard({ initialConferences }: { initialConferences: Conference[] }) {
  const [search, setSearch] = useState("");
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [publicationFilter, setPublicationFilter] = useState("all");
  const [indexedOnly, setIndexedOnly] = useState(false);
  const [nearDeadlineOnly, setNearDeadlineOnly] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [typeTab, setTypeTab] = useState("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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

      const { data: rows, error: queryError } = await supabase
        .from("followed_conferences")
        .select("conference_id")
        .eq("user_id", userData.user.id);

      if (!queryError) {
        const nextIds = (rows ?? []).map((row) => String(row.conference_id));
        setFollowedIds(nextIds);
        window.localStorage.setItem(FOLLOWED_KEY, JSON.stringify(nextIds));
      }
    };

    void syncFollowedIds();
  }, []);

  const error = !initialConferences.length ? "Veri kaynağı boş veya yüklenemedi." : null;

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
      const matchesNearDeadline = !nearDeadlineOnly || (nearest ? nearest.daysLeft <= 30 && nearest.daysLeft >= 0 : false);
      const matchesType =
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
        matchesType &&
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

      if (aDeadline?.expired && !bDeadline?.expired) {
        return 1;
      }
      if (!aDeadline?.expired && bDeadline?.expired) {
        return -1;
      }

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

  const filterPanel = (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Konu</label>
        <Select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
          <option value="all">Tümü</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Ülke</label>
        <Select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
          <option value="all">Tümü</option>
          <option value="domestic">Yurt içi</option>
          <option value="international">Yurt dışı</option>
        </Select>
      </div>

      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Yayın</label>
        <Select value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value)}>
          <option value="all">Tümü</option>
          {publishers.map((publisher) => (
            <option key={publisher} value={publisher}>{publisher}</option>
          ))}
        </Select>
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
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tarih</label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </div>
    </div>
  );

  const loadingState = !initialConferences.length && !error;
  const skeletonCards = Array.from({ length: 6 });

  return (
    <main className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        {showInfoBanner && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <p>Bu veriler örnektir, resmi sitelerden doğrulanmadan kullanmayın.</p>
            <button type="button" aria-label="Bilgi şeridini kapat" onClick={() => setShowInfoBanner(false)} className="rounded-full px-2 py-1 text-xs font-semibold transition hover:bg-amber-100 dark:hover:bg-amber-900/50">
              Kapat
            </button>
          </div>
        )}

        <header className="mb-6 rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-soft">B</div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Biomedical AR-GE</p>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Konferans Radarı</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button type="button" aria-label="Ana menüyü aç" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                ☰
              </button>
            </div>

            <nav className={`${mobileMenuOpen ? "flex" : "hidden"} w-full flex-col gap-2 lg:flex lg:w-auto lg:flex-row lg:items-center lg:gap-2`}>
              <Link href="/takvim" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Takvim</Link>
              <Link href="/harita" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Harita</Link>
              <Link href="/opportunities" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Fırsatlar</Link>
              <Link href="/hakkinda" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Hakkında</Link>
              <Link href="/panel" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Ekip panosu</Link>

              <div className="relative">
                <button type="button" aria-label="Kullanıcı kısayolları menüsü" aria-expanded={mobileUserMenuOpen} onClick={() => setMobileUserMenuOpen((value) => !value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  Kullanıcı ▾
                </button>

                {mobileUserMenuOpen && (
                  <div className="absolute right-0 z-20 mt-2 min-w-[220px] rounded-2xl border border-slate-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
                    <Link href="/settings" className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Bildirimler</Link>
                    <Link href="/followed" className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Takip ettiklerim ({followedIds.length})</Link>
                  </div>
                )}
              </div>

              <ThemeToggle />
            </nav>
          </div>
        </header>

        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-700 dark:text-brand-300">YENİLİKLERİ İZLE</p>
              <h2 className="max-w-xl text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Biyomedikal AR-GE için doğru konferans çağrıları.</h2>
              <p className="mt-3 max-w-xl text-base text-slate-600 dark:text-slate-300">Teknik derinlik, güvenilir kaynaklar ve deadline takibi tek ekranda.</p>
              <div className="mt-5 max-w-2xl">
                <label className="relative block">
                  <span className="sr-only">Arama</span>
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Konferans, şehir, konu veya ülke ara..." className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base dark:border-slate-700 dark:bg-slate-800" />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/50 dark:bg-brand-950/40">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">İstatistik</p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialConferences.length}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Toplam</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialConferences.filter((item) => getDaysUntil(item.startDate) <= 90).length}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Yakın</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialConferences.filter((item) => item.publication.indexing.length > 0).length}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">İndeksli</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Yaklaşan deadline’lar</p>
            <span className="text-xs text-slate-500 dark:text-slate-400">Önümüzdeki 30 gün</span>
          </div>
          <DeadlineStrip conferences={initialConferences} />
        </section>

        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Filtreler</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setMobileFiltersOpen((value) => !value)}>
            {mobileFiltersOpen ? "Kapat" : "Aç"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className={`${mobileFiltersOpen ? "block" : "hidden lg:block"} rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Filtreler</h3>
            </div>
            {filterPanel}
          </aside>

          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Sonuçlar</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{filteredConferences.length} etkinlik</h3>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600 dark:text-slate-300">Sıralama</label>
                  <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-44">
                    <option value="deadline">En yakın deadline</option>
                    <option value="conference-date">Konferans tarihi</option>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Tümü" },
                  { value: "calls", label: "Çağrılar" },
                  { value: "grant", label: "Hibe" },
                  { value: "competition", label: "Yarışma" },
                  { value: "fair", label: "Fuar" },
                ].map((tab) => (
                  <button key={tab.value} type="button" onClick={() => setTypeTab(tab.value)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${typeTab === tab.value ? "bg-brand-600 text-white shadow-soft" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">{error}</div>
            ) : loadingState ? (
              <div className="grid gap-4 md:grid-cols-2">
                {skeletonCards.map((_, index) => (
                  <div key={`skeleton-${index}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-soft dark:border-slate-800 dark:bg-slate-900">
                    <div className="skeleton h-28 w-full" />
                    <div className="space-y-4 p-4">
                      <div className="skeleton h-4 w-24 rounded-full" />
                      <div className="skeleton h-6 w-2/3 rounded-xl" />
                      <div className="skeleton h-4 w-1/2 rounded-xl" />
                      <div className="grid gap-2 pt-2">
                        <div className="skeleton h-4 w-full rounded-xl" />
                        <div className="skeleton h-4 w-4/5 rounded-xl" />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <div className="skeleton h-10 flex-1 rounded-xl" />
                        <div className="skeleton h-10 w-20 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConferences.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredConferences.map((conference) => (
                  <HomeConferenceCard key={conference.id} conference={conference} isFollowing={followedIds.includes(conference.id)} onToggleFollow={toggleFollow} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">Sonuç bulunamadı</p>
                <p className="mt-2 text-sm">Arama ve filtreleri biraz daha genişletmeyi deneyin.</p>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Biomedical Conference Radar</p>
            <div className="flex items-center gap-4">
              <span>Güvenilir kaynaklar</span>
              <span>Deadline takibi</span>
              <span>AR-GE odaklı filtreler</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
