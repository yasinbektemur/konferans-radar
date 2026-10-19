import conferencesData from "@/data/conferences.json";
import type { Conference } from "@/types/conference";

export const conferences: Conference[] = conferencesData as Conference[];

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
