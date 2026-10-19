import type { Conference } from "@/types/conference";

export type ProjectMatchResult = {
  conference: Conference;
  score: number;
  matchedTopics: string[];
  reason: string;
};

const STOP_WORDS = new Set([
  "bir", "bu", "ben", "için", "ile", "ve", "ile", "iletişim", "araştırma", "uygulama", "geliştirme",
  "the", "and", "for", "with", "into", "from", "that", "this", "project", "study", "research"
]);

function normalizeTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç\s]/gi, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function intersectionCount(left: Set<string>, right: Set<string>): number {
  let count = 0;
  for (const item of left) {
    if (right.has(item)) {
      count += 1;
    }
  }
  return count;
}

export function computeProjectMatchScore(projectTitle: string, projectKeywords: string[], conference: Conference) {
  const projectText = [projectTitle, projectKeywords.join(" ")].join(" ");
  const projectTokens = new Set(normalizeTokens(projectText));
  const conferenceTokens = new Set(
    normalizeTokens(
      [
        conference.name,
        conference.acronym,
        conference.description,
        conference.city,
        conference.country,
        conference.topics.join(" "),
      ].join(" "),
    ),
  );

  const topicMatches = conference.topics.filter((topic) => {
    const topicTokens = normalizeTokens(topic);
    return topicTokens.some((token) => projectTokens.has(token));
  });

  const overlap = intersectionCount(projectTokens, conferenceTokens);
  const weightedScore = overlap * 12 + topicMatches.length * 18 + (projectTokens.size === 0 ? 0 : Math.min(16, topicMatches.length * 4));
  const score = Math.min(100, Math.max(0, Math.round(weightedScore)));

  const matchedTopics = topicMatches.slice(0, 4);
  const reason =
    score >= 70
      ? `${matchedTopics.length > 0 ? matchedTopics.join(", ") : "anahtar konu"} ile güçlü örtüşme var.`
      : score >= 40
        ? "Konu benzerliği orta düzeyde; ek filtreler kullanılabilir."
        : "Anahtar kelime eşleşmesi zayıf; daha spesifik bir proje tanımı ekleyin.";

  return {
    score,
    matchedTopics,
    reason,
  };
}

export function getConferenceMatches(
  conferences: Conference[],
  projectTitle: string,
  projectKeywords: string[],
): ProjectMatchResult[] {
  const normalizedTitle = projectTitle.trim();
  const normalizedKeywords = projectKeywords.flatMap((keyword) => keyword.split(",")).map((keyword) => keyword.trim()).filter(Boolean);

  if (!normalizedTitle && normalizedKeywords.length === 0) {
    return [];
  }

  return conferences
    .map((conference) => ({
      conference,
      ...computeProjectMatchScore(normalizedTitle || normalizedKeywords.join(" "), normalizedKeywords, conference),
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.conference.name.localeCompare(right.conference.name))
    .slice(0, 8)
    .map(({ conference, score, matchedTopics, reason }) => ({
      conference,
      score,
      matchedTopics,
      reason,
    }));
}

export function embeddingMatchEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ENABLE_EMBEDDING_MATCHING === "true");
}
