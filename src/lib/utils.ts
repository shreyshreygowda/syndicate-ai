import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | number | string): string {
  const d =
    typeof date === "number"
      ? new Date(date)
      : typeof date === "string"
        ? new Date(date)
        : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}

export function generateTitle(content: string): string {
  const cleaned = content.replace(/\n/g, " ").trim();
  return truncate(cleaned, 60) || "New Chat";
}
