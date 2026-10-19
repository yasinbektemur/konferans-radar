import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Kimlik doğrulama</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Giriş yap</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Takiplerin, notların ve ekip panosu kartların kullanıcı bazında Supabase üzerinde saklanması için giriş yapın.
        </p>

        <div className="mt-6">
          <AuthForm />
        </div>

        <div className="mt-6">
          <Link href="/" className="text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">
            ← Ana sayfaya geri dön
          </Link>
        </div>
      </div>
    </main>
  );
}
