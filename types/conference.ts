export type ConferenceMode = "onsite" | "online" | "hybrid";
export type ConferenceTrustLevel = "verified" | "unknown" | "suspicious";
export type ConferenceType =
  | "conference"
  | "workshop"
  | "grant"
  | "competition"
  | "fair";
export type DeadlineKey =
  | "abstract"
  | "fullPaper"
  | "notification"
  | "registration"
  | "cameraReady";
export type PublicationPublisher = "IEEE" | "Springer" | "Elsevier" | "Diğer" | "Yok";

export interface Conference {
  id: string;
  name: string;
  acronym: string;
  description: string;
  startDate?: string | null;
  endDate?: string | null;
  city: string;
  country: string;
  mode: ConferenceMode;
  topics: string[];
  deadlines: Partial<Record<DeadlineKey, string>>;
  publication: {
    publisher: PublicationPublisher;
    indexing: string[];
  };
  fees: {
    amount?: number | null;
    currency?: string | null;
    studentDiscount?: boolean;
    scholarship?: boolean;
    notes?: string;
  };
  officialUrl: string;
  source: string;
  lastVerified?: string | null;
  trustLevel: ConferenceTrustLevel;
  trustNotes?: string;
  type: ConferenceType;
}
