import { cn } from "@/components/ui/button";

export function Badge({ className, tone = "default", children }: { className?: string; tone?: "default" | "success" | "warning" | "danger"; children: React.ReactNode }) {
  const toneClasses = {
    default: "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-800",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
    warning: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
    danger: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-800",
  };

  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
