"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConferenceCard } from "@/components/conference-card";
import { createClient } from "@/lib/supabase/client";
import type { Conference } from "@/types/conference";

const FOLLOWED_KEY = "bmed-followed-conferences";

export function FollowedList({ conferences }: { conferences: Conference[] }) {
  const [followedIds, setFollowedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const saved = window.localStorage.getItem(FOLLOWED_KEY);
    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved) as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        return;
      }

      supabase
        .from("followed_conferences")
        .select("conference_id")
        .eq("user_id", data.user.id)
        .then(({ data: rows, error }) => {
          if (!error) {
            const nextIds = (rows ?? []).map((row) => String(row.conference_id));
            setFollowedIds(nextIds);
            window.localStorage.setItem(FOLLOWED_KEY, JSON.stringify(nextIds));
          }
        });
    });
  }, []);

  const followedConferences = useMemo(
    () => conferences.filter((conference) => followedIds.includes(conference.id)),
    [conferences, followedIds],
  );

  const toggleFollow = async (id: string) => {
    const supabase = createClient();
    if (!supabase) {
      setFollowedIds((current) => current.filter((item) => item !== id));
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return;
    }

    await supabase.from("followed_conferences").delete().eq("user_id", userData.user.id).eq("conference_id", id);
    setFollowedIds((current) => current.filter((item) => item !== id));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Takip</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Takip ettiklerim</h1>
          </div>
          <Link href="/" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Ana sayfa
          </Link>
        </div>

        {followedConferences.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Henüz takip ettiğiniz konferans yok.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {followedConferences.map((conference) => (
              <ConferenceCard
                key={conference.id}
                conference={conference}
                isFollowing={true}
                onToggleFollow={toggleFollow}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
