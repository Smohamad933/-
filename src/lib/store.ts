"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  UserTheme,
  Account,
  JournalEntry,
  Cheque,
  PettyCash,
  Warehouse,
  Product,
  StockDocument,
  FixedAsset,
  Customer,
  Supplier,
  SalesInvoice,
  PurchaseInvoice,
  AuditLog,
  SystemSettings,
  FontOption,
  Permission,
  BankReconciliation,
  StockCount,
  MoadianSubmission,
  MoadianInvoiceStatus,
} from "./types";
import { mockData } from "./mock-data";

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // Users & Admin
  users: User[];
  addUser: (user: Omit<User, "id" | "createdAt">) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  updateUserTheme: (userId: string, theme: Partial<UserTheme>) => void;
  updateUserPermissions: (userId: string, permissions: Permission[]) => void;

  // Settings
  settings: SystemSettings;
  updateSettings: (data: Partial<SystemSettings>) => void;
  addFont: (font: FontOption) => void;
  removeFont: (fontId: string) => void;

  // Accounting
  accounts: Account[];
  journalEntries: JournalEntry[];
  cheques: Cheque[];
  pettyCash: PettyCash[];
  reconciliations: BankReconciliation[];
  addAccount: (account: Omit<Account, "id">) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  addJournalEntry: (entry: Omit<JournalEntry, "id">) => void;
  addCheque: (cheque: Omit<Cheque, "id">) => void;
  updateCheque: (id: string, data: Partial<Cheque>) => void;
  addPettyCash: (pc: Omit<PettyCash, "id">) => void;

  // Inventory
  warehouses: Warehouse[];
  products: Product[];
  stockDocuments: StockDocument[];
  stockCounts: StockCount[];
  addWarehouse: (w: Omit<Warehouse, "id">) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  addStockDocument: (doc: Omit<StockDocument, "id">) => void;

  // Fixed Assets
  assets: FixedAsset[];
  addAsset: (a: Omit<FixedAsset, "id">) => void;
  updateAsset: (id: string, data: Partial<FixedAsset>) => void;

  // Sales & Purchase
  customers: Customer[];
  suppliers: Supplier[];
  salesInvoices: SalesInvoice[];
  purchaseInvoices: PurchaseInvoice[];
  addCustomer: (c: Omit<Customer, "id">) => void;
  addSupplier: (s: Omit<Supplier, "id">) => void;
  addSalesInvoice: (inv: Omit<SalesInvoice, "id">) => void;
  addPurchaseInvoice: (inv: Omit<PurchaseInvoice, "id">) => void;
  updateSalesInvoice: (id: string, data: Partial<SalesInvoice>) => void;

  // Audit
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;

  // Moadian
  moadianSubmissions: MoadianSubmission[];
  addMoadianSubmission: (sub: Omit<MoadianSubmission, "id" | "createdAt" | "updatedAt">) => void;
  updateMoadianSubmission: (id: string, data: Partial<MoadianSubmission>) => void;
  updateInvoiceMoadian: (
    invoiceId: string,
    data: {
      moadianStatus?: MoadianInvoiceStatus;
      moadianTaxId?: string;
      moadianUid?: string;
      moadianRefNumber?: string;
      moadianSentAt?: string;
      moadianError?: string;
      moadianPayload?: unknown;
    }
  ) => void;

  // UI
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeModule: string;
  setActiveModule: (m: string) => void;
}

