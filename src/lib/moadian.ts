/**
 * سامانه مودیان — Tax.gov.ir Moadian API Client
 * Based on official technical instructions:
 * Base URL: https://tp.tax.gov.ir/req/api/self-tsp/
 * Packet type: INVOICE.V01
 * Auth: GET token → Bearer header → async enqueue invoices
 */

export interface MoadianConfig {
  enabled: boolean;
  mode: "sandbox" | "production";
  fiscalId: string; // شناسه یکتای حافظه مالیاتی (Memory ID)
  economicCode: string; // شماره اقتصادی فروشنده (tins)
  privateKey: string; // کلید خصوصی RSA (PEM)
  certificate: string; // گواهی دیجیتال (PEM) — اختیاری برای sandbox
  clientId?: string;
}

export interface MoadianInvoiceHeader {
  taxid: string;
  indatim: number; // timestamp ms
  indati2m: number;
  inty: number; // 1=نوع اول, 2=نوع دوم, 3=نوع سوم
  inno: string; // شماره داخلی صورتحساب (hex)
  irtaxid: string | null;
  inp: number; // الگو: 1=فروش
  ins: number; // موضوع: 1=اصلی, 2=اصلاحی, 3=ابطالی, 4=برگشت از فروش
  tins: string; // شماره اقتصادی فروشنده
  tinb: string | null; // شماره اقتصادی خریدار
  tob: number | null; // نوع شخص خریدار: 1=حقیقی, 2=حقوقی, 3=مشارکت مدنی, 4=اتباع غیر ایرانی
  bid: string | null; // شناسه/کد ملی خریدار
  bpc: string | null; // کد پستی خریدار
  tprdis: number; // مجموع مبلغ قبل از تخفیف
  tdis: number; // مجموع تخفیف
  tadis: number; // مجموع بعد از تخفیف
  tvam: number; // مجموع VAT
  todam: number; // سایر عوارض
  tbill: number; // مبلغ کل صورتحساب
  setm: number; // روش تسویه: 1=نقد, 2=نسیه, 3=نقد/نسیه
  cap: number | null;
  insp: number | null;
  tvop: number | null;
  tax17: number | null;
}

export interface MoadianInvoiceBody {
  sstid: string; // شناسه کالا/خدمت
  sstt: string; // شرح
  am: number; // تعداد/مقدار
  mu: string | null; // واحد اندازه‌گیری
  fee: number; // مبلغ واحد
  prdis: number; // مبلغ قبل از تخفیف
  dis: number; // تخفیف
  adis: number; // بعد از تخفیف
  vra: number; // نرخ VAT
  vam: number; // مبلغ VAT
  tsstam: number; // مبلغ کل قلم
  odt?: string | null;
  odr?: number | null;
  odam?: number | null;
  vop?: number | null;
}

export interface MoadianInvoicePayload {
  header: MoadianInvoiceHeader;
  body: MoadianInvoiceBody[];
  payments: Record<string, unknown>[];
}

export interface MoadianSendResult {
  success: boolean;
  uid?: string;
  referenceNumber?: string;
  taxid?: string;
  errorCode?: string;
  errorDetail?: string;
  raw?: unknown;
  mode: "sandbox" | "production" | "demo";
}

export interface MoadianInquiryResult {
  success: boolean;
  status?: string;
  statusCode?: number;
  message?: string;
  raw?: unknown;
}

const BASE_URLS = {
  production: "https://tp.tax.gov.ir/req/api/self-tsp",
  sandbox: "https://sandboxrc.tax.gov.ir/req/api/self-tsp",
};

/** Convert serial number to 10-char hex (inno field) */
export function toInno(serial: number | string): string {
  const n = typeof serial === "string" ? parseInt(serial.replace(/\D/g, ""), 10) || Date.now() % 1e10 : serial;
  return n.toString(16).toUpperCase().padStart(10, "0").slice(-10);
}

