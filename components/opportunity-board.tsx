"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getPublicationPublishers } from "@/lib/data";
import { formatDate, getNearestDeadline } from "@/lib/utils";
import type { Conference } from "@/types/conference";

type OpportunityTab = "calls" | "competitions";

function getInstitutionLabel(conference: Conference) {
  const source = conference.source || "Resmî duyuru";
  if (/tübitak|tuseb|horizon|europe|erc|erc|nih|nsf|wellcome/i.test(source)) {
    return source;
  }

  return conference.publication.publisher !== "Yok" ? conference.publication.publisher : source;
}

function getBudgetLabel(conference: Conference) {
  if (!conference.fees.amount) {
    return "Bütçe belirtilmedi";
  }

  return `${conference.fees.amount.toLocaleString("tr-TR")} ${conference.fees.currency ?? "TRY"}`;
}

function getEligibilitySummary(conference: Conference) {
  const pieces = [
    conference.mode === "online" ? "online katılım" : conference.mode === "hybrid" ? "hibrit katılım" : "yüz yüze katılım",
    conference.publication.indexing.length ? "indeksleme hedefi" : "açık başvuru",
    conference.topics[0] ? conference.topics[0] : "yenilik odaklı çalışmalar",
  ];

  return pieces.join(" • ");
}

function getPrizeSummary(conference: Conference) {
  if (conference.fees.amount) {
    return `${conference.fees.amount.toLocaleString("tr-TR")} ${conference.fees.currency ?? "TRY"} katılım / ödül bilgisi`;
  }

  return conference.fees.notes || "Katılım bilgisi mevcut değil";
}

export function OpportunityBoard({ conferences }: { conferences: Conference[] }) {
  const [tab, setTab] = useState<OpportunityTab>("calls");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [publisher, setPublisher] = useState("all");

  const publishers = useMemo(() => getPublicationPublishers(), []);

  const visibleConferences = useMemo(() => {
    const targetTypes = tab === "calls" ? ["conference", "grant"] : ["competition", "fair"];

    return conferences.filter((conference) => {
      const matchesType = targetTypes.includes(conference.type);
      const matchesSearch =
        !search ||
        [conference.name, conference.acronym, conference.city, conference.country, conference.description, ...conference.topics]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesCountry = country === "all" || conference.country === country;
      const matchesPublisher = publisher === "all" || conference.publication.publisher === publisher;
      return matchesType && matchesSearch && matchesCountry && matchesPublisher;
    });
  }, [conferences, search, country, publisher, tab]);

  const countries = useMemo(
    () => [...new Set(conferences.map((conference) => conference.country))].sort(),
    [conferences],
  );

  const summary = useMemo(
    () => ({
      total: visibleConferences.length,
      upcoming: visibleConferences.filter((conference) => {
        const nearest = getNearestDeadline(conference);
        return nearest ? nearest.daysLeft <= 30 : false;
      }).length,
      trust: visibleConferences.filter((conference) => conference.trustLevel === "verified").length,
    }),
    [visibleConferences],
  );

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Fırsatlar</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Hibe ve çağrılar</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: "calls", label: "Hibe & Çağrılar" },
            { value: "competitions", label: "Yarışma & Fuarlar" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTab(option.value as OpportunityTab)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${tab === option.value ? "bg-brand-600 text-white shadow-soft" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.6fr)_minmax(180px,0.6fr)]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Konferans adı, kurum, konu veya şehir ara..." />

          <Select value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value="all">Tüm ülkeler</option>
            {countries.map((countryName) => (
              <option key={countryName} value={countryName}>{countryName}</option>
            ))}
          </Select>

          <Select value={publisher} onChange={(event) => setPublisher(event.target.value)}>
            <option value="all">Tüm kurumlar</option>
            {publishers.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Toplam</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">30 gün içinde</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{summary.upcoming}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Onaylı içerik</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{summary.trust}</p>
        </div>
      </div>

      {visibleConferences.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Sonuç bulunamadı.</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Filtreleri genişletip yeniden deneyin.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleConferences.map((conference) =>
            tab === "calls" ? (
              <Card key={conference.id} className="overflow-hidden p-0">
                <div className="border-b border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge tone="default">{getInstitutionLabel(conference)}</Badge>
                        <Badge tone={conference.trustLevel === "verified" ? "success" : conference.trustLevel === "suspicious" ? "danger" : "warning"}>{conference.trustLevel}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{conference.name}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{conference.acronym}</p>
                    </div>
                    <Badge tone="default">{conference.type === "grant" ? "Hibe" : "Çağrı"}</Badge>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Bütçe</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{getBudgetLabel(conference)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Son başvuru</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {conference.deadlines.abstract || conference.startDate ? formatDate(conference.deadlines.abstract || conference.startDate || null) : "Belirsiz"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Uygunluk koşulları özeti</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{getEligibilitySummary(conference)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {conference.topics.slice(0, 4).map((topic) => (
                      <Badge key={topic} tone="default">{topic}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-3 dark:border-brand-900/60 dark:bg-brand-950/25">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">Kalan</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                        {getNearestDeadline(conference)?.daysLeft ?? "—"} gün
                      </p>
                    </div>
                    <Link href={conference.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-500">
                      Resmî link
                    </Link>
                  </div>
                </div>
              </Card>
            ) : (
              <Card key={conference.id} className="overflow-hidden p-0">
                <div className="border-b border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge tone="default">{conference.type === "competition" ? "Yarışma" : "Fuar"}</Badge>
                        <Badge tone={conference.trustLevel === "verified" ? "success" : conference.trustLevel === "suspicious" ? "danger" : "warning"}>{conference.trustLevel}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{conference.name}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{conference.acronym}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tarih</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {conference.startDate ? formatDate(conference.startDate) : "Tarih yok"}
                        {conference.endDate ? ` - ${formatDate(conference.endDate)}` : ""}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Yer</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{conference.city}, {conference.country}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Ödül / katılım bilgisi</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{getPrizeSummary(conference)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {conference.topics.slice(0, 4).map((topic) => (
                      <Badge key={topic} tone="default">{topic}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-3 dark:border-brand-900/60 dark:bg-brand-950/25">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">Deadline</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                        {conference.deadlines.abstract ? formatDate(conference.deadlines.abstract) : "Belirsiz"}
                      </p>
                    </div>
                    <Link href={conference.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-500">
                      Detay
                    </Link>
                  </div>
                </div>
              </Card>
            ),
          )}
        </div>
      )}
    </section>
  );
}
