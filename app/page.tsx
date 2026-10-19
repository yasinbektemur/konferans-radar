import { ConferenceDashboard } from "@/components/conference-dashboard";
import { getAllConferences } from "@/lib/data";

export default function Home() {
  return <ConferenceDashboard initialConferences={getAllConferences()} />;
}