/**
 * Generate Tax ID (شماره منحصر به فرد مالیاتی)
 * Format: FiscalId(6) + HexDate(5) + HexSerial(10) + Verhoeff(1) = 22 chars
 * Based on official Moadian taxid algorithm
 */
export function generateTaxId(fiscalId: string, date: Date, serial: number): string {
  const fid = (fiscalId || "AAAAAA").slice(0, 6).toUpperCase().padEnd(6, "A");

  // Days since 1970-01-01 as 5-char hex
  const days = Math.floor(date.getTime() / 86400000);
  const hexDate = days.toString(16).toUpperCase().padStart(5, "0").slice(-5);

  const hexSerial = serial.toString(16).toUpperCase().padStart(10, "0").slice(-10);
  const base = fid + hexDate + hexSerial;

  // Verhoeff check digit
  const check = verhoeffCheckDigit(base);
  return base + check;
}

/** Verhoeff algorithm for taxid check digit */
function verhoeffCheckDigit(num: string): string {
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];
  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];
  // Map alphanumeric to digits for verhoeff
  const digits = num
    .toUpperCase()
    .split("")
    .map((c) => {
      if (c >= "0" && c <= "9") return parseInt(c, 10);
      if (c >= "A" && c <= "Z") return (c.charCodeAt(0) - 65) % 10;
      return 0;
    });

  let c = 0;
  const reversed = [...digits].reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[(i + 1) % 8][reversed[i]]];
  }
  return String(c);
}

