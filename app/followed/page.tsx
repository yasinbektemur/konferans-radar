import { FollowedList } from "@/components/followed-list";
import { getAllConferences } from "@/lib/data";

export default function FollowedPage() {
  return <FollowedList conferences={getAllConferences()} />;
}
