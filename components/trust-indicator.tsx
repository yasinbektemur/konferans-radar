import type { Conference } from "@/types/conference";

const trustStyles: Record<Conference["trustLevel"], { label: string; classes: string }> = {
  verified: { label: "Doğrulandı", classes: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800" },
  unknown: { label: "Kontrol ediliyor", classes: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800" },
  suspicious: { label: "Dikkat", classes: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-800" },
};

export function TrustBadge({ trustLevel }: { trustLevel: Conference["trustLevel"] }) {
  const style = trustStyles[trustLevel] ?? trustStyles.unknown;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${style.classes}`}>
      {style.label}
    </span>
  );
}

export function TrustChecklist({ conference }: { conference: Conference }) {
  const checks = [
    {
      label: "Yayıncı belli mi?",
      ok: Boolean(conference.publication.publisher && conference.publication.publisher !== "Diğer" && conference.publication.publisher !== "Yok"),
    },
    {
      label: "İndeks doğrulanabilir mi?",
      ok: conference.publication.indexing.length > 0,
    },
    {
      label: "Yönetim kurulu gerçek mi?",
      ok: conference.trustLevel === "verified" || /univ|edu|society|institute|org/i.test(conference.officialUrl),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Güven kontrol listesi</h3>
        <TrustBadge trustLevel={conference.trustLevel} />
      </div>

      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center justify-between gap-3">
            <span>{check.label}</span>
            <span className={check.ok ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"}>
              {check.ok ? "✓" : "!"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
