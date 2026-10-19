import { NextResponse } from "next/server";
import { getAllConferences } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    count: getAllConferences().length,
    data: getAllConferences(),
  });
}
