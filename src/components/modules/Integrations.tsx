"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { MoadianSettings, BaleSettings, SalesInvoice } from "@/lib/types";
import {
  Card, Badge, Button, Table, Td, Money, PageHeader, Modal,
  Input, Select, Tabs, Alert, Toggle, formatDate, toPersianDigits,
} from "@/components/ui";
import {
  Send, CheckCircle, RefreshCw, Eye, Settings2,
  MessageCircle, Shield, FileText, ExternalLink,
} from "lucide-react";

/* ═══════════════ HELPERS ═══════════════ */
async function apiPost(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const moadianStatusBadge = (s?: string): "default" | "warning" | "info" | "success" | "danger" | "purple" => {
  const map: Record<string, "default" | "warning" | "info" | "success" | "danger" | "purple"> = {
    not_sent: "default", pending: "warning", sent: "info", success: "success",
    failed: "danger", cancelled: "danger", demo: "purple",
  };
  return map[s || "not_sent"] || "default";
};

const moadianStatusLabel = (s?: string) =>
  ({
    not_sent: "ارسال‌نشده", pending: "در صف", sent: "ارسال‌شده",
    success: "تأیید‌شده", failed: "رد‌شده", cancelled: "ابطال", demo: "دمو",
  }[s || "not_sent"] || s);

/* ═══════════════ SEND INVOICE TO MOADIAN ═══════════════ */
export async function sendInvoiceMoadianFlow(
  inv: SalesInvoice,
  opts: {
    settings: { moadian: MoadianSettings; vatRate: number; bale: BaleSettings };
    customers: { id: string; nationalId?: string; economicCode?: string; postalCode?: string; personType?: string }[];
    products: { id: string; sstid?: string }[];
    currentUserName: string;
    updateInvoiceMoadian: (id: string, data: Record<string, unknown>) => void;
    addMoadianSubmission: (sub: {
      invoiceId: string; invoiceNumber: string; taxid: string; uid?: string;
      referenceNumber?: string; status: "not_sent" | "pending" | "sent" | "success" | "failed" | "cancelled" | "demo";
      mode: "sandbox" | "production" | "demo"; error?: string; payload?: unknown; response?: unknown; createdBy: string;
    }) => void;
    addAuditLog: (log: { userId: string; userName: string; action: string; module: string; entityId?: string; details: string }) => void;
  }
) {
  const customer = opts.customers.find((c) => c.id === inv.customerId);
  const invoicePayload = {
    id: inv.id,
    number: inv.number,
    date: inv.date,
    customerName: inv.customerName,
    customerNationalId: customer?.nationalId,
    customerEconomicCode: customer?.economicCode,
    customerType: customer?.personType === "company" ? "company" : "individual",
    customerPostalCode: customer?.postalCode,
    items: inv.items.map((item) => {
      const prd = opts.products.find((p) => p.id === item.productId);
      return {
        productName: item.productName,
        sku: item.sku,
        sstid: prd?.sstid,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      };
    }),
    subtotal: inv.subtotal,
    discount: inv.discount,
    vat: inv.vat,
    total: inv.total,
    type: inv.type,
  };

  opts.updateInvoiceMoadian(inv.id, { moadianStatus: "pending" });

  const result = await apiPost("/api/moadian", {
    action: "send",
    invoice: invoicePayload,
    vatRate: opts.settings.vatRate,
    config: opts.settings.moadian,
  });

  const status = result.success
    ? result.mode === "demo" ? "demo" : "sent"
    : "failed";

  opts.updateInvoiceMoadian(inv.id, {
    moadianStatus: status,
    moadianTaxId: result.taxid || result.payload?.header?.taxid,
    moadianUid: result.uid,
    moadianRefNumber: result.referenceNumber,
    moadianSentAt: new Date().toISOString(),
    moadianError: result.errorDetail || result.error,
    moadianPayload: result.payload,
  });

  opts.addMoadianSubmission({
    invoiceId: inv.id,
    invoiceNumber: inv.number,
    taxid: result.taxid || result.payload?.header?.taxid || "",
    uid: result.uid,
    referenceNumber: result.referenceNumber,
    status,
    mode: result.mode || "demo",
    error: result.errorDetail || result.error,
    payload: result.payload,
    response: result.raw || result,
    createdBy: opts.currentUserName,
  });

  opts.addAuditLog({
    userId: "system",
    userName: opts.currentUserName,
    action: result.success ? "ارسال به سامانه مودیان" : "خطا در ارسال مودیان",
    module: "moadian",
    entityId: inv.id,
    details: result.success
      ? `فاکتور ${inv.number} — taxid: ${result.taxid} — uid: ${result.uid || "—"}`
      : `فاکتور ${inv.number} — ${result.errorDetail || result.error}`,
  });

  // Bale notification
  if (opts.settings.bale?.enabled && opts.settings.bale.notifyOnMoadian && opts.settings.bale.botToken && opts.settings.bale.chatId) {
    const text = result.success
      ? [
          "✅ ارسال به سامانه مودیان موفق",
          ``,
          `فاکتور: ${inv.number}`,
          result.taxid ? `شماره مالیاتی: ${result.taxid}` : "",
          result.uid ? `UID: ${result.uid}` : "",
          result.referenceNumber ? `کد پیگیری: ${result.referenceNumber}` : "",
          `حالت: ${result.mode === "demo" ? "دمو" : result.mode === "sandbox" ? "آزمایشی" : "عملیاتی"}`,
          `زمان: ${new Date().toLocaleString("fa-IR")}`,
        ].filter(Boolean).join("\n")
      : [
          "❌ خطا در ارسال به سامانه مودیان",
          ``,
          `فاکتور: ${inv.number}`,
          `خطا: ${result.errorDetail || result.error || "نامشخص"}`,
          `زمان: ${new Date().toLocaleString("fa-IR")}`,
        ].join("\n");

    await apiPost("/api/bale", {
      action: "send",
      botToken: opts.settings.bale.botToken,
      chatId: opts.settings.bale.chatId,
      text,
    }).catch(() => null);
  }

  return result;
}

/* ═══════════════ MOADIAN MODULE ═══════════════ */
export function MoadianModule() {
  const {
    settings, updateSettings, salesInvoices, customers, products,
    moadianSubmissions, currentUser, updateInvoiceMoadian,
    addMoadianSubmission, addAuditLog,
  } = useAppStore();

  const moadian: MoadianSettings = settings.moadian || {
    enabled: false, mode: "sandbox", fiscalId: "", economicCode: "",
    privateKey: "", certificate: "", clientId: "", autoSendOnConfirm: false,
  };

  const [tab, setTab] = useState("invoices");
  const [form, setForm] = useState<MoadianSettings>({ ...moadian });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ type: "success" | "danger" | "info"; text: string } | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ open: boolean; data?: unknown; taxid?: string }>({ open: false });
  const [inquiryResult, setInquiryResult] = useState<string | null>(null);

  const saveConfig = () => {
    setSaving(true);
    updateSettings({ moadian: form });
    addAuditLog({
      userId: currentUser?.id || "system",
      userName: currentUser?.fullName || "سیستم",
      action: "به‌روزرسانی تنظیمات مودیان",
      module: "moadian",
      details: `فعال: ${form.enabled} | حالت: ${form.mode} | حافظه: ${form.fiscalId || "—"}`,
    });
    setTimeout(() => {
      setSaving(false);
      setTestMsg({ type: "success", text: "تنظیمات سامانه مودیان ذخیره شد." });
    }, 400);
  };

  const testToken = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await apiPost("/api/moadian", { action: "test-token", config: form });
      if (res.success) {
        setTestMsg({ type: "success", text: res.message || "اتصال موفق" });
      } else {
        setTestMsg({ type: "danger", text: res.error || "خطا در دریافت توکن" });
      }
    } catch (e) {
      setTestMsg({ type: "danger", text: String(e) });
    }
    setTesting(false);
  };

  const handleSend = async (inv: SalesInvoice) => {
    setSendingId(inv.id);
    try {
      const result = await sendInvoiceMoadianFlow(inv, {
        settings: { moadian: form.enabled ? form : { ...form, enabled: true }, vatRate: settings.vatRate, bale: settings.bale },
        customers,
        products,
        currentUserName: currentUser?.fullName || "کاربر",
        updateInvoiceMoadian,
        addMoadianSubmission,
        addAuditLog,
      });
      setTestMsg({
        type: result.success ? "success" : "danger",
        text: result.success
          ? `فاکتور ${inv.number} ارسال شد — taxid: ${result.taxid}${result.mode === "demo" ? " (حالت دمو)" : ""}`
          : `خطا: ${result.errorDetail || result.error}`,
      });
    } catch (e) {
      setTestMsg({ type: "danger", text: String(e) });
    }
    setSendingId(null);
  };

  const handlePreview = async (inv: SalesInvoice) => {
    const customer = customers.find((c) => c.id === inv.customerId);
    const res = await apiPost("/api/moadian", {
      action: "preview",
      vatRate: settings.vatRate,
      config: form,
      invoice: {
        id: inv.id, number: inv.number, date: inv.date, customerName: inv.customerName,
        customerNationalId: customer?.nationalId, customerEconomicCode: customer?.economicCode,
        customerType: customer?.personType === "company" ? "company" : "individual",
        customerPostalCode: customer?.postalCode,
        items: inv.items.map((item) => ({
          productName: item.productName, sku: item.sku,
          sstid: products.find((p) => p.id === item.productId)?.sstid,
          quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount, total: item.total,
        })),
        subtotal: inv.subtotal, discount: inv.discount, vat: inv.vat, total: inv.total, type: inv.type,
      },
    });
    setPreview({ open: true, data: res.payload, taxid: res.taxid });
  };

  const handleInquiry = async (uid: string) => {
    setInquiryResult("در حال استعلام...");
    const res = await apiPost("/api/moadian", { action: "inquiry", uid, uids: [uid], config: form });
    setInquiryResult(res.message || res.status || JSON.stringify(res));
  };

  const sendable = salesInvoices.filter(
    (i) => (i.status === "confirmed" || i.status === "paid") && i.type !== "proforma"
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="سامانه مودیان"
        subtitle="ارسال صورتحساب الکترونیکی به tp.tax.gov.ir — مطابق دستورالعمل فنی سازمان امور مالیاتی"
      />

      {testMsg && (
        <Alert variant={testMsg.type === "success" ? "success" : testMsg.type === "danger" ? "danger" : "info"}>
          {testMsg.text}
        </Alert>
      )}

      <Tabs
        tabs={[
          { id: "invoices", label: "ارسال فاکتور", icon: <Send className="w-3.5 h-3.5" />, count: sendable.length },
          { id: "history", label: "تاریخچه ارسال", icon: <FileText className="w-3.5 h-3.5" />, count: moadianSubmissions.length },
          { id: "config", label: "پیکربندی", icon: <Settings2 className="w-3.5 h-3.5" /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "invoices" && (
        <div className="space-y-4">
          <Alert variant="info">
            صورتحساب‌های تأیید‌شده قابل ارسال به سامانه مودیان هستند. ساختار بسته: <code className="text-xs bg-blue-100 px-1 rounded">INVOICE.V01</code> —
            متد: <code className="text-xs bg-blue-100 px-1 rounded">async/normal-enqueue</code>
            {!moadian.enabled && " — در صورت نبود اعتبارنامه، ارسال در حالت دمو انجام می‌شود."}
          </Alert>

          <Card noPadding>
            <Table headers={["شماره", "مشتری", "مبلغ", "تاریخ", "وضعیت مودیان", "Tax ID", "عملیات"]}>
              {sendable.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <Td className="font-mono text-xs font-semibold text-[var(--color-primary)]">{inv.number}</Td>
                  <Td>{inv.customerName}</Td>
                  <Td><Money amount={inv.total} /></Td>
                  <Td className="text-xs">{formatDate(inv.date)}</Td>
                  <Td>
                    <Badge variant={moadianStatusBadge(inv.moadianStatus)}>
                      {moadianStatusLabel(inv.moadianStatus)}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-[10px] text-slate-500 max-w-[120px] truncate" title={inv.moadianTaxId}>
                    {inv.moadianTaxId || "—"}
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handlePreview(inv)} title="پیش‌نمایش JSON">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSend(inv)}
                        loading={sendingId === inv.id}
                        disabled={sendingId === inv.id || inv.moadianStatus === "sent" || inv.moadianStatus === "success"}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {inv.moadianStatus === "sent" || inv.moadianStatus === "success" || inv.moadianStatus === "demo"
                          ? "ارسال‌شده" : "ارسال"}
                      </Button>
                      {inv.moadianUid && (
                        <Button size="sm" variant="ghost" onClick={() => handleInquiry(inv.moadianUid!)} title="استعلام">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {sendable.length === 0 && (
                <tr><Td colSpan={7} className="text-center text-slate-400 py-8">فاکتور تأیید‌شده‌ای برای ارسال وجود ندارد</Td></tr>
              )}
            </Table>
          </Card>

          {inquiryResult && (
            <Alert variant="info">
              <pre className="text-xs whitespace-pre-wrap font-mono">{inquiryResult}</pre>
            </Alert>
          )}
        </div>
      )}

      {tab === "history" && (
        <Card title="تاریخچه ارسال به مودیان" noPadding>
          <Table headers={["زمان", "فاکتور", "Tax ID", "UID", "کد پیگیری", "وضعیت", "حالت", "خطا"]}>
            {moadianSubmissions.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <Td className="text-xs">{new Date(s.createdAt).toLocaleString("fa-IR")}</Td>
                <Td className="font-mono text-xs">{s.invoiceNumber}</Td>
                <Td className="font-mono text-[10px] max-w-[100px] truncate" title={s.taxid}>{s.taxid}</Td>
                <Td className="font-mono text-[10px] max-w-[80px] truncate" title={s.uid}>{s.uid || "—"}</Td>
                <Td className="font-mono text-[10px]">{s.referenceNumber || "—"}</Td>
                <Td><Badge variant={moadianStatusBadge(s.status)}>{moadianStatusLabel(s.status)}</Badge></Td>
                <Td>
                  <Badge variant={s.mode === "production" ? "danger" : s.mode === "sandbox" ? "warning" : "purple"}>
                    {s.mode === "production" ? "عملیاتی" : s.mode === "sandbox" ? "آزمایشی" : "دمو"}
                  </Badge>
                </Td>
                <Td className="text-xs text-red-500 max-w-[150px] truncate">{s.error || "—"}</Td>
              </tr>
            ))}
            {moadianSubmissions.length === 0 && (
              <tr><Td colSpan={8} className="text-center text-slate-400 py-8">هنوز ارسالی ثبت نشده</Td></tr>
            )}
          </Table>
        </Card>
      )}

      {tab === "config" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="اتصال به سامانه مودیان">
            <div className="space-y-4">
              <Toggle
                checked={form.enabled}
                onChange={(v) => setForm({ ...form, enabled: v })}
                label="فعال‌سازی ارسال به سامانه مودیان"
              />
              <Select
                label="محیط"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as "sandbox" | "production" })}
                options={[
                  { value: "sandbox", label: "آزمایشی (Sandbox) — sandboxrc.tax.gov.ir" },
                  { value: "production", label: "عملیاتی (Production) — tp.tax.gov.ir" },
                ]}
              />
              <Input
                label="شناسه یکتای حافظه مالیاتی (Fiscal ID / Memory ID)"
                value={form.fiscalId}
                onChange={(e) => setForm({ ...form, fiscalId: e.target.value })}
                placeholder="مثلاً A2B3C4"
              />
              <Input
                label="شماره اقتصادی فروشنده (tins)"
                value={form.economicCode}
                onChange={(e) => setForm({ ...form, economicCode: e.target.value })}
                placeholder="۱۱ یا ۱۴ رقم"
              />
              <Input
                label="Client ID / Trace ID (اختیاری)"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              />
              <Toggle
                checked={form.autoSendOnConfirm}
                onChange={(v) => setForm({ ...form, autoSendOnConfirm: v })}
                label="ارسال خودکار هنگام تأیید فاکتور فروش"
              />
            </div>
          </Card>

          <Card title="کلید و گواهی دیجیتال">
            <div className="space-y-4">
              <Alert variant="info">
                کلید خصوصی RSA و گواهی را از کارپوشه مودیان (بخش عضویت ← دریافت کلید) دریافت کنید.
                امضای بسته با الگوریتم RSA-SHA256 انجام می‌شود.
              </Alert>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">کلید خصوصی (Private Key PEM)</label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono min-h-[120px] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  value={form.privateKey}
                  onChange={(e) => setForm({ ...form, privateKey: e.target.value })}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">گواهی دیجیتال (Certificate PEM — اختیاری)</label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono min-h-[80px] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  value={form.certificate}
                  onChange={(e) => setForm({ ...form, certificate: e.target.value })}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  dir="ltr"
                />
              </div>
            </div>
          </Card>

          <Card title="راهنمای API" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-semibold text-slate-700 mb-1">۱. دریافت توکن</p>
                <code className="text-[11px] text-slate-500 block" dir="ltr">POST /sync/GET_TOKEN</code>
                <p className="text-xs text-slate-500 mt-2">احراز هویت با امضای دیجیتال بسته GET_TOKEN</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-semibold text-slate-700 mb-1">۲. ارسال صورتحساب</p>
                <code className="text-[11px] text-slate-500 block" dir="ltr">POST /async/normal-enqueue</code>
                <p className="text-xs text-slate-500 mt-2">بسته INVOICE.V01 با Bearer Token</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-semibold text-slate-700 mb-1">۳. استعلام وضعیت</p>
                <code className="text-[11px] text-slate-500 block" dir="ltr">POST /sync/INQUIRY_BY_UID</code>
                <p className="text-xs text-slate-500 mt-2">پیگیری با UID برگشتی از enqueue</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={saveConfig} loading={saving}>
                <CheckCircle className="w-4 h-4" /> ذخیره تنظیمات
              </Button>
              <Button variant="outline" onClick={testToken} loading={testing}>
                <Shield className="w-4 h-4" /> تست دریافت توکن
              </Button>
              <a
                href="https://tp.tax.gov.ir"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 hover:text-[var(--color-primary)]"
              >
                <ExternalLink className="w-4 h-4" /> کارپوشه مودیان
              </a>
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={preview.open}
        onClose={() => setPreview({ open: false })}
        title={`پیش‌نمایش صورتحساب الکترونیکی${preview.taxid ? ` — ${preview.taxid}` : ""}`}
        size="xl"
        footer={<Button variant="outline" onClick={() => setPreview({ open: false })}>بستن</Button>}
      >
        <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-auto max-h-[60vh] font-mono dir-ltr text-left" dir="ltr">
          {JSON.stringify(preview.data, null, 2)}
        </pre>
      </Modal>
    </div>
  );
}

