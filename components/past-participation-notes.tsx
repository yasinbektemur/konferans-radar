"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PastParticipationNotes({ conferenceId, conferenceName }: { conferenceId?: string | null; conferenceName: string }) {
  const [notes, setNotes] = useState<Array<{ id: string; attended_at?: string | null; notes: string }>>([]);
  const [draft, setDraft] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");

  const loadNotes = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("participation_notes")
      .select("id, attended_at, notes")
      .eq("conference_id", conferenceId ?? "")
      .order("attended_at", { ascending: false });

    if (!error) {
      setNotes(data ?? []);
    }
  }, [conferenceId]);

  useEffect(() => {
    if (!conferenceId) {
      return;
    }

    const timer = setTimeout(() => {
      void loadNotes();
    }, 0);

    return () => clearTimeout(timer);
  }, [conferenceId, loadNotes]);

  const handleSave = async () => {
    const supabase = createClient();
    if (!supabase || !draft.trim()) {
      setMessage("Not boş olamaz.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setMessage("Not eklemek için giriş yapın.");
      return;
    }

    const { error } = await supabase.from("participation_notes").insert({
      user_id: userData.user.id,
      conference_id: conferenceId ?? null,
      conference_name: conferenceName,
      attended_at: date || null,
      notes: draft,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setDraft("");
    setDate("");
    setMessage("");
    await loadNotes();
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Geçmiş katılım notları</h2>

      <div className="space-y-3">
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <textarea
          rows={4}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Katılım deneyimini, başvuruyu veya notları yazın..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          Not ekle
        </button>
        {message ? <p className="text-xs text-red-600 dark:text-red-300">{message}</p> : null}
      </div>

      <div className="mt-4 space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Henüz kayıt yok.</p>
        ) : (
          notes.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-1 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>{item.attended_at ? new Date(item.attended_at).toLocaleDateString("tr-TR") : "Tarih yok"}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200">{item.notes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
