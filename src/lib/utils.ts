import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers into compact strings with 'k', 'M', 'B', 'T'.
 * e.g. 1500 -> "1.5k", 25000 -> "25k", 1500000 -> "1.5M"
 */
export function formatCompactNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num) || num === 0) return "0";

  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 1e12) {
    return `${sign}${(abs / 1e12).toFixed(2).replace(/\.?0+$/, "")}T`;
  }
  if (abs >= 1e9) {
    return `${sign}${(abs / 1e9).toFixed(2).replace(/\.?0+$/, "")}B`;
  }
  if (abs >= 1e6) {
    return `${sign}${(abs / 1e6).toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (abs >= 1e3) {
    return `${sign}${(abs / 1e3).toFixed(2).replace(/\.?0+$/, "")}k`;
  }

  return `${sign}${abs.toLocaleString("en-IN")}`;
}
