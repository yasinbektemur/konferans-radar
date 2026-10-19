"use client";

import { useEffect, useMemo, useState } from "react";
import type { Conference } from "@/types/conference";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["Planlanıyor", "Yazılıyor", "Gönderildi", "Kabul", "Ret"] as const;

type KanbanCard = {
  id: string;
  conference_id?: string | null;
  title: string;
  work_name?: string | null;
  notes?: string | null;
  status: (typeof STATUSES)[number];
  created_at?: string | null;
};

export function TeamBoard({ conferences }: { conferences: Conference[] }) {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [title, setTitle] = useState("");
  const [workName, setWorkName] = useState("");
  const [conferenceId, setConferenceId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Planlanıyor");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchCards = async () => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const { data, error } = await supabase.from("kanban_cards").select("*").order("created_at", { ascending: true });
    if (!error) {
      setCards(data as KanbanCard[]);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCards();
    });
  }, []);

  const groupedCards = useMemo(
    () =>
      STATUSES.reduce(
        (acc, item) => ({
          ...acc,
          [item]: cards.filter((card) => card.status === item),
        }),
        {} as Record<string, KanbanCard[]>,
      ),
    [cards],
  );

  const handleAddCard = async () => {
    const supabase = createClient();
    if (!supabase || !title.trim()) {
      setMessage("Kart için en az bir başlık ekleyin.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("kanban_cards").insert({
      title: title.trim(),
      work_name: workName.trim() || null,
      conference_id: conferenceId || null,
      notes: notes.trim(),
      status,
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setWorkName("");
    setConferenceId("");
    setNotes("");
    setStatus("Planlanıyor");
    await fetchCards();
  };

  const updateNote = async (cardId: string, nextNote: string) => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    await supabase.from("kanban_cards").update({ notes: nextNote }).eq("id", cardId);
    await fetchCards();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Ekip panosu</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Kanban akışı</h2>
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70 md:grid-cols-2 xl:grid-cols-5">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Kart başlığı"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <input
          value={workName}
          onChange={(event) => setWorkName(event.target.value)}
          placeholder="Çalışma / başvuru adı"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <select
          value={conferenceId}
          onChange={(event) => setConferenceId(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="">Konferans seçin</option>
          {conferences.map((conference) => (
            <option key={conference.id} value={conference.id}>
              {conference.acronym || conference.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as (typeof STATUSES)[number])}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        >
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddCard}
          disabled={loading}
          className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {loading ? "Ekleniyor..." : "Kart ekle"}
        </button>
      </div>

      {message ? <p className="mb-4 text-sm text-red-600 dark:text-red-300">{message}</p> : null}

      <div className="grid gap-4 xl:grid-cols-5">
        {STATUSES.map((column) => (
          <div key={column} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/80">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{column}</h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {groupedCards[column]?.length ?? 0}
              </span>
            </div>

            <div className="space-y-3">
              {(groupedCards[column] ?? []).map((card) => (
                <div key={card.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{card.title}</p>
                  {card.work_name ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.work_name}</p> : null}
                  {card.conference_id ? (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
                      {conferences.find((conference) => conference.id === card.conference_id)?.acronym || "Konferans"}
                    </p>
                  ) : null}
                  <textarea
                    value={card.notes ?? ""}
                    onChange={(event) => updateNote(card.id, event.target.value)}
                    rows={3}
                    placeholder="Not ekleyin..."
                    className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
