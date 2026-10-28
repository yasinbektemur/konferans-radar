"use client";

import * as React from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const variantClass = {
    primary: "bg-brand-600 text-white hover:bg-brand-500 shadow-soft",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
  }[variant];

  const sizeClass = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  }[size];

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-transparent font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-950",
        variantClass,
        sizeClass,
        className,
      )}
      {...props}
    />
  );
}
