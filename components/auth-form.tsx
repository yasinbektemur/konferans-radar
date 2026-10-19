"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(() => {
    const supabase = createClient();
    return supabase ? "" : "Supabase ortam değişkenleri tanımlanmadı.";
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();

    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase client oluşturulamadı.");
      return;
    }

    setLoading(true);
    setMessage("");

    const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: redirectUrl ? { emailRedirectTo: redirectUrl } : undefined,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("E-posta doğrulama bağlantısı gönderildi. Gelen kutunuzu kontrol edin.");
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setUserEmail(null);
  };

  if (userEmail) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        <span className="font-medium">Giriş yapıldı:</span> {userEmail}
        <button type="button" onClick={handleSignOut} className="ml-3 font-semibold underline">
          Çıkış
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignIn} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        E-posta ile giriş
      </label>
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="ornek@email.com"
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Gönderiliyor..." : "Magic link gönder"}
      </button>
      {message ? <p className="text-xs text-slate-600 dark:text-slate-300">{message}</p> : null}
    </form>
  );
}
