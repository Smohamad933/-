import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "آریا ERP | سیستم جامع مدیریت منابع سازمانی",
  description: "سیستم ERP فارسی — حسابداری مالی، انبارداری، دارایی ثابت، خرید و فروش",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
