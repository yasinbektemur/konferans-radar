import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white/80 p-8 text-center shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-700 dark:text-brand-300">404</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Sayfa bulunamadı</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Aradığınız sayfa taşınmış, silinmiş veya geçici olarak kullanılamıyor olabilir. Ana sayfaya dönerek mevcut konferansları ve duyuruları tekrar görüntüleyebilirsiniz.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-500">
            Ana sayfaya dön
          </Link>
          <Link href="/takvim" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Takvimi aç
          </Link>
        </div>
      </div>
    </main>
  );
}
