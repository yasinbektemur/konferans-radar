"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Conference } from "@/types/conference";

const STATUSES = ["Planlanıyor", "Yazılıyor", "Gönderildi", "Kabul", "Ret"] as const;

type KanbanCard = {
  id: string;
  conference_id?: string | null;
  title: string;
  work_name?: string | null;
  notes?: string | null;
  assignee?: string | null;
  deadline?: string | null;
  status: (typeof STATUSES)[number];
  created_at?: string | null;
};

type FormState = {
  title: string;
  workName: string;
  assignee: string;
  deadline: string;
  conferenceId: string;
  notes: string;
  status: (typeof STATUSES)[number];
};

const emptyForm: FormState = {
  title: "",
  workName: "",
  assignee: "",
  deadline: "",
  conferenceId: "",
  notes: "",
  status: "Planlanıyor",
};

function getDaysLeft(deadline: string | null | undefined): number | null {
  if (!deadline) {
    return null;
  }

  const targetDate = new Date(deadline);
  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function TeamBoard({ conferences }: { conferences: Conference[] }) {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<FormState>(emptyForm);
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

  const handleCreateCard = async () => {
    const supabase = createClient();
    if (!supabase || !draft.title.trim()) {
      setMessage("Kart için en az bir başlık ekleyin.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("kanban_cards").insert({
      title: draft.title.trim(),
      work_name: draft.workName.trim() || null,
      assignee: draft.assignee.trim() || null,
      deadline: draft.deadline || null,
      conference_id: draft.conferenceId || null,
      notes: draft.notes.trim(),
      status: draft.status,
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setDraft(emptyForm);
    setIsModalOpen(false);
    await fetchCards();
  };

  const updateCardStatus = async (cardId: string, nextStatus: (typeof STATUSES)[number]) => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    setCards((current) => current.map((card) => (card.id === cardId ? { ...card, status: nextStatus } : card)));
    await supabase.from("kanban_cards").update({ status: nextStatus }).eq("id", cardId);
  };

  const updateNote = async (cardId: string, nextNote: string) => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    setCards((current) => current.map((card) => (card.id === cardId ? { ...card, notes: nextNote } : card)));
    await supabase.from("kanban_cards").update({ notes: nextNote }).eq("id", cardId);
  };

  const handleDrop = async (column: (typeof STATUSES)[number]) => {
    const draggedCardId = sessionStorage.getItem("kanban-drag-card");
    if (!draggedCardId) {
      return;
    }

    await updateCardStatus(draggedCardId, column);
    sessionStorage.removeItem("kanban-drag-card");
  };

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Ekip panosu</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Kanban akışı</h2>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>Yeni kart</Button>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {STATUSES.map((column) => (
          <div key={column} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/80">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{column}</span>
              <Badge tone="default">{groupedCards[column]?.length ?? 0}</Badge>
            </div>
          </div>
        ))}
      </div>

      {message ? <p className="mb-4 text-sm text-red-600 dark:text-red-300">{message}</p> : null}

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[960px] gap-4 xl:grid-cols-5">
          {STATUSES.map((column) => (
            <div
              key={column}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => void handleDrop(column)}
              className="min-h-[420px] rounded-3xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{column}</h3>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {(groupedCards[column] ?? []).length}
                </span>
              </div>

              <div className="space-y-3">
                {(groupedCards[column] ?? []).map((card) => {
                  const conference = conferences.find((item) => item.id === card.conference_id);
                  const daysLeft = getDaysLeft(card.deadline);
                  const accent = daysLeft === null ? "default" : daysLeft <= 7 ? "danger" : daysLeft <= 21 ? "warning" : "success";

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(event) => {
                        sessionStorage.setItem("kanban-drag-card", card.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => setSelectedCard(card)}
                      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-3 shadow-soft transition hover:border-brand-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Çalışma</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{card.work_name || card.title}</p>
                        </div>
                        <Badge tone={accent}>{daysLeft === null ? "Tarih yok" : `${daysLeft} gün`}</Badge>
                      </div>

                      <div className="mt-3 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-between gap-2">
                          <span>Konferans</span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">{conference?.acronym || card.conference_id || "Yok"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Deadline</span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">{card.deadline ? formatDate(card.deadline) : "Belirsiz"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Atanan</span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">{card.assignee || "Belirtilmedi"}</span>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {card.notes ? card.notes : "Not eklenmedi."}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Yeni kart</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">İş akışı ekle</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
                Kapat
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Kart başlığı</label>
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Örnek: Abstract taslağı" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Çalışma adı</label>
                <input value={draft.workName} onChange={(event) => setDraft({ ...draft, workName: event.target.value })} placeholder="Örnek: CHI 2026 projesi" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Atanan kişi</label>
                <input value={draft.assignee} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })} placeholder="Örnek: Aylin" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Bağlı konferans</label>
                <Select value={draft.conferenceId} onChange={(event) => setDraft({ ...draft, conferenceId: event.target.value })}>
                  <option value="">Seçim yok</option>
                  {conferences.map((conference) => (
                    <option key={conference.id} value={conference.id}>
                      {conference.acronym || conference.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Deadline</label>
                <input type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Notlar</label>
                <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={4} placeholder="Plan, risk, notlar..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Başlangıç sütunu</label>
                <Select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as (typeof STATUSES)[number] })}>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
              <Button onClick={() => void handleCreateCard()} disabled={loading}>{loading ? "Ekleniyor..." : "Kart ekle"}</Button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedCard ? (
        <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md items-stretch border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="flex w-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-700 dark:text-brand-300">Kart detayı</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{selectedCard.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedCard(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">Kapat</button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Çalışma adı</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{selectedCard.work_name || "Belirtilmedi"}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Bağlı konferans</p>
                  <p className="mt-2 font-medium text-slate-900 dark:text-white">{conferences.find((item) => item.id === selectedCard.conference_id)?.acronym || selectedCard.conference_id || "Yok"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Kalan gün</p>
                  <p className="mt-2 font-medium text-slate-900 dark:text-white">
                    {selectedCard.deadline ? `${getDaysLeft(selectedCard.deadline) ?? 0} gün` : "Belirsiz"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Deadline</p>
                <p className="mt-2 font-medium text-slate-900 dark:text-white">{selectedCard.deadline ? formatDate(selectedCard.deadline) : "Belirtilmedi"}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Atanan kişi</p>
                <p className="mt-2 font-medium text-slate-900 dark:text-white">{selectedCard.assignee || "Belirtilmedi"}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Notlar</p>
                <textarea
                  value={selectedCard.notes ?? ""}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setCards((current) => current.map((card) => (card.id === selectedCard.id ? { ...card, notes: nextValue } : card)));
                    void updateNote(selectedCard.id, nextValue);
                  }}
                  rows={6}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
