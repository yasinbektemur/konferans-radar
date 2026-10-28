import type { Metadata } from "next";
import { ConferenceDashboard } from "@/components/conference-dashboard";
import { getAllConferences } from "@/lib/data";

export const metadata: Metadata = {
  title: "Ana sayfa",
  description: "Biyomedikal AR-GE konferans çağrıları, deadline takibi ve güvenilir filtreleme arayüzü.",
};

export default function Home() {
  return <ConferenceDashboard initialConferences={getAllConferences()} />;
}
