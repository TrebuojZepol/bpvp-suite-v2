import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPct(n: number, digits = 2) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", {
    notation: n >= 1e6 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(n);
}
