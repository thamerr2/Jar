import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "SAR"): string {
  const num = Number(amount);
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

export function formatDate(date: string | Date, lang = "ar"): string {
  try {
    return new Date(date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  } catch {
    return String(date);
  }
}

export function formatDistanceShort(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "";
  }
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function cityToGradient(city: string): string {
  const gradients = [
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-green-400 to-green-600",
    "from-orange-400 to-orange-600",
    "from-pink-400 to-pink-600",
    "from-teal-400 to-teal-600",
    "from-indigo-400 to-indigo-600",
    "from-cyan-400 to-cyan-600"
  ];
  let hash = 0;
  for (let i = 0; i < city.length; i++) hash = city.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}
