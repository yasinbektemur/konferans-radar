"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Conference } from "@/types/conference";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { getPublicationPublishers, getTopics } from "@/lib/data";
import { getConferenceCoordinates } from "@/lib/locations";
import { formatDate, getNearestDeadline } from "@/lib/utils";

type ClusterGroup = {
  lat: number;
  lng: number;
  items: Conference[];
};

function createMarkerIcon(color: string, label?: string) {
  const size = label ? 30 : 18;
  return divIcon({
    className: "conference-marker",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 14px 24px rgba(15,23,42,0.3);color:#fff;font-size:${label ? 11 : 0}px;font-weight:700;">${label ?? ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const deltaLat = toRad(b.lat - a.lat);
  const deltaLng = toRad(b.lng - a.lng);
  const latA = toRad(a.lat);
  const latB = toRad(b.lat);

  const angle =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2) * Math.cos(latA) * Math.cos(latB);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(angle), Math.sqrt(1 - angle));
}

function createClusters(conferences: Conference[]): ClusterGroup[] {
  const groups: ClusterGroup[] = [];
  const used = new Set<number>();

  for (let index = 0; index < conferences.length; index += 1) {
    if (used.has(index)) {
      continue;
    }

    const baseCoords = getConferenceCoordinates(conferences[index]);
    const group: Conference[] = [conferences[index]];
    const groupIndices = [index];

    for (let compareIndex = index + 1; compareIndex < conferences.length; compareIndex += 1) {
      if (used.has(compareIndex)) {
        continue;
      }

      const compareCoords = getConferenceCoordinates(conferences[compareIndex]);
      const distance = haversineDistance(baseCoords, compareCoords);

      if (distance <= 700) {
        group.push(conferences[compareIndex]);
        groupIndices.push(compareIndex);
      }
    }

    groupIndices.forEach((itemIndex) => used.add(itemIndex));

    const totalLat = group.reduce((sum, conference) => sum + getConferenceCoordinates(conference).lat, 0);
    const totalLng = group.reduce((sum, conference) => sum + getConferenceCoordinates(conference).lng, 0);

    groups.push({
      lat: totalLat / group.length,
      lng: totalLng / group.length,
      items: group,
    });
  }

  return groups;
}

export function MapClient({ conferences }: { conferences: Conference[] }) {
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedPublisher, setSelectedPublisher] = useState("all");

  const topics = useMemo(() => getTopics(), []);
  const publishers = useMemo(() => getPublicationPublishers(), []);

  const filteredConferences = useMemo(
    () =>
      conferences.filter((conference) => {
        const matchesTopic = selectedTopic === "all" || conference.topics.includes(selectedTopic);
        const matchesPublisher = selectedPublisher === "all" || conference.publication.publisher === selectedPublisher;
        return matchesTopic && matchesPublisher;
      }),
    [conferences, selectedTopic, selectedPublisher],
  );

  const clusters = useMemo(() => createClusters(filteredConferences), [filteredConferences]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Coğrafya</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Konferanslar dünya haritasında</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="default">{filteredConferences.length} lokasyon</Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
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
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Yayın türü</label>
            <Select value={selectedPublisher} onChange={(event) => setSelectedPublisher(event.target.value)}>
              <option value="all">Tümü</option>
              {publishers.map((publisher) => (
                <option key={publisher} value={publisher}>{publisher}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <MapContainer center={[20, 0]} zoom={2} minZoom={2} scrollWheelZoom className="h-[520px] w-full md:h-[640px]">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {clusters.map((cluster) => {
              const nearestDeadline = getNearestDeadline(cluster.items[0]);
              const color = nearestDeadline?.tone === "danger" ? "#f43f5e" : nearestDeadline?.tone === "warning" ? "#f59e0b" : "#22c55e";
              const markerIcon = createMarkerIcon(color, cluster.items.length > 1 ? String(cluster.items.length) : undefined);

              return (
                <Marker key={`${cluster.lat}-${cluster.lng}-${cluster.items.length}`} position={[cluster.lat, cluster.lng]} icon={markerIcon}>
                  <Popup>
                    <div className="min-w-[230px] max-w-[260px] space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-300">{cluster.items.length > 1 ? `${cluster.items.length} konferans` : cluster.items[0].acronym || "Konferans"}</p>
                          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{cluster.items[0].name}</p>
                        </div>
                        <Badge tone={cluster.items[0].trustLevel === "verified" ? "success" : cluster.items[0].trustLevel === "suspicious" ? "danger" : "warning"}>{cluster.items[0].trustLevel}</Badge>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">{cluster.items[0].city}, {cluster.items[0].country}</p>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Başlangıç</p>
                        <p className="mt-1 font-medium text-slate-900 dark:text-white">{cluster.items[0].startDate ? formatDate(cluster.items[0].startDate) : "Henüz açıklanmadı"}</p>
                      </div>

                      {cluster.items[0].startDate && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-xs text-slate-500 dark:text-slate-400">En yakın deadline</p>
                          <p className="mt-1 font-medium text-slate-900 dark:text-white">{getNearestDeadline(cluster.items[0])?.label ?? "Henüz açıklanmadı"}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {getNearestDeadline(cluster.items[0]) ? formatDate(getNearestDeadline(cluster.items[0])?.value ?? null) : "Henüz açıklanmadı"}
                          </p>
                        </div>
                      )}

                      <Link href={`/conference/${cluster.items[0].id}`} className="inline-flex items-center rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-500">
                        Detay
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <aside className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Konferanslar</p>
            <Badge tone="default">{filteredConferences.length}</Badge>
          </div>

          <div className="space-y-3">
            {filteredConferences.length > 0 ? (
              filteredConferences.slice(0, 8).map((conference) => {
                const nearestDeadline = getNearestDeadline(conference);
                return (
                  <Link key={conference.id} href={`/conference/${conference.id}`} className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-brand-200 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-800 dark:hover:bg-brand-950/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{conference.name}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{conference.city}, {conference.country}</p>
                      </div>
                      <Badge tone={conference.trustLevel === "verified" ? "success" : conference.trustLevel === "suspicious" ? "danger" : "warning"}>{conference.trustLevel}</Badge>
                    </div>

                    <div className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <p>{conference.startDate ? formatDate(conference.startDate) : "Tarih yok"}</p>
                      <p>{nearestDeadline ? `${nearestDeadline.label} · ${formatDate(nearestDeadline.value)}` : "Deadline yok"}</p>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <span className="text-xs font-medium text-brand-700 dark:text-brand-300">Detay</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Filtrelere uygun konferans bulunamadı.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
