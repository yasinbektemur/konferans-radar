"use client";

import { useMemo, useState } from "react";
import type { Conference } from "@/types/conference";
import { embeddingMatchEnabled, getConferenceMatches } from "@/lib/project-matching";

export function ProjectMatcher({ conferences }: { conferences: Conference[] }) {
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [matches, setMatches] = useState<ReturnType<typeof getConferenceMatches>>([]);

  const hasEmbedding = useMemo(() => embeddingMatchEnabled(), []);

  const runMatch = () => {
    setMatches(getConferenceMatches(conferences, title, keywords.split(",")));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Projeye göre eşleştirme</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Konferans önerisi</h2>
        </div>
        <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-800">
          {hasEmbedding ? "Embedding hazır" : "Anahtar kelime modu"}
        </span>
      </div>

      <div className="space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Proje başlığı"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <textarea
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          placeholder="Anahtar kelimeler: yapay zekâ, medikal görüntüleme, veri analizi"
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="button"
          onClick={runMatch}
          className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Eşleştir
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {matches.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Başlık ve anahtar kelime girerek uygun konferansları görebilirsiniz.</p>
        ) : (
          matches.map(({ conference, score, reason, matchedTopics }) => (
            <div key={conference.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="mb-2 flex items-center justify-between gap-3">
                <a href={`/conference/${conference.id}`} className="text-sm font-semibold text-slate-900 hover:text-violet-600 dark:text-white dark:hover:text-violet-300">
                  {conference.name}
                </a>
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{score}/100</span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-violet-600" style={{ width: `${score}%` }} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{reason}</p>
              {matchedTopics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {matchedTopics.map((topic) => (
                    <span key={topic} className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-200">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
