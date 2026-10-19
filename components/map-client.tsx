"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import type { Conference } from "@/types/conference";
import { formatDate, getNearestDeadline } from "@/lib/utils";
import { getConferenceCoordinates } from "@/lib/locations";

function createMarkerIcon(color: string) {
  return divIcon({
    className: "conference-marker",
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 8px 22px rgba(15,23,42,0.25);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export function MapClient({ conferences }: { conferences: Conference[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Coğrafya</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Konferanslar dünya haritasında</h2>
      </div>

      <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-[560px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {conferences.map((conference) => {
          const position = getConferenceCoordinates(conference);
          const nearestDeadline = getNearestDeadline(conference);
          const color = nearestDeadline?.tone === "danger" ? "#f43f5e" : nearestDeadline?.tone === "warning" ? "#f59e0b" : "#10b981";

          return (
            <Marker key={conference.id} position={[position.lat, position.lng]} icon={createMarkerIcon(color)}>
              <Popup>
                <div className="min-w-[220px] max-w-[260px] text-sm text-slate-700 dark:text-slate-200">
                  <p className="mb-1 text-base font-semibold text-slate-900 dark:text-white">{conference.acronym}</p>
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-sky-600 dark:text-sky-400">{conference.city}, {conference.country}</p>
                  <p className="mb-2 font-medium text-slate-800 dark:text-slate-100">{conference.name}</p>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Başlangıç</span>
                    <span>{conference.startDate ? formatDate(conference.startDate) : "Belirsiz"}</span>
                  </div>
                  {nearestDeadline ? (
                    <div className="rounded-lg bg-slate-100 p-2 text-xs dark:bg-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white">{nearestDeadline.label}</p>
                      <p className="text-slate-600 dark:text-slate-300">{formatDate(nearestDeadline.value)}</p>
                    </div>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