export interface SalesInvoiceLike {
  id: string;
  number: string;
  date: string;
  customerName: string;
  customerNationalId?: string;
  customerEconomicCode?: string;
  customerType?: "individual" | "company";
  customerPostalCode?: string;
  items: {
    productName: string;
    sku: string;
    sstid?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  type: string;
}

/** Build Moadian INVOICE.V01 payload from ERP sales invoice */
export function buildMoadianInvoice(
  inv: SalesInvoiceLike,
  config: MoadianConfig,
  vatRate: number,
  options?: { ins?: number; irtaxid?: string | null }
): MoadianInvoicePayload {
  const date = new Date(inv.date);
  const ts = date.getTime();
  const serial = parseInt(inv.number.replace(/\D/g, "").slice(-8), 10) || Date.now() % 1e8;
  const taxid = generateTaxId(config.fiscalId, date, serial);
  const inno = toInno(serial);

  const isCompany = inv.customerType === "company" || !!inv.customerEconomicCode;
  const buyerId = inv.customerEconomicCode || inv.customerNationalId || null;

  // ins: 1=اصلی, 4=برگشت از فروش
  const ins = options?.ins ?? (inv.type === "return" ? 4 : 1);

  const body: MoadianInvoiceBody[] = inv.items.map((item) => {
    const prdis = item.quantity * item.unitPrice;
    const dis = item.discount || 0;
    const adis = prdis - dis;
    const vra = vatRate;
    const vam = Math.round(adis * (vra / 100));
    return {
      sstid: item.sstid || item.sku.replace(/[^0-9]/g, "").padStart(13, "0").slice(0, 13) || "0000000000000",
      sstt: item.productName,
      am: item.quantity,
      mu: null,
      fee: item.unitPrice,
      prdis,
      dis,
      adis,
      vra,
      vam,
      tsstam: adis + vam,
      vop: vam,
    };
  });

  const tprdis = body.reduce((s, b) => s + b.prdis, 0);
  const tdis = body.reduce((s, b) => s + b.dis, 0);
  const tadis = tprdis - tdis;
  const tvam = body.reduce((s, b) => s + b.vam, 0);
  const tbill = tadis + tvam;

  const header: MoadianInvoiceHeader = {
    taxid,
    indatim: ts,
    indati2m: ts,
    inty: buyerId ? 1 : 2, // نوع اول اگر خریدار مشخص، نوع دوم اگر عمومی
    inno,
    irtaxid: options?.irtaxid ?? null,
    inp: 1, // الگوی فروش
    ins,
    tins: config.economicCode,
    tinb: isCompany ? buyerId : null,
    tob: buyerId ? (isCompany ? 2 : 1) : null,
    bid: !isCompany ? buyerId : null,
    bpc: inv.customerPostalCode || null,
    tprdis,
    tdis,
    tadis,
    tvam,
    todam: 0,
    tbill,
    setm: 1, // نقدی
    cap: tbill,
    insp: null,
    tvop: tvam,
    tax17: null,
  };

  return { header, body, payments: [] };
}

/** Create random UUID for packet uid */
export function createUid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sign data with RSA private key (PKCS1 / SHA256)
 * Used for JWS token request and invoice packet signature
 */
export async function signWithPrivateKey(data: string, privateKeyPem: string): Promise<string> {
  const crypto = await import("crypto");
  const key = privateKeyPem.includes("BEGIN")
    ? privateKeyPem
    : `-----BEGIN RSA PRIVATE KEY-----\n${privateKeyPem}\n-----END RSA PRIVATE KEY-----`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(data);
  sign.end();
  return sign.sign(key, "base64");
}

/** Normalize PEM key formatting */
export function normalizePem(key: string, type: "PRIVATE KEY" | "RSA PRIVATE KEY" | "CERTIFICATE"): string {
  const cleaned = key
    .replace(/-----BEGIN[^-]+-----/g, "")
    .replace(/-----END[^-]+-----/g, "")
    .replace(/\s+/g, "");
  const lines = cleaned.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type}-----\n${lines.join("\n")}\n-----END ${type}-----`;
}

/**
 * Get auth token from Moadian
 * POST /api/self-tsp/sync/GET_TOKEN
 */
export async function getMoadianToken(config: MoadianConfig): Promise<{ token?: string; error?: string }> {
  if (!config.fiscalId || !config.privateKey) {
    return { error: "شناسه حافظه مالیاتی و کلید خصوصی الزامی است" };
  }

  const base = BASE_URLS[config.mode] || BASE_URLS.sandbox;
  const time = Date.now();
  const packetData = {
    username: config.fiscalId,
  };

  try {
    const dataStr = JSON.stringify(packetData);
    const signature = await signWithPrivateKey(dataStr, normalizePem(config.privateKey, "PRIVATE KEY"));

    const body = {
      time,
      packets: [
        {
          uid: createUid(),
          packetType: "GET_TOKEN",
          retry: false,
          data: packetData,
          encryptionKeyId: "",
          symmetricKey: "",
          iv: "",
          fiscalId: config.fiscalId,
          dataSignature: signature,
        },
      ],
    };

    const res = await fetch(`${base}/sync/GET_TOKEN`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(config.clientId ? { "requestTraceId": config.clientId } : {}),
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        error: `خطای دریافت توکن (${res.status}): ${JSON.stringify(json?.errors || json || res.statusText)}`,
      };
    }

    const token =
      json?.result?.data?.token ||
      json?.result?.[0]?.data?.token ||
      json?.token;

    if (!token) {
      return { error: `توکن دریافت نشد: ${JSON.stringify(json)}` };
    }
    return { token };
  } catch (err) {
    return { error: `خطا در ارتباط با سامانه مودیان: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * Send invoice to Moadian (async enqueue)
 * POST /api/self-tsp/async/normal-enqueue
 */
export async function sendInvoiceToMoadian(
  invoice: MoadianInvoicePayload,
  config: MoadianConfig
): Promise<MoadianSendResult> {
  // Demo mode when credentials incomplete
  if (!config.enabled || !config.fiscalId || !config.privateKey || !config.economicCode) {
    return {
      success: true,
      uid: createUid(),
      referenceNumber: `DEMO-REF-${Date.now()}`,
      taxid: invoice.header.taxid,
      mode: "demo",
      raw: {
        message: "حالت دمو — اعتبارنامه کامل تنظیم نشده. صورتحساب ساختاردهی شد اما به سرور ارسال نشد.",
        invoice,
      },
    };
  }

  const base = BASE_URLS[config.mode] || BASE_URLS.sandbox;
  const tokenResult = await getMoadianToken(config);
  if (!tokenResult.token) {
    return {
      success: false,
      errorDetail: tokenResult.error || "عدم دریافت توکن",
      taxid: invoice.header.taxid,
      mode: config.mode,
    };
  }

  try {
    const invoiceStr = JSON.stringify(invoice);
    const dataSignature = await signWithPrivateKey(invoiceStr, normalizePem(config.privateKey, "PRIVATE KEY"));
    const uid = createUid();

    const packet = {
      uid,
      packetType: "INVOICE.V01",
      retry: false,
      data: invoice,
      encryptionKeyId: "",
      symmetricKey: "",
      iv: "",
      fiscalId: config.fiscalId,
      dataSignature,
    };

    const body = {
      time: Date.now(),
      packets: [packet],
    };

    // Sign entire request body if needed (full list signature)
    const res = await fetch(`${base}/async/normal-enqueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenResult.token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        taxid: invoice.header.taxid,
        errorCode: String(res.status),
        errorDetail: JSON.stringify(json?.errors || json || res.statusText),
        mode: config.mode,
        raw: json,
      };
    }

    const result = json?.result?.[0] || json?.result || json;
    return {
      success: !result?.errorCode,
      uid: result?.uid || uid,
      referenceNumber: result?.referenceNumber,
      taxid: invoice.header.taxid,
      errorCode: result?.errorCode,
      errorDetail: result?.errorDetail,
      mode: config.mode,
      raw: json,
    };
  } catch (err) {
    return {
      success: false,
      taxid: invoice.header.taxid,
      errorDetail: err instanceof Error ? err.message : String(err),
      mode: config.mode,
    };
  }
}

/**
 * Inquiry invoice status by UID
 * POST sync/INQUIRY_BY_UID
 */
export async function inquiryByUid(
  uids: string[],
  config: MoadianConfig
): Promise<MoadianInquiryResult> {
  if (!config.fiscalId || !config.privateKey) {
    return {
      success: true,
      status: "DEMO_PENDING",
      message: "حالت دمو — استعلام واقعی نیاز به اعتبارنامه دارد",
    };
  }

  const base = BASE_URLS[config.mode] || BASE_URLS.sandbox;
  const tokenResult = await getMoadianToken(config);
  if (!tokenResult.token) {
    return { success: false, message: tokenResult.error };
  }

  try {
    const packetData = { uidList: uids };
    const dataStr = JSON.stringify(packetData);
    const signature = await signWithPrivateKey(dataStr, normalizePem(config.privateKey, "PRIVATE KEY"));

    const body = {
      time: Date.now(),
      packets: [
        {
          uid: createUid(),
          packetType: "INQUIRY_BY_UID",
          retry: false,
          data: packetData,
          fiscalId: config.fiscalId,
          dataSignature: signature,
        },
      ],
    };

    const res = await fetch(`${base}/sync/INQUIRY_BY_UID`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenResult.token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, message: JSON.stringify(json), raw: json };
    }

    const data = json?.result?.data || json?.result?.[0]?.data || json?.result;
    return {
      success: true,
      status: data?.status || data?.[0]?.status || "UNKNOWN",
      message: JSON.stringify(data),
      raw: json,
    };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

/** Human-readable status labels */
export const MOADIAN_STATUS_LABELS: Record<string, string> = {
  pending: "در صف ارسال",
  sent: "ارسال‌شده",
  success: "تأیید‌شده",
  failed: "رد‌شده",
  cancelled: "ابطال‌شده",
  demo: "دمو",
  NOT_FOUND: "یافت نشد",
  FAILED: "ناموفق",
  SUCCESS: "موفق",
  IN_PROGRESS: "در حال پردازش",
};
