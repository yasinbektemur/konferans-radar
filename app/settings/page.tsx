import Link from "next/link";
import { NotificationSettings } from "@/components/notification-settings";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Ayarlar</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Bildirim tercihleri</h1>
          </div>
          <Link href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Ana sayfa</Link>
        </header>

        <NotificationSettings />
      </div>
    </main>
  );
}
