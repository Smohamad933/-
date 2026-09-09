"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Calculator, Warehouse, Building2, ShoppingCart,
  FileBarChart, Settings, Shield, ChevronRight,
  ChevronLeft, LogOut, Truck, Landmark,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "داشبورد مدیریتی", icon: LayoutDashboard, module: "dashboard" },
  {
    id: "accounting", label: "حسابداری مالی", icon: Calculator, module: "accounting",
    children: [
      { id: "accounting-accounts", label: "دفتر حساب‌ها" },
      { id: "accounting-journal", label: "اسناد حسابداری" },
      { id: "accounting-cheques", label: "چک و اوراق بهادار" },
      { id: "accounting-petty", label: "تنخواه‌گردان" },
      { id: "accounting-bank", label: "مغایرت‌گیری بانکی" },
      { id: "accounting-tax", label: "مالیات و ارزش افزوده" },
      { id: "accounting-moadian", label: "سامانه مودیان" },
      { id: "accounting-reports", label: "گزارش‌های مالی" },
    ],
  },
  {
    id: "inventory", label: "انبارداری و لجستیک", icon: Warehouse, module: "inventory",
    children: [
      { id: "inventory-warehouses", label: "مدیریت انبارها" },
      { id: "inventory-products", label: "شناسنامه کالا" },
      { id: "inventory-documents", label: "اسناد انبار" },
      { id: "inventory-stocktake", label: "انبارگردانی" },
      { id: "inventory-alerts", label: "هشدار موجودی" },
    ],
  },
  {
    id: "assets", label: "دارایی‌های ثابت", icon: Building2, module: "assets",
    children: [
      { id: "assets-list", label: "لیست اموال" },
      { id: "assets-depreciation", label: "محاسبه استهلاک" },
      { id: "assets-maintenance", label: "تعمیر و نگهداری" },
    ],
  },
  {
    id: "sales", label: "فروش و بازرگانی", icon: ShoppingCart, module: "sales",
    children: [
      { id: "sales-invoices", label: "فاکتورهای فروش" },
      { id: "sales-customers", label: "مشتریان" },
      { id: "sales-commission", label: "پورسانت" },
    ],
  },
  {
    id: "purchase", label: "خرید و تدارکات", icon: Truck, module: "purchase",
    children: [
      { id: "purchase-invoices", label: "چرخه خرید" },
      { id: "purchase-suppliers", label: "تامین‌کنندگان" },
    ],
  },
  { id: "reports", label: "گزارش‌ساز و KPI", icon: FileBarChart, module: "reports" },
  {
    id: "admin", label: "پنل مدیریت", icon: Shield, module: "admin",
    children: [
      { id: "admin-users", label: "مدیریت کاربران" },
      { id: "admin-permissions", label: "سطوح دسترسی" },
      { id: "admin-customize", label: "سفارشی‌سازی پنل" },
      { id: "admin-fonts", label: "مدیریت فونت‌ها" },
      { id: "admin-bale", label: "اعلان‌های بله" },
      { id: "admin-audit", label: "لاگ حسابرسی" },
      { id: "admin-backup", label: "پشتیبان‌گیری" },
    ],
  },
  { id: "settings", label: "تنظیمات سیستم", icon: Settings, module: "settings" },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, activeModule, setActiveModule, currentUser, logout, settings } = useAppStore();
  const theme = currentUser?.theme || settings.globalTheme;

  const canView = (module: string) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    const perm = currentUser.permissions.find((p) => p.module === module);
    return perm?.view ?? false;
  };

  const sidebarBg =
    theme.sidebarStyle === "dark"
      ? "bg-slate-900 text-slate-300"
      : theme.sidebarStyle === "colored"
      ? "text-white"
      : "bg-white text-slate-700 border-l border-slate-200";

  const coloredStyle = theme.sidebarStyle === "colored"
    ? { backgroundColor: theme.primaryColor }
    : {};

  return (
    <aside
      className={cn(
        "fixed top-0 right-0 h-full z-40 flex flex-col transition-all duration-300 shadow-xl",
        sidebarCollapsed ? "w-[68px]" : "w-[280px]",
        sidebarBg
      )}
      style={coloredStyle}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 h-16 border-b shrink-0",
        theme.sidebarStyle === "dark" ? "border-slate-700/50" :
        theme.sidebarStyle === "colored" ? "border-white/10" : "border-slate-200"
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0">
          <Landmark className="w-5 h-5" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <h1 className={cn("font-bold text-sm truncate", theme.sidebarStyle === "light" ? "text-slate-800" : "text-white")}>
              آریا ERP
            </h1>
            <p className={cn("text-[10px] truncate", theme.sidebarStyle === "light" ? "text-slate-400" : "text-white/50")}>
              {settings.companyName}
            </p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {menuItems.filter((item) => canView(item.module)).map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id || activeModule.startsWith(item.id + "-");
          const isExpanded = isActive && item.children;

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.children) {
                    setActiveModule(item.children[0].id);
                  } else {
                    setActiveModule(item.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group",
                  isActive
                    ? theme.sidebarStyle === "light"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "bg-white/15 text-white font-medium"
                    : theme.sidebarStyle === "light"
                    ? "hover:bg-slate-100 text-slate-600"
                    : "hover:bg-white/10 text-inherit opacity-80 hover:opacity-100"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "scale-110")} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-right truncate">{item.label}</span>
                    {item.children && (
                      <ChevronLeft className={cn("w-4 h-4 transition-transform", isExpanded && "-rotate-90")} />
                    )}
                  </>
                )}
              </button>

              {/* Sub-menu */}
              {item.children && isExpanded && !sidebarCollapsed && (
                <div className="mr-4 mt-0.5 space-y-0.5 border-r border-white/10 pr-2">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setActiveModule(child.id)}
                      className={cn(
                        "w-full text-right px-3 py-2 rounded-lg text-xs transition-all",
                        activeModule === child.id
                          ? theme.sidebarStyle === "light"
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "bg-white/20 text-white font-medium"
                          : theme.sidebarStyle === "light"
                          ? "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User & Collapse */}
      <div className={cn(
        "border-t p-3 shrink-0",
        theme.sidebarStyle === "dark" ? "border-slate-700/50" :
        theme.sidebarStyle === "colored" ? "border-white/10" : "border-slate-200"
      )}>
        {!sidebarCollapsed && currentUser && (
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-xs font-medium truncate", theme.sidebarStyle === "light" ? "text-slate-800" : "text-white")}>
                {currentUser.fullName}
              </p>
              <p className={cn("text-[10px] truncate", theme.sidebarStyle === "light" ? "text-slate-400" : "text-white/50")}>
                {currentUser.role === "admin" ? "مدیر سیستم" :
                 currentUser.role === "accountant" ? "حسابدار" :
                 currentUser.role === "warehouse" ? "انباردار" :
                 currentUser.role === "sales" ? "فروشنده" :
                 currentUser.role === "manager" ? "مدیر" : "مشاهده‌گر"}
              </p>
            </div>
            <button
              onClick={logout}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                theme.sidebarStyle === "light" ? "hover:bg-red-50 text-red-500" : "hover:bg-white/10 text-white/60 hover:text-red-300"
              )}
              title="خروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-colors",
            theme.sidebarStyle === "light" ? "hover:bg-slate-100 text-slate-500" : "hover:bg-white/10 text-white/50"
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> جمع کردن منو</>}
        </button>
      </div>
    </aside>
  );
}
