"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card, Badge, Button, Table, Td, Money, PageHeader, SearchBox, Modal,
  Input, Select, Tabs, Alert, formatDate, toPersianDigits,
} from "@/components/ui";
import { Plus, ShoppingCart, Truck, Percent, Send } from "lucide-react";
import { sendInvoiceMoadianFlow } from "@/components/modules/Integrations";
import type { SalesInvoice } from "@/lib/types";

export function SalesInvoicesModule() {
  const {
    salesInvoices, customers, products, addSalesInvoice, currentUser, settings,
    updateInvoiceMoadian, addMoadianSubmission, addAuditLog, setActiveModule,
  } = useAppStore();
  const [tab, setTab] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [sendingMoadian, setSendingMoadian] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerId: "", type: "invoice",
    items: [{ productId: "", quantity: "1", unitPrice: "", discount: "0" }],
  });

  const filtered = tab === "all" ? salesInvoices : salesInvoices.filter((i) => i.status === tab || i.type === tab);

  const statusLabel = (s: string) =>
    ({ draft: "پیش‌نویس", confirmed: "تأیید‌شده", paid: "پرداخت‌شده", partial: "پرداخت جزئی", cancelled: "لغو" }[s] || s);
  const statusBadge = (s: string): "default" | "info" | "success" | "warning" | "danger" =>
    ({ draft: "default", confirmed: "info", paid: "success", partial: "warning", cancelled: "danger" }[s] as "default" | "info" | "success" | "warning" | "danger") || "default";
  const typeLabel = (t: string) =>
    ({ proforma: "پیش‌فاکتور", invoice: "فاکتور", return: "برگشت از فروش" }[t] || t);

  const notifyBaleInvoice = async (inv: { number: string; customerName: string; total: number; itemsCount: number }) => {
    const bale = settings.bale;
    if (!bale?.enabled || !bale.notifyOnInvoice || !bale.botToken || !bale.chatId) return;
    const text = [
      "🧾 فاکتور فروش جدید",
      ``,
      `شماره: ${inv.number}`,
      `مشتری: ${inv.customerName}`,
      `مبلغ: ${new Intl.NumberFormat("fa-IR").format(inv.total)} ریال`,
      `تعداد اقلام: ${inv.itemsCount}`,
      `ثبت‌کننده: ${currentUser?.fullName || "—"}`,
      `زمان: ${new Date().toLocaleString("fa-IR")}`,
    ].join("\n");
    try {
      await fetch("/api/bale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", botToken: bale.botToken, chatId: bale.chatId, text }),
      });
    } catch { /* silent */ }
  };

  const handleSendMoadian = async (inv: SalesInvoice) => {
    setSendingMoadian(inv.id);
    try {
      await sendInvoiceMoadianFlow(inv, {
        settings: {
          moadian: settings.moadian || { enabled: true, mode: "sandbox", fiscalId: "", economicCode: "", privateKey: "", certificate: "", clientId: "", autoSendOnConfirm: false },
          vatRate: settings.vatRate,
          bale: settings.bale,
        },
        customers,
        products,
        currentUserName: currentUser?.fullName || "کاربر",
        updateInvoiceMoadian,
        addMoadianSubmission,
        addAuditLog,
      });
    } finally {
      setSendingMoadian(null);
    }
  };

  const handleAdd = async () => {
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer) return;
    const items = form.items.filter((i) => i.productId).map((i, idx) => {
      const p = products.find((pr) => pr.id === i.productId)!;
      const qty = Number(i.quantity);
      const price = Number(i.unitPrice) || p.salePrice;
      const disc = Number(i.discount) || 0;
      return {
        id: `new-${idx}`, productId: p.id, productName: p.name, sku: p.sku,
        quantity: qty, unit: p.unit, unitPrice: price, discount: disc,
        total: qty * price - disc,
      };
    });
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discount = items.reduce((s, i) => s + i.discount, 0);
    const vat = Math.round((subtotal - discount) * (settings.vatRate / 100));
    const total = subtotal - discount + vat;
    const number = `F-1403-${String(900 + salesInvoices.length).padStart(4, "0")}`;

    addSalesInvoice({
      number,
      type: form.type as "invoice",
      date: new Date().toISOString(),
      customerId: customer.id,
      customerName: customer.name,
      items, subtotal, discount, discountType: "amount", vat, total,
      status: "confirmed",
      salesperson: currentUser?.fullName,
      commission: Math.round(total * 0.02),
      paidAmount: 0,
      moadianStatus: "not_sent",
    });
    setShowAdd(false);

    // Bale notify
    notifyBaleInvoice({ number, customerName: customer.name, total, itemsCount: items.length });

    // Auto-send to Moadian if configured
    if (settings.moadian?.autoSendOnConfirm && form.type === "invoice") {
      // Wait a tick for store to update, then find and send
      setTimeout(() => {
        const latest = useAppStore.getState().salesInvoices.find((i) => i.number === number);
        if (latest) handleSendMoadian(latest);
      }, 300);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="فاکتورهای فروش"
        subtitle="پیش‌فاکتور، فاکتور فروش، برگشت از فروش، تخفیف و پورسانت"
        actions={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> فاکتور جدید</Button>}
      />

      <Alert variant="info">
        یکپارچگی لحظه‌ای: ثبت فاکتور فروش بلافاصله موجودی انبار را کسر، سند حسابداری صادر و حساب مشتری را بدهکار می‌کند.
      </Alert>

      <Tabs
        tabs={[
          { id: "all", label: "همه", count: salesInvoices.length },
          { id: "confirmed", label: "تأیید‌شده" },
          { id: "paid", label: "پرداخت‌شده" },
          { id: "draft", label: "پیش‌نویس" },
          { id: "proforma", label: "پیش‌فاکتور" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="space-y-3">
        {filtered.map((inv) => (
          <Card key={inv.id} className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-3 flex-wrap">
                <ShoppingCart className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-sm font-semibold text-[var(--color-primary)]">{inv.number}</span>
                <Badge variant="purple">{typeLabel(inv.type)}</Badge>
                <Badge variant={statusBadge(inv.status)}>{statusLabel(inv.status)}</Badge>
                {inv.moadianStatus && inv.moadianStatus !== "not_sent" && (
                  <Badge variant={
                    inv.moadianStatus === "success" || inv.moadianStatus === "sent" ? "success" :
                    inv.moadianStatus === "failed" ? "danger" :
                    inv.moadianStatus === "demo" ? "purple" : "warning"
                  }>
                    مودیان: {
                      inv.moadianStatus === "sent" ? "ارسال‌شده" :
                      inv.moadianStatus === "success" ? "تأیید" :
                      inv.moadianStatus === "failed" ? "رد" :
                      inv.moadianStatus === "demo" ? "دمو" :
                      inv.moadianStatus === "pending" ? "در صف" : inv.moadianStatus
                    }
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{inv.customerName}</span>
                <span>{formatDate(inv.date)}</span>
                {inv.salesperson && <span>{inv.salesperson}</span>}
                {(inv.status === "confirmed" || inv.status === "paid") && inv.type !== "proforma" && (
                  <Button
                    size="sm"
                    variant={inv.moadianStatus === "sent" || inv.moadianStatus === "success" || inv.moadianStatus === "demo" ? "outline" : "primary"}
                    loading={sendingMoadian === inv.id}
                    disabled={sendingMoadian === inv.id}
                    onClick={() => handleSendMoadian(inv)}
                    title="ارسال به سامانه مودیان"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {inv.moadianStatus === "sent" || inv.moadianStatus === "success" || inv.moadianStatus === "demo" ? "ارسال مجدد" : "مودیان"}
                  </Button>
                )}
              </div>
            </div>
            <div className="px-5 py-3">
              <Table headers={["SKU", "کالا", "تعداد", "فی", "تخفیف", "جمع"]}>
                {inv.items.map((item) => (
                  <tr key={item.id}>
                    <Td className="font-mono text-xs">{item.sku}</Td>
                    <Td>{item.productName}</Td>
                    <Td>{toPersianDigits(item.quantity)} {item.unit}</Td>
                    <Td><Money amount={item.unitPrice} /></Td>
                    <Td>{item.discount > 0 ? <Money amount={item.discount} className="text-red-500" /> : "—"}</Td>
                    <Td><Money amount={item.total} /></Td>
                  </tr>
                ))}
              </Table>
              <div className="flex flex-wrap justify-end gap-6 mt-3 text-sm border-t border-slate-100 pt-3">
                <span>جمع: <Money amount={inv.subtotal} /></span>
                {inv.discount > 0 && <span className="text-red-500">تخفیف: <Money amount={inv.discount} /></span>}
                <span>VAT: <Money amount={inv.vat} /></span>
                <span className="font-bold">مبلغ کل: <Money amount={inv.total} className="text-[var(--color-primary)]" /></span>
                {inv.commission && <span className="text-emerald-600">پورسانت: <Money amount={inv.commission} /></span>}
              </div>
              {inv.moadianTaxId && (
                <div className="mt-2 text-xs text-slate-500 font-mono bg-slate-50 rounded-lg px-3 py-2" dir="ltr">
                  TaxID: {inv.moadianTaxId}
                  {inv.moadianUid && ` · UID: ${inv.moadianUid}`}
                  {inv.moadianRefNumber && ` · Ref: ${inv.moadianRefNumber}`}
                </div>
              )}
              {inv.moadianError && (
                <p className="mt-1 text-xs text-red-500">{inv.moadianError}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setActiveModule("accounting-moadian")}>
          مدیریت سامانه مودیان
        </Button>
        <Button variant="outline" size="sm" onClick={() => setActiveModule("admin-bale")}>
          تنظیمات اعلان بله
        </Button>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="صدور فاکتور فروش" size="xl" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={handleAdd}>ثبت و تأیید فاکتور</Button></>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="مشتری" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              options={[{ value: "", label: "انتخاب مشتری" }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Select label="نوع" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: "invoice", label: "فاکتور فروش" },
                { value: "proforma", label: "پیش‌فاکتور" },
                { value: "return", label: "برگشت از فروش" },
              ]}
            />
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg">
              <Select label="کالا" value={item.productId}
                onChange={(e) => {
                  const items = [...form.items];
                  const p = products.find((pr) => pr.id === e.target.value);
                  items[i] = { ...items[i], productId: e.target.value, unitPrice: p ? String(p.salePrice) : "" };
                  setForm({ ...form, items });
                }}
                options={[{ value: "", label: "انتخاب کالا" }, ...products.map((p) => ({ value: p.id, label: `${p.name} (${toPersianDigits(p.stock)} موجود)` }))]}
              />
              <Input label="تعداد" type="number" value={item.quantity}
                onChange={(e) => { const items = [...form.items]; items[i] = { ...items[i], quantity: e.target.value }; setForm({ ...form, items }); }}
              />
              <Input label="فی" type="number" value={item.unitPrice}
                onChange={(e) => { const items = [...form.items]; items[i] = { ...items[i], unitPrice: e.target.value }; setForm({ ...form, items }); }}
              />
              <Input label="تخفیف" type="number" value={item.discount}
                onChange={(e) => { const items = [...form.items]; items[i] = { ...items[i], discount: e.target.value }; setForm({ ...form, items }); }}
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() =>
            setForm({ ...form, items: [...form.items, { productId: "", quantity: "1", unitPrice: "", discount: "0" }] })
          }>
            <Plus className="w-3 h-3" /> افزودن ردیف
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function CustomersModule() {
  const { customers, addCustomer } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", type: "retail", phone: "", creditLimit: "100000000", category: "خرده‌فروش" });

  const filtered = customers.filter((c) => c.name.includes(search) || c.code.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="مدیریت مشتریان"
        subtitle="پرونده مالی و تجاری، سقف اعتبار، سابقه خرید و دسته‌بندی"
        actions={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> مشتری جدید</Button>}
      />

      <SearchBox value={search} onChange={setSearch} placeholder="جستجوی مشتری..." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 text-white flex items-center justify-center font-bold text-sm">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{c.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{c.code}</p>
                </div>
              </div>
              <Badge variant={c.type === "wholesale" ? "info" : c.type === "retail" ? "success" : "purple"}>
                {c.type === "wholesale" ? "عمده" : c.type === "retail" ? "خرده" : "هر دو"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400">مانده حساب</p>
                <Money amount={c.balance} className={c.balance > 0 ? "text-red-600" : "text-emerald-600"} />
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400">سقف اعتبار</p>
                <Money amount={c.creditLimit} />
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400">کل خریدها</p>
                <Money amount={c.totalPurchases} />
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400">دسته</p>
                <p className="font-medium text-slate-700">{c.category}</p>
              </div>
            </div>
            {c.phone && <p className="text-xs text-slate-400 mt-2" dir="ltr">{c.phone}</p>}
            {/* Credit usage */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>استفاده از اعتبار</span>
                <span>{toPersianDigits(Math.round((c.balance / c.creditLimit) * 100))}٪</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.balance / c.creditLimit > 0.8 ? "bg-red-500" : c.balance / c.creditLimit > 0.5 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, (c.balance / c.creditLimit) * 100)}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="ثبت مشتری جدید" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={() => {
          addCustomer({
            code: form.code, name: form.name, type: form.type as "retail", phone: form.phone,
            creditLimit: Number(form.creditLimit), balance: 0, category: form.category,
            isActive: true, totalPurchases: 0,
          });
          setShowAdd(false);
        }}>ثبت</Button></>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="کد" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input label="نام" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <Select label="نوع" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { value: "wholesale", label: "عمده‌فروش" },
              { value: "retail", label: "خرده‌فروش" },
              { value: "both", label: "هر دو" },
            ]}
          />
          <Input label="تلفن" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="سقف اعتبار" type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

export function CommissionModule() {
  const { salesInvoices } = useAppStore();
  const withCommission = salesInvoices.filter((i) => i.commission && i.commission > 0);

  const byPerson = withCommission.reduce((acc, inv) => {
    const name = inv.salesperson || "نامشخص";
    if (!acc[name]) acc[name] = { total: 0, count: 0, sales: 0 };
    acc[name].total += inv.commission || 0;
    acc[name].count += 1;
    acc[name].sales += inv.total;
    return acc;
  }, {} as Record<string, { total: number; count: number; sales: number }>);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="پورسانت بازاریابان" subtitle="محاسبه پورسانت بر اساس فروش" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(byPerson).map(([name, data]) => (
          <Card key={name}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{name}</h3>
                <p className="text-xs text-slate-400">{toPersianDigits(data.count)} فاکتور</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-[10px] text-emerald-600">کل پورسانت</p>
                <Money amount={data.total} className="text-emerald-700 font-bold" />
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400">کل فروش</p>
                <Money amount={data.sales} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="جزئیات پورسانت" noPadding>
        <Table headers={["فاکتور", "مشتری", "بازاریاب", "مبلغ فروش", "پورسانت", "تاریخ"]}>
          {withCommission.map((inv) => (
            <tr key={inv.id}>
              <Td className="font-mono text-xs">{inv.number}</Td>
              <Td>{inv.customerName}</Td>
              <Td>{inv.salesperson}</Td>
              <Td><Money amount={inv.total} /></Td>
              <Td><Money amount={inv.commission!} className="text-emerald-600" /></Td>
              <Td className="text-xs">{formatDate(inv.date)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

export function PurchaseInvoicesModule() {
  const { purchaseInvoices, suppliers, products, addPurchaseInvoice, settings } = useAppStore();
  const [tab, setTab] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    supplierId: "", type: "invoice",
    items: [{ productId: "", quantity: "1", unitPrice: "" }],
  });

  const filtered = tab === "all" ? purchaseInvoices : purchaseInvoices.filter((i) => i.status === tab || i.type === tab);

  const typeLabel = (t: string) =>
    ({ request: "درخواست خرید", inquiry: "استعلام قیمت", order: "سفارش خرید", invoice: "فاکتور خرید", return: "برگشت از خرید" }[t] || t);
  const statusLabel = (s: string) =>
    ({ draft: "پیش‌نویس", pending: "در انتظار", confirmed: "تأیید‌شده", received: "دریافت‌شده", paid: "پرداخت‌شده", cancelled: "لغو" }[s] || s);
  const statusBadge = (s: string): "default" | "warning" | "info" | "success" | "danger" | "purple" =>
    ({ draft: "default", pending: "warning", confirmed: "info", received: "success", paid: "purple", cancelled: "danger" }[s] as "default" | "warning" | "info" | "success" | "danger" | "purple") || "default";

  const handleAdd = () => {
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    if (!supplier) return;
    const items = form.items.filter((i) => i.productId).map((i, idx) => {
      const p = products.find((pr) => pr.id === i.productId)!;
      const qty = Number(i.quantity);
      const price = Number(i.unitPrice) || p.unitCost;
      return {
        id: `np-${idx}`, productId: p.id, productName: p.name, sku: p.sku,
        quantity: qty, unit: p.unit, unitPrice: price, discount: 0, total: qty * price,
      };
    });
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const vat = Math.round(subtotal * (settings.vatRate / 100));
    addPurchaseInvoice({
      number: `P-1403-${String(500 + purchaseInvoices.length).padStart(4, "0")}`,
      type: form.type as "invoice",
      date: new Date().toISOString(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      items, subtotal, discount: 0, vat, total: subtotal + vat,
      status: form.type === "request" ? "draft" : "pending",
      paidAmount: 0,
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="چرخه خرید"
        subtitle="درخواست خرید ← استعلام قیمت ← سفارش خرید ← فاکتور خرید"
        actions={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> سند خرید جدید</Button>}
      />

      <Tabs
        tabs={[
          { id: "all", label: "همه", count: purchaseInvoices.length },
          { id: "request", label: "درخواست" },
          { id: "order", label: "سفارش" },
          { id: "invoice", label: "فاکتور" },
          { id: "pending", label: "در انتظار" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="space-y-3">
        {filtered.map((inv) => (
          <Card key={inv.id} className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-sm font-semibold text-[var(--color-primary)]">{inv.number}</span>
                <Badge variant="info">{typeLabel(inv.type)}</Badge>
                <Badge variant={statusBadge(inv.status)}>{statusLabel(inv.status)}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{inv.supplierName}</span>
                <span>{formatDate(inv.date)}</span>
              </div>
            </div>
            <div className="px-5 py-3">
              <Table headers={["SKU", "کالا", "تعداد", "فی", "جمع"]}>
                {inv.items.map((item) => (
                  <tr key={item.id}>
                    <Td className="font-mono text-xs">{item.sku}</Td>
                    <Td>{item.productName}</Td>
                    <Td>{toPersianDigits(item.quantity)} {item.unit}</Td>
                    <Td><Money amount={item.unitPrice} /></Td>
                    <Td><Money amount={item.total} /></Td>
                  </tr>
                ))}
              </Table>
              <div className="flex justify-end gap-6 mt-3 text-sm border-t border-slate-100 pt-3">
                <span>جمع: <Money amount={inv.subtotal} /></span>
                <span>VAT: <Money amount={inv.vat} /></span>
                <span className="font-bold">مبلغ کل: <Money amount={inv.total} className="text-[var(--color-primary)]" /></span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="ثبت سند خرید" size="xl" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={handleAdd}>ثبت</Button></>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="تامین‌کننده" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              options={[{ value: "", label: "انتخاب" }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
            />
            <Select label="نوع سند" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: "request", label: "درخواست خرید" },
                { value: "inquiry", label: "استعلام قیمت" },
                { value: "order", label: "سفارش خرید" },
                { value: "invoice", label: "فاکتور خرید" },
              ]}
            />
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
              <Select label="کالا" value={item.productId}
                onChange={(e) => {
                  const items = [...form.items];
                  const p = products.find((pr) => pr.id === e.target.value);
                  items[i] = { ...items[i], productId: e.target.value, unitPrice: p ? String(p.unitCost) : "" };
                  setForm({ ...form, items });
                }}
                options={[{ value: "", label: "انتخاب کالا" }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
              />
              <Input label="تعداد" type="number" value={item.quantity}
                onChange={(e) => { const items = [...form.items]; items[i] = { ...items[i], quantity: e.target.value }; setForm({ ...form, items }); }}
              />
              <Input label="فی" type="number" value={item.unitPrice}
                onChange={(e) => { const items = [...form.items]; items[i] = { ...items[i], unitPrice: e.target.value }; setForm({ ...form, items }); }}
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() =>
            setForm({ ...form, items: [...form.items, { productId: "", quantity: "1", unitPrice: "" }] })
          }>
            <Plus className="w-3 h-3" /> افزودن ردیف
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function SuppliersModule() {
  const { suppliers, addSupplier } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", phone: "", category: "تولیدکننده" });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="تامین‌کنندگان"
        subtitle="مدیریت تامین‌کنندگان و سوابق خرید"
        actions={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> تامین‌کننده جدید</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center font-bold text-sm">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{s.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{s.code}</p>
                </div>
              </div>
              <Badge>{s.category}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400">مانده بدهی</p>
                <Money amount={s.balance} className={s.balance > 0 ? "text-red-600" : "text-emerald-600"} />
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400">کل خریدها</p>
                <Money amount={s.totalPurchases} />
              </div>
            </div>
            {s.phone && <p className="text-xs text-slate-400 mt-2" dir="ltr">{s.phone}</p>}
            {s.address && <p className="text-xs text-slate-400 mt-1">{s.address}</p>}
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="ثبت تامین‌کننده" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={() => {
          addSupplier({ code: form.code, name: form.name, phone: form.phone, category: form.category, balance: 0, isActive: true, totalPurchases: 0 });
          setShowAdd(false);
        }}>ثبت</Button></>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="کد" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input label="نام" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <Input label="تلفن" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="دسته‌بندی" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