const defaultPermissions = (role: string): Permission[] => {
  const modules = [
    "dashboard", "accounting", "inventory", "assets", "sales", "purchase",
    "reports", "admin", "settings", "customers", "suppliers",
  ];
  const full = { view: true, create: true, edit: true, delete: true, approve: true };
  const read = { view: true, create: false, edit: false, delete: false, approve: false };
  const write = { view: true, create: true, edit: true, delete: false, approve: false };

  return modules.map((module) => {
    let perms = read;
    if (role === "admin") perms = full;
    else if (role === "manager") perms = { ...full, delete: false };
    else if (role === "accountant" && ["accounting", "reports", "dashboard"].includes(module))
      perms = write;
    else if (role === "warehouse" && ["inventory", "dashboard"].includes(module))
      perms = write;
    else if (role === "sales" && ["sales", "customers", "dashboard", "purchase"].includes(module))
      perms = write;
    else if (module === "dashboard") perms = { ...read, view: true };
    return { module, ...perms };
  });
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      users: mockData.users,
      settings: mockData.settings,
      accounts: mockData.accounts,
      journalEntries: mockData.journalEntries,
      cheques: mockData.cheques,
      pettyCash: mockData.pettyCash,
      reconciliations: mockData.reconciliations,
      warehouses: mockData.warehouses,
      products: mockData.products,
      stockDocuments: mockData.stockDocuments,
      stockCounts: mockData.stockCounts,
      assets: mockData.assets,
      customers: mockData.customers,
      suppliers: mockData.suppliers,
      salesInvoices: mockData.salesInvoices,
      purchaseInvoices: mockData.purchaseInvoices,
      auditLogs: mockData.auditLogs,
      moadianSubmissions: [],
      sidebarCollapsed: false,
      activeModule: "dashboard",

      login: (username, password) => {
        const user = get().users.find(
          (u) => u.username === username && u.active
        );
        // Demo: any password works for demo users
        if (user && (password === "admin123" || password === "demo" || password.length >= 3)) {
          set({ currentUser: user, isAuthenticated: true });
          get().addAuditLog({
            userId: user.id,
            userName: user.fullName,
            action: "ورود به سیستم",
            module: "auth",
            details: `ورود موفق کاربر ${user.fullName}`,
          });
          return true;
        }
        return false;
      },

      logout: () => {
        const user = get().currentUser;
        if (user) {
          get().addAuditLog({
            userId: user.id,
            userName: user.fullName,
            action: "خروج از سیستم",
            module: "auth",
            details: `خروج کاربر ${user.fullName}`,
          });
        }
        set({ currentUser: null, isAuthenticated: false });
      },

      addUser: (userData) => {
        const id = `u-${Date.now()}`;
        const user: User = {
          ...userData,
          id,
          createdAt: new Date().toISOString(),
          permissions: userData.permissions?.length
            ? userData.permissions
            : defaultPermissions(userData.role),
        };
        set({ users: [...get().users, user] });
        get().addAuditLog({
          userId: get().currentUser?.id || "system",
          userName: get().currentUser?.fullName || "سیستم",
          action: "ایجاد کاربر",
          module: "admin",
          entityId: id,
          entityType: "user",
          details: `کاربر جدید: ${user.fullName}`,
        });
      },

      updateUser: (id, data) => {
        set({
          users: get().users.map((u) => (u.id === id ? { ...u, ...data } : u)),
        });
        if (get().currentUser?.id === id) {
          set({ currentUser: { ...get().currentUser!, ...data } });
        }
        get().addAuditLog({
          userId: get().currentUser?.id || "system",
          userName: get().currentUser?.fullName || "سیستم",
          action: "ویرایش کاربر",
          module: "admin",
          entityId: id,
          entityType: "user",
          details: `ویرایش کاربر ${id}`,
        });
      },

      deleteUser: (id) => {
        set({ users: get().users.filter((u) => u.id !== id) });
        get().addAuditLog({
          userId: get().currentUser?.id || "system",
          userName: get().currentUser?.fullName || "سیستم",
          action: "حذف کاربر",
          module: "admin",
          entityId: id,
          entityType: "user",
          details: `حذف کاربر ${id}`,
        });
      },

      updateUserTheme: (userId, theme) => {
        const users = get().users.map((u) =>
          u.id === userId
            ? { ...u, theme: { ...u.theme!, ...theme } as UserTheme }
            : u
        );
        set({ users });
        if (get().currentUser?.id === userId) {
          set({
            currentUser: {
              ...get().currentUser!,
              theme: { ...get().currentUser!.theme!, ...theme } as UserTheme,
            },
          });
        }
      },

      updateUserPermissions: (userId, permissions) => {
        get().updateUser(userId, { permissions });
      },

      updateSettings: (data) => {
        set({ settings: { ...get().settings, ...data } });
      },

      addFont: (font) => {
        set({
          settings: {
            ...get().settings,
            availableFonts: [...get().settings.availableFonts, font],
          },
        });
      },

      removeFont: (fontId) => {
        set({
          settings: {
            ...get().settings,
            availableFonts: get().settings.availableFonts.filter(
              (f) => f.id !== fontId
            ),
          },
        });
      },

      addAccount: (account) => {
        const id = `acc-${Date.now()}`;
        set({ accounts: [...get().accounts, { ...account, id }] });
      },

      updateAccount: (id, data) => {
        set({
          accounts: get().accounts.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        });
      },

      addJournalEntry: (entry) => {
        const id = `je-${Date.now()}`;
        set({
          journalEntries: [
            { ...entry, id },
            ...get().journalEntries,
          ],
        });
        get().addAuditLog({
          userId: get().currentUser?.id || "system",
          userName: get().currentUser?.fullName || "سیستم",
          action: "صدور سند حسابداری",
          module: "accounting",
          entityId: id,
          details: `سند شماره ${entry.number}`,
        });
      },

      addCheque: (cheque) => {
        set({
          cheques: [{ ...cheque, id: `chq-${Date.now()}` }, ...get().cheques],
        });
      },

      updateCheque: (id, data) => {
        set({
          cheques: get().cheques.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        });
      },

      addPettyCash: (pc) => {
        set({
          pettyCash: [
            { ...pc, id: `pc-${Date.now()}` },
            ...get().pettyCash,
          ],
        });
      },

      addWarehouse: (w) => {
        set({
          warehouses: [
            ...get().warehouses,
            { ...w, id: `wh-${Date.now()}` },
          ],
        });
      },

      addProduct: (p) => {
        set({
          products: [
            ...get().products,
            { ...p, id: `prd-${Date.now()}` },
          ],
        });
      },

      updateProduct: (id, data) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        });
      },

      addStockDocument: (doc) => {
        const id = `sd-${Date.now()}`;
        set({
          stockDocuments: [
            { ...doc, id },
            ...get().stockDocuments,
          ],
        });
        // Real-time integration: update product stock
        if (doc.status === "confirmed") {
          const products = [...get().products];
          doc.items.forEach((item) => {
            const idx = products.findIndex((p) => p.id === item.productId);
            if (idx >= 0) {
              if (doc.type === "receipt" || doc.type === "return_sale") {
                products[idx] = {
                  ...products[idx],
                  stock: products[idx].stock + item.quantity,
                };
              } else if (
                doc.type === "issue" ||
                doc.type === "return_purchase" ||
                doc.type === "waste"
              ) {
                products[idx] = {
                  ...products[idx],
                  stock: products[idx].stock - item.quantity,
                };
              }
            }
          });
          set({ products });
        }
      },

      addAsset: (a) => {
        set({
          assets: [...get().assets, { ...a, id: `fa-${Date.now()}` }],
        });
      },

      updateAsset: (id, data) => {
        set({
          assets: get().assets.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        });
      },

      addCustomer: (c) => {
        set({
          customers: [
            ...get().customers,
            { ...c, id: `cus-${Date.now()}` },
          ],
        });
      },

      addSupplier: (s) => {
        set({
          suppliers: [
            ...get().suppliers,
            { ...s, id: `sup-${Date.now()}` },
          ],
        });
      },

      addSalesInvoice: (inv) => {
        const id = `si-${Date.now()}`;
        set({
          salesInvoices: [
            { ...inv, id },
            ...get().salesInvoices,
          ],
        });
        // Real-time: auto journal entry + stock deduction + customer debit
        if (inv.status === "confirmed" || inv.status === "paid") {
          get().addJournalEntry({
            number: `AT-${Date.now().toString().slice(-6)}`,
            date: inv.date,
            description: `سند خودکار فاکتور فروش ${inv.number} - ${inv.customerName}`,
            type: "auto",
            status: "posted",
            lines: [
              {
                id: "1",
                accountId: "acc-receivable",
                accountCode: "1101",
                accountName: "حساب‌های دریافتنی",
                debit: inv.total,
                credit: 0,
              },
              {
                id: "2",
                accountId: "acc-sales",
                accountCode: "4101",
                accountName: "فروش کالا",
                debit: 0,
                credit: inv.subtotal - inv.discount,
              },
              {
                id: "3",
                accountId: "acc-vat",
                accountCode: "2103",
                accountName: "مالیات بر ارزش افزوده",
                debit: 0,
                credit: inv.vat,
              },
            ],
            createdBy: get().currentUser?.fullName || "سیستم",
            totalDebit: inv.total,
            totalCredit: inv.total,
            source: `sales:${id}`,
          });

          // Update customer balance
          set({
            customers: get().customers.map((c) =>
              c.id === inv.customerId
                ? {
                    ...c,
                    balance: c.balance + inv.total - inv.paidAmount,
                    totalPurchases: c.totalPurchases + inv.total,
                  }
                : c
            ),
          });

          // Deduct stock
          const products = [...get().products];
          inv.items.forEach((item) => {
            const idx = products.findIndex((p) => p.id === item.productId);
            if (idx >= 0) {
              products[idx] = {
                ...products[idx],
                stock: Math.max(0, products[idx].stock - item.quantity),
              };
            }
          });
          set({ products });
        }
      },

      addPurchaseInvoice: (inv) => {
        const id = `pi-${Date.now()}`;
        set({
          purchaseInvoices: [
            { ...inv, id },
            ...get().purchaseInvoices,
          ],
        });
      },

      updateSalesInvoice: (id, data) => {
        set({
          salesInvoices: get().salesInvoices.map((i) =>
            i.id === id ? { ...i, ...data } : i
          ),
        });
      },

      addAuditLog: (log) => {
        set({
          auditLogs: [
            {
              ...log,
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: new Date().toISOString(),
            },
            ...get().auditLogs,
          ].slice(0, 500),
        });
      },

      addMoadianSubmission: (sub) => {
        const now = new Date().toISOString();
        const entry: MoadianSubmission = {
          ...sub,
          id: `moad-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        };
        set({ moadianSubmissions: [entry, ...get().moadianSubmissions].slice(0, 200) });
      },

      updateMoadianSubmission: (id, data) => {
        set({
          moadianSubmissions: get().moadianSubmissions.map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
          ),
        });
      },

      updateInvoiceMoadian: (invoiceId, data) => {
        set({
          salesInvoices: get().salesInvoices.map((i) =>
            i.id === invoiceId ? { ...i, ...data } : i
          ),
        });
      },

      toggleSidebar: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),

      setActiveModule: (m) => set({ activeModule: m }),
    }),
    {
      name: "erp-aria-storage",
      partialize: (state) => ({
        users: state.users,
        settings: state.settings,
        accounts: state.accounts,
        journalEntries: state.journalEntries,
        cheques: state.cheques,
        pettyCash: state.pettyCash,
        warehouses: state.warehouses,
        products: state.products,
        stockDocuments: state.stockDocuments,
        assets: state.assets,
        customers: state.customers,
        suppliers: state.suppliers,
        salesInvoices: state.salesInvoices,
        purchaseInvoices: state.purchaseInvoices,
        moadianSubmissions: state.moadianSubmissions.slice(0, 100),
        auditLogs: state.auditLogs.slice(0, 100),
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<typeof current>;
        // Ensure nested settings (moadian/bale) always exist after upgrade
        const mergedSettings = {
          ...current.settings,
          ...(p.settings || {}),
          moadian: {
            ...current.settings.moadian,
            ...(p.settings?.moadian || {}),
          },
          bale: {
            ...current.settings.bale,
            ...(p.settings?.bale || {}),
          },
          availableFonts:
            p.settings?.availableFonts || current.settings.availableFonts,
          globalTheme: {
            ...current.settings.globalTheme,
            ...(p.settings?.globalTheme || {}),
          },
        };
        return {
          ...current,
          ...p,
          settings: mergedSettings,
          moadianSubmissions: p.moadianSubmissions || [],
        };
      },
    }
  )
);
