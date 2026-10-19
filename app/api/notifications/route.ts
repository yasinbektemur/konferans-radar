import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/notifications/dispatch";

export async function GET() {
  const supabase = await getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Notification check endpoint is active." });
}
