"use client";

import dynamic from "next/dynamic";
import type { Conference } from "@/types/conference";

const MapClient = dynamic(() => import("@/components/map-client").then((module) => module.MapClient), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      Harita yükleniyor...
    </div>
  ),
});

export function WorldMap({ conferences }: { conferences: Conference[] }) {
  return <MapClient conferences={conferences} />;
}
