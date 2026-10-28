import type { Metadata } from "next";
import Link from "next/link";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { getAllConferences } from "@/lib/data";

export const metadata: Metadata = {
  title: "Takvim",
  description: "Aylık takvim görünümünde konferans ve deadline tarihlerini birlikte takip edin.",
};

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6 text-slate-900 dark:text-slate-100 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200/80 bg-white/80 px-4 py-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-soft">T</div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Gezinme</p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aylık takvim</h1>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <Link href="/" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Ana sayfa</Link>
              <Link href="/harita" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Harita</Link>
            </nav>
          </div>
        </header>

        <MonthlyCalendar conferences={getAllConferences()} />
      </div>
    </main>
  );
}
