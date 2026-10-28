import { createClient } from "@supabase/supabase-js";
import conferencesData from "@/data/conferences.json";
import type { Conference, ConferenceMode, ConferenceTrustLevel, ConferenceType } from "@/types/conference";

const fallbackConferences: Conference[] = conferencesData as Conference[];

function normalizeMode(value: unknown): ConferenceMode {
  return value === "online" || value === "hybrid" || value === "onsite" ? value : "onsite";
}

function normalizeTrustLevel(value: unknown): ConferenceTrustLevel {
  return value === "verified" || value === "suspicious" || value === "unknown" ? value : "unknown";
}

function normalizeConferenceType(value: unknown): ConferenceType {
  return value === "conference" || value === "workshop" || value === "grant" || value === "competition" || value === "fair"
    ? value
    : "conference";
}

function mapConferenceRow(row: Record<string, unknown>): Conference | null {
  if (!row || typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    name: String(row.ad ?? row.name ?? row.id),
    acronym: String(row.kisaltma ?? ""),
    description: String(row.aciklama ?? ""),
    startDate: typeof row.baslangic_tarihi === "string" ? row.baslangic_tarihi : null,
    endDate: typeof row.bitis_tarihi === "string" ? row.bitis_tarihi : null,
    city: String(row.sehir ?? ""),
    country: String(row.ulke ?? ""),
    mode: normalizeMode(row.mod),
    topics: Array.isArray(row.konular) ? row.konular.filter((item): item is string => typeof item === "string") : [],
    deadlines: {
      abstract: typeof row.ozet_son_tarih === "string" ? row.ozet_son_tarih : undefined,
      fullPaper: typeof row.tam_metin_son_tarih === "string" ? row.tam_metin_son_tarih : undefined,
      notification: typeof row.kabul_bildirimi === "string" ? row.kabul_bildirimi : undefined,
      registration: typeof row.kayit_son_tarih === "string" ? row.kayit_son_tarih : undefined,
      cameraReady: typeof row.kamera_hazir === "string" ? row.kamera_hazir : undefined,
    },
    publication: {
      publisher: String(row.yayinci ?? "Diğer") as Conference["publication"]["publisher"],
      indexing: Array.isArray(row.indeksler) ? row.indeksler.filter((item): item is string => typeof item === "string") : [],
    },
    fees: {
      amount: typeof row.ucret === "number" ? row.ucret : typeof row.ucret === "string" ? Number(row.ucret) : null,
      currency: typeof row.para_birimi === "string" ? row.para_birimi : null,
      studentDiscount: Boolean(row.ogrenci_indirimi),
      scholarship: Boolean(row.burs),
      notes: undefined,
    },
    officialUrl: String(row.resmi_link ?? ""),
    source: String(row.kaynak ?? ""),
    lastVerified: typeof row.son_dogrulama === "string" ? row.son_dogrulama : null,
    trustLevel: normalizeTrustLevel(row.guven),
    trustNotes: typeof row.guven_notu === "string" ? row.guven_notu : undefined,
    type: normalizeConferenceType(row.tur),
  };
}

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function loadConferencesFromSupabase(): Promise<{ data: Conference[]; isFallback: boolean }> {
  const supabase = createSupabase();

  if (!supabase) {
    return { data: fallbackConferences, isFallback: true };
  }

  try {
    const { data, error } = await supabase.from("conferences").select("*").order("baslangic_tarihi", { ascending: true, nullsFirst: false });

    if (error || !data || data.length === 0) {
      return { data: fallbackConferences, isFallback: true };
    }

    const mapped = data.map((row) => mapConferenceRow(row as Record<string, unknown>)).filter((item): item is Conference => Boolean(item));

    if (!mapped.length) {
      return { data: fallbackConferences, isFallback: true };
    }

    return { data: mapped, isFallback: false };
  } catch {
    return { data: fallbackConferences, isFallback: true };
  }
}

const loadedData = await loadConferencesFromSupabase();

export const conferences: Conference[] = loadedData.data;
export const isUsingFallbackConferences = loadedData.isFallback;

export function getAllConferences(): Conference[] {
  return conferences;
}

export function getConferenceById(id: string): Conference | undefined {
  return conferences.find((conference) => conference.id === id);
}

export function getCountries(): string[] {
  return [...new Set(conferences.map((conference) => conference.country))].sort();
}

export function getTopics(): string[] {
  return [...new Set(conferences.flatMap((conference) => conference.topics))].sort();
}

export function getPublicationPublishers(): string[] {
  return [...new Set(conferences.map((conference) => conference.publication.publisher))].sort();
}

export function getConferencesDataMode(): "supabase" | "fallback" {
  return isUsingFallbackConferences ? "fallback" : "supabase";
}
