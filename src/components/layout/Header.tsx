"use client";

import { useAppStore } from "@/lib/store";
import { Bell, Search } from "lucide-react";
import { useState } from "react";

const moduleTitles: Record<string, string> = {
  dashboard: "داشبورد مدیریتی",
  "accounting-accounts": "دفتر حساب‌ها",
  "accounting-journal": "اسناد حسابداری",
  "accounting-cheques": "چک و اوراق بهادار",
  "accounting-petty": "تنخواه‌گردان",
  "accounting-bank": "مغایرت‌گیری بانکی",
  "accounting-tax": "مالیات و ارزش افزوده",
  "accounting-moadian": "سامانه مودیان",
  "accounting-reports": "گزارش‌های مالی",
  "inventory-warehouses": "مدیریت انبارها",
  "inventory-products": "شناسنامه کالا",
  "inventory-documents": "اسناد انبار",
  "inventory-stocktake": "انبارگردانی",
  "inventory-alerts": "هشدار موجودی",
  "assets-list": "لیست اموال و دارایی‌ها",
  "assets-depreciation": "محاسبه استهلاک",
  "assets-maintenance": "تعمیر و نگهداری",
  "sales-invoices": "فاکتورهای فروش",
  "sales-customers": "مدیریت مشتریان",
  "sales-commission": "پورسانت بازاریابان",
  "purchase-invoices": "چرخه خرید",
  "purchase-suppliers": "تامین‌کنندگان",
  reports: "گزارش‌ساز و داشبورد KPI",
  "admin-users": "مدیریت کاربران",
  "admin-permissions": "سطوح دسترسی (RBAC)",
  "admin-customize": "سفارشی‌سازی پنل کاربران",
  "admin-fonts": "مدیریت فونت‌ها",
  "admin-bale": "اعلان‌های بله (Bale)",
  "admin-audit": "لاگ حسابرسی",
  "admin-backup": "پشتیبان‌گیری",
  settings: "تنظیمات سیستم",
};

export default function Header() {
  const { activeModule, currentUser, cheques, products } = useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);

  const lowStock = products.filter((p) => p.stock <= p.reorderPoint);
  const pendingCheques = cheques.filter((c) => c.status === "pending");
  const notifCount = lowStock.length + pendingCheques.length;

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            {moduleTitles[activeModule] || "داشبورد"}
          </h2>
          <p className="text-[11px] text-slate-400">
            {new Date().toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="جستجوی سریع..."
            className="w-56 bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-500" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                {notifCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="font-semibold text-sm text-slate-800">اعلان‌ها</h3>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {lowStock.map((p) => (
                    <div key={p.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-700">موجودی کم: {p.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">موجودی: {p.stock} | نقطه سفارش: {p.reorderPoint}</p>
                      </div>
                    </div>
                  ))}
                  {pendingCheques.map((c) => (
                    <div key={c.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          چک {c.type === "received" ? "دریافتی" : "پرداختی"} سررسید
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {c.party} - شماره {c.number}
                        </p>
                      </div>
                    </div>
                  ))}
                  {notifCount === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">اعلان جدیدی نیست</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        {currentUser && (
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-700">{currentUser.fullName}</p>
              <p className="text-[10px] text-slate-400">{currentUser.department}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
