import { readFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL ve service role key eksik. .env.example örneğini kontrol edin.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const filePath = path.join(process.cwd(), "data", "conferences.json");
const raw = readFileSync(filePath, "utf8");
const conferences = JSON.parse(raw);

type ConferenceSeed = {
  id: string;
  name: string;
  acronym?: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  city?: string;
  country?: string;
  mode?: string;
  topics?: string[];
  deadlines?: Record<string, string>;
  publication?: Record<string, unknown>;
  fees?: Record<string, unknown>;
  officialUrl?: string;
  source?: string;
  lastVerified?: string | null;
  trustLevel?: string;
  trustNotes?: string | null;
  type?: string;
};

const rows = (conferences as ConferenceSeed[]).map((conference) => ({
  id: conference.id,
  name: conference.name,
  acronym: conference.acronym,
  description: conference.description,
  start_date: conference.startDate ?? null,
  end_date: conference.endDate ?? null,
  city: conference.city,
  country: conference.country,
  mode: conference.mode,
  topics: conference.topics ?? [],
  deadlines: conference.deadlines ?? {},
  publication: conference.publication ?? {},
  fees: conference.fees ?? {},
  official_url: conference.officialUrl,
  source: conference.source,
  last_verified: conference.lastVerified ?? null,
  trust_level: conference.trustLevel,
  trust_notes: conference.trustNotes ?? null,
  type: conference.type,
}));

const { error } = await supabase.from("conferences").upsert(rows, { onConflict: "id" });

if (error) {
  throw error;
}

console.log(`Seeded ${rows.length} conference rows to Supabase.`);
