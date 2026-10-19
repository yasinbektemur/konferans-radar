import type { Conference } from "@/types/conference";

export type ConferenceCoordinates = {
  lat: number;
  lng: number;
};

const cityCoordinates: Record<string, ConferenceCoordinates> = {
  munchen: { lat: 48.1351, lng: 11.582 },
  kopenhag: { lat: 55.6761, lng: 12.5683 },
  izmir: { lat: 38.4237, lng: 27.1428 },
  istanbul: { lat: 41.0082, lng: 28.9784 },
  boston: { lat: 42.3601, lng: -71.0589 },
  london: { lat: 51.5072, lng: -0.1276 },
  ankara: { lat: 39.9334, lng: 32.8597 },
  seoul: { lat: 37.5665, lng: 126.978 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  berlin: { lat: 52.52, lng: 13.405 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
};

const countryCenters: Record<string, ConferenceCoordinates> = {
  almanya: { lat: 51.1657, lng: 10.4515 },
  danimarka: { lat: 56.2639, lng: 9.5018 },
  türkiye: { lat: 38.9637, lng: 35.2433 },
  abd: { lat: 39.8283, lng: -98.5795 },
  "birleşik krallık": { lat: 55.3781, lng: -3.436 },
  "güney kore": { lat: 35.9078, lng: 127.7669 },
  japonya: { lat: 36.2048, lng: 138.2529 },
  ispanya: { lat: 40.4637, lng: -3.7492 },
  "fransa": { lat: 46.2276, lng: 2.2137 },
};

function normalize(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getConferenceCoordinates(conference: Conference): ConferenceCoordinates {
  const cityKey = normalize(conference.city);
  const countryKey = normalize(conference.country);

  if (cityCoordinates[cityKey]) {
    return cityCoordinates[cityKey];
  }

  if (countryCenters[countryKey]) {
    return countryCenters[countryKey];
  }

  return { lat: 20, lng: 0 };
}
