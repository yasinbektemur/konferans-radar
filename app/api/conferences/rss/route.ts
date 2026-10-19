import { NextResponse } from "next/server";
import { getAllConferences } from "@/lib/data";

export async function GET() {
  const conferences = getAllConferences();
  const items = conferences
    .map(
      (conference) => `
        <item>
          <title><![CDATA[${conference.name}]]></title>
          <link>${conference.officialUrl || "https://example.com"}</link>
          <guid>${conference.id}</guid>
          <pubDate>${conference.lastVerified ? new Date(conference.lastVerified).toUTCString() : new Date().toUTCString()}</pubDate>
          <description><![CDATA[${conference.description}]]></description>
        </item>`,
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Konferans Takip RSS</title>
      <link>https://example.com</link>
      <description>Toplanan konferans, hibe ve etkinlik listesi.</description>
      ${items}
    </channel>
  </rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
