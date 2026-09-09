"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Dashboard from "@/components/modules/Dashboard";
import {
  AccountsModule, JournalModule, ChequesModule, PettyCashModule,
  BankModule, TaxModule, FinancialReportsModule,
} from "@/components/modules/Accounting";
import {
  WarehousesModule, ProductsModule, StockDocumentsModule,
  StocktakeModule, InventoryAlertsModule,
} from "@/components/modules/Inventory";
import {
  AssetsListModule, DepreciationModule, MaintenanceModule,
} from "@/components/modules/Assets";
import {
  SalesInvoicesModule, CustomersModule, CommissionModule,
  PurchaseInvoicesModule, SuppliersModule,
} from "@/components/modules/SalesPurchase";
import {
  UsersModule, PermissionsModule, CustomizeModule, FontsModule,
  AuditModule, BackupModule,
} from "@/components/modules/Admin";
import { MoadianModule, BaleModule } from "@/components/modules/Integrations";
import ReportsModule from "@/components/modules/Reports";
import SettingsModule from "@/components/modules/Settings";
import { cn } from "@/lib/utils";

const MODULE_MAP: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  "accounting-accounts": AccountsModule,
  "accounting-journal": JournalModule,
  "accounting-cheques": ChequesModule,
  "accounting-petty": PettyCashModule,
  "accounting-bank": BankModule,
  "accounting-tax": TaxModule,
  "accounting-moadian": MoadianModule,
  "accounting-reports": FinancialReportsModule,
  "inventory-warehouses": WarehousesModule,
  "inventory-products": ProductsModule,
  "inventory-documents": StockDocumentsModule,
  "inventory-stocktake": StocktakeModule,
  "inventory-alerts": InventoryAlertsModule,
  "assets-list": AssetsListModule,
  "assets-depreciation": DepreciationModule,
  "assets-maintenance": MaintenanceModule,
  "sales-invoices": SalesInvoicesModule,
  "sales-customers": CustomersModule,
  "sales-commission": CommissionModule,
  "purchase-invoices": PurchaseInvoicesModule,
  "purchase-suppliers": SuppliersModule,
  reports: ReportsModule,
  "admin-users": UsersModule,
  "admin-permissions": PermissionsModule,
  "admin-customize": CustomizeModule,
  "admin-fonts": FontsModule,
  "admin-bale": BaleModule,
  "admin-audit": AuditModule,
  "admin-backup": BackupModule,
  settings: SettingsModule,
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, activeModule, sidebarCollapsed, currentUser } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  // Apply theme CSS variables
  useEffect(() => {
    if (!currentUser?.theme) return;
    const t = currentUser.theme;
    const root = document.documentElement;
    root.style.setProperty("--color-primary", t.primaryColor);
    root.style.setProperty("--color-secondary", t.secondaryColor);
    root.style.setProperty("--color-accent", t.accentColor);
    root.style.setProperty("--font-family", `'${t.fontFamily}', Tahoma, sans-serif`);
    root.style.setProperty(
      "--font-size-base",
      t.fontSize === "sm" ? "13px" : t.fontSize === "lg" ? "16px" : "14px"
    );
    root.style.setProperty(
      "--radius",
      t.borderRadius === "none" ? "0px" : t.borderRadius === "sm" ? "4px" : t.borderRadius === "lg" ? "12px" : "8px"
    );
    root.style.setProperty(
      "--radius-lg",
      t.borderRadius === "none" ? "0px" : t.borderRadius === "sm" ? "6px" : t.borderRadius === "lg" ? "16px" : "12px"
    );
    document.body.style.fontFamily = `'${t.fontFamily}', Tahoma, sans-serif`;
  }, [currentUser?.theme]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-pulse text-slate-400 text-sm">در حال بررسی احراز هویت...</div>
      </div>
    );
  }

  const ActiveComponent = MODULE_MAP[activeModule] || Dashboard;
  const density = currentUser?.theme?.density || "comfortable";

  return (
    <div className={cn("min-h-screen bg-slate-100", `density-${density}`)}>
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarCollapsed ? "mr-[68px]" : "mr-[280px]"
        )}
      >
        <Header />
        <main className="p-4 sm:p-6 max-w-[1600px]">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
