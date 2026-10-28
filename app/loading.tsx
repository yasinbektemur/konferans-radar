export default function Loading() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="skeleton h-24 rounded-3xl border border-slate-200/80 dark:border-slate-800" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`loading-${index}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-0 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
              <div className="skeleton h-28 w-full" />
              <div className="space-y-4 p-4">
                <div className="skeleton h-4 w-24 rounded-full" />
                <div className="skeleton h-6 w-2/3 rounded-xl" />
                <div className="skeleton h-4 w-1/2 rounded-xl" />
                <div className="grid gap-2">
                  <div className="skeleton h-4 w-full rounded-xl" />
                  <div className="skeleton h-4 w-4/5 rounded-xl" />
                </div>
                <div className="flex gap-2">
                  <div className="skeleton h-10 flex-1 rounded-xl" />
                  <div className="skeleton h-10 w-20 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
