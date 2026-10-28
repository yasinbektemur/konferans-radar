import type { Metadata } from "next";
import { FollowedList } from "@/components/followed-list";
import { getAllConferences } from "@/lib/data";

export const metadata: Metadata = {
  title: "Takip ettiklerim",
  description: "Takip ettiğiniz konferanslar, yaklaşan deadline’lar ve odaklanmış takvim görünümü.",
};

export default function FollowedPage() {
  return <FollowedList conferences={getAllConferences()} />;
}
