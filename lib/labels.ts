import type { ConferenceMode, ConferenceTrustLevel, ConferenceType, DeadlineKey } from "@/types/conference";

export const MODE_LABELS: Record<ConferenceMode, string> = {
  onsite: "Yüz yüze",
  hybrid: "Hibrit",
  online: "Online",
};

export const TRUST_LABELS: Record<ConferenceTrustLevel, string> = {
  verified: "Doğrulandı",
  unknown: "Doğrulanmadı",
  suspicious: "Şüpheli",
};

export const TYPE_LABELS: Record<ConferenceType, string> = {
  conference: "Konferans",
  workshop: "Atölye",
  grant: "Hibe",
  competition: "Yarışma",
  fair: "Fuar",
};

export const DEADLINE_LABELS: Record<DeadlineKey, string> = {
  abstract: "Özet",
  fullPaper: "Tam metin",
  notification: "Kabul bildirimi",
  registration: "Kayıt",
  cameraReady: "Kamera hazır",
};

export function formatModeLabel(mode: ConferenceMode): string {
  return MODE_LABELS[mode] ?? mode;
}

export function formatTrustLabel(level: ConferenceTrustLevel): string {
  return TRUST_LABELS[level] ?? level;
}

export function formatConferenceType(type: ConferenceType): string {
  return TYPE_LABELS[type] ?? type;
}

export function formatDeadlineLabel(key: DeadlineKey): string {
  return DEADLINE_LABELS[key] ?? key;
}
