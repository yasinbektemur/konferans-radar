"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DAYS = [
  { value: "monday", label: "Pazartesi" },
  { value: "tuesday", label: "Salı" },
  { value: "wednesday", label: "Çarşamba" },
  { value: "thursday", label: "Perşembe" },
  { value: "friday", label: "Cuma" },
  { value: "saturday", label: "Cumartesi" },
  { value: "sunday", label: "Pazar" },
] as const;

export function NotificationSettings() {
  const [channel, setChannel] = useState<"email" | "telegram" | "both">("email");
  const [enabledDays, setEnabledDays] = useState<string[]>(DAYS.map((day) => day.value));
  const [telegramChatId, setTelegramChatId] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setLoaded(true);
        return;
      }

      const { data: settings, error } = await supabase
        .from("notification_settings")
        .select("channel, enabled, enabled_days, telegram_chat_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!error && settings) {
        setChannel(settings.channel ?? "email");
        setEnabled(settings.enabled ?? true);
        setEnabledDays(settings.enabled_days?.length ? settings.enabled_days : DAYS.map((day) => day.value));
        setTelegramChatId(settings.telegram_chat_id ?? "");
      }

      setLoaded(true);
    });
  }, []);

  const saveSettings = async () => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return;
    }

    await supabase.from("notification_settings").upsert({
      user_id: userData.user.id,
      channel,
      enabled,
      enabled_days: enabledDays,
      telegram_chat_id: telegramChatId || null,
    }, { onConflict: "user_id" });
  };

  const toggleDay = (value: string) => {
    setEnabledDays((current) =>
      current.includes(value) ? current.filter((day) => day !== value) : [...current, value],
    );
  };

  if (!loaded) {
    return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Ayarlar yükleniyor...</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Bildirimler</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Kullanıcı ayarları</h2>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={enabled} onChange={() => setEnabled((value) => !value)} />
          Etkin
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Kanal
          </label>
          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value as "email" | "telegram" | "both")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="email">Sadece e-posta</option>
            <option value="telegram">Sadece Telegram</option>
            <option value="both">E-posta + Telegram</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Telegram chat ID
          </label>
          <input
            value={telegramChatId}
            onChange={(event) => setTelegramChatId(event.target.value)}
            placeholder="ör. 123456789"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Hangi günler uyarı gelsin?
          </p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  enabledDays.includes(day.value)
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void saveSettings();
          }}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          Ayarları kaydet
        </button>
      </div>
    </div>
  );
}
