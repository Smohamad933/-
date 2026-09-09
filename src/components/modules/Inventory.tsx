"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card, Badge, Button, Table, Td, Money, PageHeader, SearchBox, Modal,
  Input, Select, Tabs, ProgressBar, Alert, formatDate, toPersianDigits,
} from "@/components/ui";
import { Plus, Warehouse, AlertTriangle, ArrowRightLeft } from "lucide-react";

export function WarehousesModule() {
  const { warehouses, addWarehouse, products } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", type: "branch", address: "", manager: "" });

  const typeLabel = (t: string) =>
    ({ central: "مرکزی", branch: "شعبه", production: "تولید", consignment: "امانت" }[t] || t);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="مدیریت انبارها"
        subtitle="پشتیبانی از چندین انبار مجزا و انتقال کالا بین انبارها"
        actions={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> انبار جدید</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map((wh) => {
          const whProducts = products.filter((p) => p.warehouseId === wh.id);
          const totalValue = whProducts.reduce((s, p) => s + p.stock * p.unitCost, 0);
          return (
            <Card key={wh.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{wh.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{wh.code}</p>
                  </div>
                </div>
                <Badge variant={wh.isActive ? "success" : "default"}>{wh.isActive ? "فعال" : "غیرفعال"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400">نوع</p>
                  <p className="font-medium text-slate-700">{typeLabel(wh.type)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400">تعداد کالا</p>
                  <p className="font-medium text-slate-700">{toPersianDigits(whProducts.length)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400">مدیر انبار</p>
                  <p className="font-medium text-slate-700">{wh.manager || "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400">ارزش موجودی</p>
                  <Money amount={totalValue} className="text-sm" />
                </div>
              </div>
              {wh.address && <p className="text-xs text-slate-400 mt-3">{wh.address}</p>}
            </Card>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="تعریف انبار جدید" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={() => { addWarehouse({ ...form, type: form.type as "branch", isActive: true }); setShowAdd(false); }}>ثبت</Button></>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="کد انبار" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Input label="نام انبار" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <Select label="نوع" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { value: "central", label: "مرکزی" }, { value: "branch", label: "شعبه" },
              { value: "production", label: "پای خط تولید" }, { value: "consignment", label: "امانت" },
            ]}
          />
          <Input label="آدرس" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="مدیر انبار" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

export function ProductsModule() {
  const { products, warehouses, addProduct } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    sku: "", name: "", category: "", unit: "عدد", salePrice: "", unitCost: "",
    reorderPoint: "50", minStock: "20", maxStock: "500", warehouseId: "wh-1",
    costMethod: "weighted_avg", barcode: "",
  });

  const filtered = products.filter(
    (p) => p.name.includes(search) || p.sku.includes(search) || p.barcode?.includes(search)
  );

  const methodLabel = (m: string) =>
    ({ weighted_avg: "میانگین موزون", fifo: "FIFO", lifo: "LIFO" }[m] || m);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="شناسنامه کالا"
        subtitle="کدگذاری SKU، بارکد، پارت‌نامبر، دسته‌بندی چندسطحی، واحد اصلی و فرعی"
        actions={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> کالای جدید</Button>}
      />

      <SearchBox value={search} onChange={setSearch} placeholder="جستجو بر اساس نام، SKU یا بارکد..." />

      <Card noPadding>
        <Table headers={["SKU", "نام کالا", "دسته‌بندی", "موجودی", "واحد", "بهای تمام‌شده", "قیمت فروش", "روش ارزیابی", "ردیابی", "وضعیت"]}>
          {filtered.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <Td className="font-mono text-xs text-[var(--color-primary)]">{p.sku}</Td>
              <Td>
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.barcode && <p className="text-[10px] text-slate-400 font-mono">{p.barcode}</p>}
                </div>
              </Td>
              <Td>
                <Badge>{p.category}</Badge>
                {p.subcategory && <span className="text-[10px] text-slate-400 block mt-0.5">{p.subcategory}</span>}
              </Td>
              <Td>
                <span className={p.stock <= p.reorderPoint ? "text-red-600 font-semibold" : ""}>
                  {toPersianDigits(p.stock)}
                </span>
                {p.stock <= p.reorderPoint && (
                  <AlertTriangle className="w-3 h-3 text-amber-500 inline mr-1" />
                )}
              </Td>
              <Td>
                {p.unit}
                {p.secondaryUnit && <span className="text-[10px] text-slate-400 block">({p.secondaryUnit}={toPersianDigits(p.conversionRate || 0)})</span>}
              </Td>
              <Td><Money amount={p.unitCost} /></Td>
              <Td><Money amount={p.salePrice} /></Td>
              <Td><Badge variant="info">{methodLabel(p.costMethod)}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  {p.serialTracking && <Badge variant="purple">سریال</Badge>}
                  {p.batchTracking && <Badge variant="info">بچ</Badge>}
                  {p.expiryTracking && <Badge variant="warning">انقضا</Badge>}
                  {!p.serialTracking && !p.batchTracking && !p.expiryTracking && <span className="text-slate-300">—</span>}
                </div>
              </Td>
              <Td>
                <Badge variant={p.isActive ? "success" : "default"}>{p.isActive ? "فعال" : "غیرفعال"}</Badge>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="تعریف کالای جدید" size="lg" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={() => {
          addProduct({
            sku: form.sku, name: form.name, category: form.category, unit: form.unit,
            salePrice: Number(form.salePrice), unitCost: Number(form.unitCost),
            reorderPoint: Number(form.reorderPoint), minStock: Number(form.minStock),
            maxStock: Number(form.maxStock), warehouseId: form.warehouseId,
            costMethod: form.costMethod as "weighted_avg", barcode: form.barcode || undefined,
            stock: 0, serialTracking: false, batchTracking: false, expiryTracking: false, isActive: true,
          });
          setShowAdd(false);
        }}>ثبت کالا</Button></>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <Input label="بارکد" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <Input label="نام کالا" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="دسته‌بندی" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="واحد" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Select label="روش ارزیابی" value={form.costMethod} onChange={(e) => setForm({ ...form, costMethod: e.target.value })}
              options={[
                { value: "weighted_avg", label: "میانگین موزون" },
                { value: "fifo", label: "FIFO" },
                { value: "lifo", label: "LIFO" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="بهای تمام‌شده" type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
            <Input label="قیمت فروش" type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="نقطه سفارش" type="number" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} />
            <Input label="حداقل موجودی" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
            <Input label="حداکثر موجودی" type="number" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: e.target.value })} />
          </div>
          <Select label="انبار" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          />
        </div>
      </Modal>
    </div>
  );
}

export function StockDocumentsModule() {
  const { stockDocuments } = useAppStore();
  const [tab, setTab] = useState("all");

  const typeLabel = (t: string) =>
    ({ receipt: "رسید ورود", issue: "حواله خروج", transfer: "انتقال", return_purchase: "برگشت از خرید",
       return_sale: "برگشت از فروش", waste: "ضایعات", adjustment: "کسری/اضافه" }[t] || t);
  const typeBadge = (t: string): "success" | "danger" | "info" | "warning" | "purple" =>
    ({ receipt: "success", issue: "danger", transfer: "info", return_purchase: "warning",
       return_sale: "purple", waste: "danger", adjustment: "warning" }[t] as "success" | "danger" | "info" | "warning" | "purple") || "default";

  const filtered = tab === "all" ? stockDocuments : stockDocuments.filter((d) => d.type === tab);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="اسناد انبار"
        subtitle="رسید ورود، حواله خروج، برگشت از خرید/فروش، ضایعات و کسری/اضافه"
      />

      <Tabs
        tabs={[
          { id: "all", label: "همه", count: stockDocuments.length },
          { id: "receipt", label: "رسید ورود" },
          { id: "issue", label: "حواله خروج" },
          { id: "transfer", label: "انتقال" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="space-y-3">
        {filtered.map((doc) => (
          <Card key={doc.id} className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-[var(--color-primary)]">{doc.number}</span>
                <Badge variant={typeBadge(doc.type)}>{typeLabel(doc.type)}</Badge>
                <Badge variant={doc.status === "confirmed" ? "success" : "warning"}>
                  {doc.status === "confirmed" ? "تأیید‌شده" : doc.status === "draft" ? "پیش‌نویس" : "لغو"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{doc.warehouseName}</span>
                {doc.type === "transfer" && <><ArrowRightLeft className="w-3 h-3" /><span>انبار مقصد</span></>}
                <span>{formatDate(doc.date)}</span>
              </div>
            </div>
            <div className="px-5 py-3">
              {doc.party && <p className="text-sm text-slate-600 mb-2">طرف حساب: {doc.party}</p>}
              <Table headers={["SKU", "کالا", "تعداد", "واحد", "فی", "جمع", "سریال/بچ"]}>
                {doc.items.map((item) => (
                  <tr key={item.id}>
                    <Td className="font-mono text-xs">{item.sku}</Td>
                    <Td>{item.productName}</Td>
                    <Td>{toPersianDigits(item.quantity)}</Td>
                    <Td>{item.unit}</Td>
                    <Td><Money amount={item.unitCost} /></Td>
                    <Td><Money amount={item.totalCost} /></Td>
                    <Td className="text-xs text-slate-400">{item.serial || item.batch || "—"}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StocktakeModule() {
  const { stockCounts } = useAppStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="انبارگردانی" subtitle="انبارگردانی دوره‌ای یا آنی، ثبت مغایرت‌ها و اصلاح اتوماتیک موجودی" />

      {stockCounts.map((sc) => (
        <Card key={sc.id} title={sc.warehouseName} subtitle={formatDate(sc.date)}
          action={<Badge variant={sc.status === "completed" ? "success" : sc.status === "adjusted" ? "info" : "warning"}>
            {sc.status === "completed" ? "تکمیل‌شده" : sc.status === "adjusted" ? "اصلاح‌شده" : "در حال انجام"}
          </Badge>}
        >
          <Table headers={["کالا", "موجودی سیستم", "شمارش‌شده", "مغایرت"]}>
            {sc.items.map((item) => (
              <tr key={item.productId}>
                <Td>{item.productName}</Td>
                <Td>{toPersianDigits(item.systemQty)}</Td>
                <Td>{toPersianDigits(item.countedQty)}</Td>
                <Td>
                  <span className={item.difference === 0 ? "text-emerald-600" : item.difference < 0 ? "text-red-600 font-semibold" : "text-blue-600 font-semibold"}>
                    {item.difference > 0 ? "+" : ""}{toPersianDigits(item.difference)}
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      ))}
    </div>
  );
}

export function InventoryAlertsModule() {
  const { products } = useAppStore();
  const lowStock = products.filter((p) => p.stock <= p.reorderPoint);
  const critical = products.filter((p) => p.stock <= p.minStock);
  const overstock = products.filter((p) => p.stock >= p.maxStock);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="هشدار موجودی" subtitle="نقطه سفارش، حد حداقل و حداکثر، هشدار اتمام کالا" />

      <div className="grid grid-cols-3 gap-4">
        <Card className="!p-4 border-r-4 border-r-red-500">
          <p className="text-xs text-slate-500">بحرانی (زیر حداقل)</p>
          <p className="text-2xl font-bold text-red-600">{toPersianDigits(critical.length)}</p>
        </Card>
        <Card className="!p-4 border-r-4 border-r-amber-500">
          <p className="text-xs text-slate-500">زیر نقطه سفارش</p>
          <p className="text-2xl font-bold text-amber-600">{toPersianDigits(lowStock.length)}</p>
        </Card>
        <Card className="!p-4 border-r-4 border-r-blue-500">
          <p className="text-xs text-slate-500">بیش از حداکثر</p>
          <p className="text-2xl font-bold text-blue-600">{toPersianDigits(overstock.length)}</p>
        </Card>
      </div>

      {critical.length > 0 && (
        <Alert variant="danger">
          {toPersianDigits(critical.length)} کالا در وضعیت بحرانی هستند و نیاز به سفارش فوری دارند.
        </Alert>
      )}

      <Card title="کالاهای نیازمند توجه" noPadding>
        <Table headers={["کالا", "SKU", "موجودی", "حداقل", "نقطه سفارش", "حداکثر", "وضعیت", "سطح"]}>
          {lowStock.map((p) => (
            <tr key={p.id}>
              <Td className="font-medium">{p.name}</Td>
              <Td className="font-mono text-xs">{p.sku}</Td>
              <Td className="font-semibold text-red-600">{toPersianDigits(p.stock)}</Td>
              <Td>{toPersianDigits(p.minStock)}</Td>
              <Td>{toPersianDigits(p.reorderPoint)}</Td>
              <Td>{toPersianDigits(p.maxStock)}</Td>
              <Td>
                <Badge variant={p.stock <= p.minStock ? "danger" : "warning"}>
                  {p.stock <= p.minStock ? "بحرانی" : "کمبود"}
                </Badge>
              </Td>
              <Td className="w-32">
                <ProgressBar value={p.stock} max={p.maxStock} color={p.stock <= p.minStock ? "red" : "amber"} />
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
