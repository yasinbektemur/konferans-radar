"use client";

import Link from "next/link";
import { WorldMap } from "@/components/world-map";
import { getAllConferences } from "@/lib/data";

export default function MapPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Coğrafya</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Harita görünümü</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Ana sayfa</Link>
            <Link href="/takvim" className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Takvim</Link>
          </nav>
        </header>

        <WorldMap conferences={getAllConferences()} />
      </div>
    </main>
  );
}
