import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "IRR"): string {
  return new Intl.NumberFormat("fa-IR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + (currency === "IRR" ? " ریال" : "");
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function toPersianDigits(str: string | number): string {
  const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/[0-9]/g, (d) => persian[parseInt(d)]);
}
