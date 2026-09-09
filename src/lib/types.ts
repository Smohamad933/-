export type UserRole = "admin" | "accountant" | "warehouse" | "sales" | "viewer" | "manager";

export interface Permission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  active: boolean;
  permissions: Permission[];
  theme?: UserTheme;
  createdAt: string;
  lastLogin?: string;
}

export interface UserTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: "sm" | "md" | "lg";
  sidebarStyle: "dark" | "light" | "colored";
  density: "compact" | "comfortable" | "spacious";
  borderRadius: "none" | "sm" | "md" | "lg";
  customCss?: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  level: "kol" | "moein" | "tafsili" | "floating";
  parentId?: string;
  balance: number;
  isActive: boolean;
  children?: Account[];
}

export interface JournalEntry {
  id: string;
  number: string;
  date: string;
  description: string;
  type: "manual" | "auto";
  status: "draft" | "posted" | "void";
  lines: JournalLine[];
  createdBy: string;
  totalDebit: number;
  totalCredit: number;
  source?: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface PettyCash {
  id: string;
  holder: string;
  amount: number;
  remaining: number;
  period: string;
  status: "open" | "settled";
  expenses: PettyCashExpense[];
}

export interface PettyCashExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  receipt?: string;
}

export interface Cheque {
  id: string;
  number: string;
  bank: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  type: "received" | "paid";
  status: "pending" | "cleared" | "bounced" | "deposited" | "guaranteed";
  party: string;
  guarantor?: string;
  notes?: string;
}

export interface BankReconciliation {
  id: string;
  bankAccount: string;
  period: string;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  status: "matched" | "unmatched" | "in_progress";
  items: ReconciliationItem[];
}

export interface ReconciliationItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "bank" | "book";
  matched: boolean;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: "central" | "branch" | "production" | "consignment";
  address?: string;
  manager?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  partNumber?: string;
  name: string;
  category: string;
  subcategory?: string;
  unit: string;
  secondaryUnit?: string;
  conversionRate?: number;
  reorderPoint: number;
  minStock: number;
  maxStock: number;
  costMethod: "weighted_avg" | "fifo" | "lifo";
  unitCost: number;
  salePrice: number;
  stock: number;
  warehouseId: string;
  serialTracking: boolean;
  batchTracking: boolean;
  expiryTracking: boolean;
  image?: string;
  isActive: boolean;
  /** شناسه کالا/خدمت سامانه مودیان (۱۳ رقم) */
  sstid?: string;
}

export interface StockDocument {
  id: string;
  number: string;
  type: "receipt" | "issue" | "transfer" | "return_purchase" | "return_sale" | "waste" | "adjustment";
  date: string;
  warehouseId: string;
  warehouseName: string;
  targetWarehouseId?: string;
  party?: string;
  status: "draft" | "confirmed" | "cancelled";
  items: StockItem[];
  totalAmount: number;
  notes?: string;
  createdBy: string;
}

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  serial?: string;
  batch?: string;
  expiry?: string;
}

export interface StockCount {
  id: string;
  warehouseId: string;
  warehouseName: string;
  date: string;
  status: "in_progress" | "completed" | "adjusted";
  items: StockCountItem[];
}

export interface StockCountItem {
  productId: string;
  productName: string;
  systemQty: number;
  countedQty: number;
  difference: number;
}

export interface FixedAsset {
  id: string;
  plaqueNumber: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  residualValue: number;
  usefulLife: number;
  depreciationMethod: "straight_line" | "declining" | "units_of_production";
  location: string;
  costCenter: string;
  responsible: string;
  status: "active" | "under_repair" | "sold" | "scrapped" | "transferred";
  currentValue: number;
  accumulatedDepreciation: number;
  barcode?: string;
  insurance?: AssetInsurance;
  maintenanceHistory: MaintenanceRecord[];
  transferHistory: TransferRecord[];
}

export interface AssetInsurance {
  company: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  amount: number;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: "periodic" | "repair" | "upgrade";
  description: string;
  cost: number;
  technician?: string;
}

export interface TransferRecord {
  id: string;
  date: string;
  fromLocation: string;
  toLocation: string;
  reason: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: "wholesale" | "retail" | "both";
  phone?: string;
  email?: string;
  address?: string;
  creditLimit: number;
  balance: number;
  category: string;
  isActive: boolean;
  totalPurchases: number;
  nationalId?: string;
  economicCode?: string;
  postalCode?: string;
  personType?: "individual" | "company";
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  category: string;
  isActive: boolean;
  totalPurchases: number;
}

export interface SalesInvoice {
  id: string;
  number: string;
  type: "proforma" | "invoice" | "return";
  date: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: "percent" | "amount";
  vat: number;
  total: number;
  status: "draft" | "confirmed" | "paid" | "partial" | "cancelled";
  salesperson?: string;
  commission?: number;
  notes?: string;
  paidAmount: number;
  // سامانه مودیان
  moadianStatus?: MoadianInvoiceStatus;
  moadianTaxId?: string;
  moadianUid?: string;
  moadianRefNumber?: string;
  moadianSentAt?: string;
  moadianError?: string;
  moadianPayload?: unknown;
}

export type MoadianInvoiceStatus =
  | "not_sent"
  | "pending"
  | "sent"
  | "success"
  | "failed"
  | "cancelled"
  | "demo";

export interface MoadianSubmission {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  taxid: string;
  uid?: string;
  referenceNumber?: string;
  status: MoadianInvoiceStatus;
  mode: "sandbox" | "production" | "demo";
  error?: string;
  payload?: unknown;
  response?: unknown;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PurchaseInvoice {
  id: string;
  number: string;
  type: "request" | "inquiry" | "order" | "invoice" | "return";
  date: string;
  supplierId: string;
  supplierName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  status: "draft" | "pending" | "confirmed" | "received" | "paid" | "cancelled";
  notes?: string;
  paidAmount: number;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface MoadianSettings {
  enabled: boolean;
  mode: "sandbox" | "production";
  fiscalId: string;
  economicCode: string;
  privateKey: string;
  certificate: string;
  clientId: string;
  autoSendOnConfirm: boolean;
}

export interface BaleSettings {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifyOnInvoice: boolean;
  notifyOnMoadian: boolean;
  notifyOnLowStock: boolean;
  notifyOnCheque: boolean;
  notifyOnLogin: boolean;
}

export interface SystemSettings {
  companyName: string;
  companyLogo?: string;
  fiscalYearStart: string;
  currency: string;
  vatRate: number;
  defaultCostMethod: "weighted_avg" | "fifo" | "lifo";
  autoBackup: boolean;
  backupInterval: "daily" | "weekly" | "monthly";
  language: "fa" | "en";
  dateFormat: string;
  globalTheme: UserTheme;
  availableFonts: FontOption[];
  moadian: MoadianSettings;
  bale: BaleSettings;
}

export interface FontOption {
  id: string;
  name: string;
  family: string;
  url?: string;
  isCustom: boolean;
  weights: number[];
}

export interface KPIData {
  cashFlow: number;
  totalRevenue: number;
  totalExpense: number;
  grossProfit: number;
  totalAssets: number;
  inventoryValue: number;
  receivables: number;
  payables: number;
  topProducts: { name: string; sales: number; quantity: number }[];
  monthlyRevenue: { month: string; revenue: number; expense: number }[];
  inventoryAlerts: { product: string; stock: number; reorderPoint: number }[];
  pendingCheques: number;
  overdueCheques: number;
}