/* ═══════════════ BALE MODULE ═══════════════ */
export function BaleModule() {
  const { settings, updateSettings, currentUser, addAuditLog } = useAppStore();
  const bale: BaleSettings = settings.bale || {
    enabled: false, botToken: "", chatId: "",
    notifyOnInvoice: true, notifyOnMoadian: true, notifyOnLowStock: true,
    notifyOnCheque: true, notifyOnLogin: false,
  };

  const [form, setForm] = useState<BaleSettings>({ ...bale });
  const [msg, setMsg] = useState<{ type: "success" | "danger" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [botInfo, setBotInfo] = useState<{ id: number; first_name: string; username?: string } | null>(null);
  const [chats, setChats] = useState<{ chatId: number | string; title: string; type: string; lastMessage?: string }[]>([]);
  const [showToken, setShowToken] = useState(false);

  const save = () => {
    updateSettings({ bale: form });
    addAuditLog({
      userId: currentUser?.id || "system",
      userName: currentUser?.fullName || "سیستم",
      action: "به‌روزرسانی تنظیمات بله",
      module: "bale",
      details: `فعال: ${form.enabled} | Chat: ${form.chatId || "—"}`,
    });
    setMsg({ type: "success", text: "تنظیمات بله ذخیره شد." });
  };

  const testToken = async () => {
    setLoading("token");
    setMsg(null);
    setBotInfo(null);
    try {
      const res = await apiPost("/api/bale", { action: "test-token", botToken: form.botToken });
      if (res.ok) {
        setBotInfo(res.bot);
        setMsg({ type: "success", text: `بازو متصل شد: ${res.bot?.first_name}${res.bot?.username ? ` (@${res.bot.username})` : ""}` });
      } else {
        setMsg({ type: "danger", text: res.error || "توکن نامعتبر است" });
      }
    } catch (e) {
      setMsg({ type: "danger", text: String(e) });
    }
    setLoading(null);
  };

  const fetchChats = async () => {
    setLoading("chats");
    setMsg(null);
    try {
      const res = await apiPost("/api/bale", { action: "get-chats", botToken: form.botToken });
      if (res.ok) {
        setChats(res.chats || []);
        if (!res.chats?.length) {
          setMsg({
            type: "info",
            text: "چتی یافت نشد. ابتدا به بازو در بله پیام دهید (مثلاً /start)، سپس دوباره امتحان کنید.",
          });
        } else {
          setMsg({ type: "success", text: `${toPersianDigits(res.chats.length)} گفتگو پیدا شد. روی یکی کلیک کنید تا Chat ID تنظیم شود.` });
        }
      } else {
        setMsg({ type: "danger", text: res.error || "خطا" });
      }
    } catch (e) {
      setMsg({ type: "danger", text: String(e) });
    }
    setLoading(null);
  };

  const sendTest = async () => {
    setLoading("send");
    setMsg(null);
    try {
      // Save first so config is current
      updateSettings({ bale: form });
      const res = await apiPost("/api/bale", {
        action: "test-message",
        botToken: form.botToken,
        chatId: form.chatId,
      });
      if (res.ok) {
        setMsg({ type: "success", text: `پیام آزمایشی ارسال شد (message_id: ${res.messageId})` });
      } else {
        setMsg({ type: "danger", text: res.error || res.description || "ارسال ناموفق" });
      }
    } catch (e) {
      setMsg({ type: "danger", text: String(e) });
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="اعلان‌های بله (Bale)"
        subtitle="ارسال نوتیفیکیشن از طریق بازوی بله — مستندات: docs.bale.ai"
      />

      {msg && (
        <Alert variant={msg.type === "success" ? "success" : msg.type === "danger" ? "danger" : "info"}>
          {msg.text}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="پیکربندی بازو">
          <div className="space-y-4">
            <Toggle
              checked={form.enabled}
              onChange={(v) => setForm({ ...form, enabled: v })}
              label="فعال‌سازی اعلان‌های بله"
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                توکن بازو (Bot Token)
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={form.botToken}
                  onChange={(e) => setForm({ ...form, botToken: e.target.value })}
                  placeholder="123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pl-20 text-sm font-mono outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 px-2"
                >
                  {showToken ? "مخفی" : "نمایش"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                از @botfather در بله دریافت کنید —{" "}
                <a href="https://ble.ir/botfather" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)]">
                  ble.ir/botfather
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                شناسه چت (Chat ID)
              </label>
              <input
                value={form.chatId}
                onChange={(e) => setForm({ ...form, chatId: e.target.value })}
                placeholder="مثلاً 123456789 یا @channelusername"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                dir="ltr"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                شناسه عددی کاربر/گروه/کانال. برای پیدا کردن: به بازو پیام دهید و «دریافت Chat ID» را بزنید.
              </p>
            </div>

            {botInfo && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">{botInfo.first_name}</p>
                  <p className="text-xs text-emerald-600" dir="ltr">
                    @{botInfo.username || "—"} · id: {botInfo.id}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={testToken} loading={loading === "token"}>
                <Shield className="w-3.5 h-3.5" /> تست توکن
              </Button>
              <Button size="sm" variant="outline" onClick={fetchChats} loading={loading === "chats"} disabled={!form.botToken}>
                <RefreshCw className="w-3.5 h-3.5" /> دریافت Chat ID
              </Button>
              <Button size="sm" onClick={sendTest} loading={loading === "send"} disabled={!form.botToken || !form.chatId}>
                <MessageCircle className="w-3.5 h-3.5" /> ارسال پیام آزمایشی
              </Button>
            </div>
          </div>
        </Card>

        <Card title="رویدادهای اعلان">
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-2">انتخاب کنید برای کدام رویدادها پیام به بله ارسال شود:</p>
            <Toggle
              checked={form.notifyOnInvoice}
              onChange={(v) => setForm({ ...form, notifyOnInvoice: v })}
              label="ثبت فاکتور فروش جدید"
            />
            <Toggle
              checked={form.notifyOnMoadian}
              onChange={(v) => setForm({ ...form, notifyOnMoadian: v })}
              label="نتیجه ارسال به سامانه مودیان"
            />
            <Toggle
              checked={form.notifyOnLowStock}
              onChange={(v) => setForm({ ...form, notifyOnLowStock: v })}
              label="هشدار موجودی کم"
            />
            <Toggle
              checked={form.notifyOnCheque}
              onChange={(v) => setForm({ ...form, notifyOnCheque: v })}
              label="یادآوری سررسید چک"
            />
            <Toggle
              checked={form.notifyOnLogin}
              onChange={(v) => setForm({ ...form, notifyOnLogin: v })}
              label="ورود کاربران به سیستم"
            />
          </div>
        </Card>

        {chats.length > 0 && (
          <Card title="گفتگوهای پیدا‌شده" className="lg:col-span-2" subtitle="برای انتخاب Chat ID روی ردیف کلیک کنید">
            <div className="space-y-2">
              {chats.map((c) => (
                <button
                  key={String(c.chatId)}
                  onClick={() => {
                    setForm({ ...form, chatId: String(c.chatId) });
                    setMsg({ type: "success", text: `Chat ID تنظیم شد: ${c.chatId} (${c.title})` });
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-right transition-all ${
                    String(form.chatId) === String(c.chatId)
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.type} {c.lastMessage ? `— ${c.lastMessage}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded" dir="ltr">{c.chatId}</code>
                    {String(form.chatId) === String(c.chatId) && (
                      <CheckCircle className="w-4 h-4 text-[var(--color-primary)]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        <Card title="راهنمای راه‌اندازی" className="lg:col-span-2">
          <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside">
            <li>
              در بله به{" "}
              <a href="https://ble.ir/botfather" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] font-medium">
                @botfather
              </a>{" "}
              پیام دهید و با دستور <code className="bg-slate-100 px-1 rounded text-xs">/newbot</code> بازوی جدید بسازید.
            </li>
            <li>توکن دریافتی را در فیلد «توکن بازو» وارد کنید و «تست توکن» را بزنید.</li>
            <li>به بازوی خودتان در بله پیام دهید (مثلاً <code className="bg-slate-100 px-1 rounded text-xs">/start</code>).</li>
            <li>دکمه «دریافت Chat ID» را بزنید و گفتگوی خود را انتخاب کنید.</li>
            <li>«ارسال پیام آزمایشی» را بزنید تا از صحت اتصال مطمئن شوید.</li>
            <li>تنظیمات را ذخیره کنید. از این پس اعلان‌ها خودکار ارسال می‌شوند.</li>
          </ol>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono" dir="ltr">
            API: POST https://tapi.bale.ai/bot{"{token}"}/sendMessage
            <br />
            Body: {"{"} &quot;chat_id&quot;: &quot;...&quot;, &quot;text&quot;: &quot;...&quot; {"}"}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save}>
              <CheckCircle className="w-4 h-4" /> ذخیره تنظیمات بله
            </Button>
            <a
              href="https://docs.bale.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 hover:text-[var(--color-primary)]"
            >
              <ExternalLink className="w-4 h-4" /> مستندات docs.bale.ai
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
