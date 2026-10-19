"use client";

import { Suspense } from "react";
import { notFound, useParams } from "next/navigation";
import { ConferenceDetail } from "@/components/conference-detail";
import { getConferenceById } from "@/lib/data";

export default function ConferencePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">Yükleniyor...</div>}>
      <ConferencePageContent />
    </Suspense>
  );
}

function ConferencePageContent() {
  const params = useParams<{ id: string }>();
  const conference = getConferenceById(params?.id ?? "");

  if (!conference) {
    notFound();
  }

  return <ConferenceDetail conference={conference} />;
}
