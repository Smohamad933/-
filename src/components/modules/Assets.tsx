"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card, Badge, Button, Table, Td, Money, PageHeader, SearchBox, Modal,
  Input, Select, ProgressBar, formatDate, toPersianDigits,
} from "@/components/ui";
import { Plus, Building2, MapPin, User, Shield } from "lucide-react";

export function AssetsListModule() {
  const { assets, addAsset } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    plaqueNumber: "", name: "", category: "", purchaseCost: "", usefulLife: "10",
    depreciationMethod: "straight_line", location: "", costCenter: "", responsible: "",
  });

  const filtered = assets.filter(
    (a) => a.name.includes(search) || a.plaqueNumber.includes(search)
  );

  const statusLabel = (s: string) =>
    ({ active: "فعال", under_repair: "در تعمیر", sold: "فروخته‌شده", scrapped: "اسقاط", transferred: "منتقل‌شده" }[s] || s);
  const statusBadge = (s: string): "success" | "warning" | "info" | "danger" | "purple" =>
    ({ active: "success", under_repair: "warning", sold: "info", scrapped: "danger", transferred: "purple" }[s] as "success" | "warning" | "info" | "danger" | "purple") || "default";
  const methodLabel = (m: string) =>
    ({ straight_line: "خط مستقیم", declining: "نزولی", units_of_production: "بر اساس کارکرد" }[m] || m);

  const totalCost = assets.reduce((s, a) => s + a.purchaseCost, 0);
  const totalCurrent = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalDep = assets.reduce((s, a) => s + a.accumulatedDepreciation, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="لیست اموال و دارایی‌ها"
        subtitle="شناسنامه اموال — پلاک، بارکد، محل استقرار، مرکز هزینه و مسئول"
        actions={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> دارایی جدید</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="!p-4">
          <p className="text-xs text-slate-500">تعداد دارایی</p>
          <p className="text-2xl font-bold text-slate-800">{toPersianDigits(assets.length)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">بهای تمام‌شده کل</p>
          <Money amount={totalCost} className="text-lg font-bold" />
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">ارزش دفتری کل</p>
          <Money amount={totalCurrent} className="text-lg font-bold text-blue-700" />
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">استهلاک انباشته</p>
          <Money amount={totalDep} className="text-lg font-bold text-red-600" />
        </Card>
      </div>

      <SearchBox value={search} onChange={setSearch} placeholder="جستجو بر اساس نام یا شماره پلاک..." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((asset) => {
          const depPct = (asset.accumulatedDepreciation / asset.purchaseCost) * 100;
          return (
            <Card key={asset.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{asset.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{asset.plaqueNumber}
                      {asset.barcode && ` | ${asset.barcode}`}
                    </p>
                  </div>
                </div>
                <Badge variant={statusBadge(asset.status)}>{statusLabel(asset.status)}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3 h-3" /> {asset.location}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <User className="w-3 h-3" /> {asset.responsible}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-400">بهای خرید</p>
                  <Money amount={asset.purchaseCost} className="text-xs" />
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-400">ارزش دفتری</p>
                  <Money amount={asset.currentValue} className="text-xs text-blue-700" />
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[10px] text-slate-400">روش استهلاک</p>
                  <p className="text-xs font-medium text-slate-700">{methodLabel(asset.depreciationMethod)}</p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>استهلاک</span>
                  <span>{toPersianDigits(Math.round(depPct))}٪</span>
                </div>
                <ProgressBar value={depPct} color={depPct > 70 ? "red" : depPct > 40 ? "amber" : "blue"} />
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>{asset.category}</span>
                <span>•</span>
                <span>عمر مفید: {toPersianDigits(asset.usefulLife)} سال</span>
                <span>•</span>
                <span>خرید: {formatDate(asset.purchaseDate)}</span>
                {asset.insurance && (
                  <><span>•</span><Shield className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">بیمه</span></>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="ثبت دارایی جدید" size="lg" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={() => {
          const cost = Number(form.purchaseCost);
          addAsset({
            plaqueNumber: form.plaqueNumber, name: form.name, category: form.category,
            purchaseDate: new Date().toISOString().split("T")[0], purchaseCost: cost,
            residualValue: cost * 0.1, usefulLife: Number(form.usefulLife),
            depreciationMethod: form.depreciationMethod as "straight_line",
            location: form.location, costCenter: form.costCenter, responsible: form.responsible,
            status: "active", currentValue: cost, accumulatedDepreciation: 0,
            maintenanceHistory: [], transferHistory: [],
          });
          setShowAdd(false);
        }}>ثبت دارایی</Button></>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="شماره پلاک اموال" value={form.plaqueNumber} onChange={(e) => setForm({ ...form, plaqueNumber: e.target.value })} />
            <Input label="نام دارایی" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="دسته‌بندی" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="بهای تمام‌شده" type="number" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="عمر مفید (سال)" type="number" value={form.usefulLife} onChange={(e) => setForm({ ...form, usefulLife: e.target.value })} />
            <Select label="روش استهلاک" value={form.depreciationMethod} onChange={(e) => setForm({ ...form, depreciationMethod: e.target.value })}
              options={[
                { value: "straight_line", label: "خط مستقیم" },
                { value: "declining", label: "نزولی" },
                { value: "units_of_production", label: "بر اساس کارکرد" },
              ]}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="محل استقرار" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input label="مرکز هزینه" value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} />
            <Input label="مسئول" value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function DepreciationModule() {
  const { assets } = useAppStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="محاسبه استهلاک"
        subtitle="محاسبه خودکار استهلاک دوره‌ای — خط مستقیم، نزولی و بر اساس کارکرد"
        actions={<Button size="sm">محاسبه استهلاک ماهانه</Button>}
      />

      <Card noPadding>
        <Table headers={["پلاک", "نام دارایی", "بهای خرید", "روش", "عمر مفید", "استهلاک ماهانه", "استهلاک انباشته", "ارزش دفتری", "درصد"]}>
          {assets.filter((a) => a.status === "active" || a.status === "under_repair").map((a) => {
            const monthly =
              a.depreciationMethod === "straight_line"
                ? (a.purchaseCost - a.residualValue) / (a.usefulLife * 12)
                : a.depreciationMethod === "declining"
                ? (a.currentValue * 2) / a.usefulLife / 12
                : (a.purchaseCost - a.residualValue) / (a.usefulLife * 12);
            const pct = (a.accumulatedDepreciation / a.purchaseCost) * 100;
            return (
              <tr key={a.id} className="hover:bg-slate-50">
                <Td className="font-mono text-xs">{a.plaqueNumber}</Td>
                <Td className="font-medium">{a.name}</Td>
                <Td><Money amount={a.purchaseCost} /></Td>
                <Td>
                  <Badge variant="info">
                    {a.depreciationMethod === "straight_line" ? "خط مستقیم" :
                     a.depreciationMethod === "declining" ? "نزولی" : "کارکرد"}
                  </Badge>
                </Td>
                <Td>{toPersianDigits(a.usefulLife)} سال</Td>
                <Td><Money amount={Math.round(monthly)} /></Td>
                <Td><Money amount={a.accumulatedDepreciation} className="text-red-600" /></Td>
                <Td><Money amount={a.currentValue} className="text-blue-700" /></Td>
                <Td className="w-28">
                  <ProgressBar value={pct} color={pct > 70 ? "red" : "blue"} showLabel />
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}

export function MaintenanceModule() {
  const { assets } = useAppStore();
  const allMaintenance = assets.flatMap((a) =>
    a.maintenanceHistory.map((m) => ({ ...m, assetName: a.name, plaque: a.plaqueNumber }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allTransfers = assets.flatMap((a) =>
    a.transferHistory.map((t) => ({ ...t, assetName: a.name, plaque: a.plaqueNumber }))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="تعمیر و نگهداری"
        subtitle="سرویس‌های دوره‌ای، نقل‌وانتقال، ارتقا، بیمه، فروش یا اسقاط"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="تاریخچه تعمیرات و نگهداری" noPadding>
          <Table headers={["تاریخ", "دارایی", "نوع", "شرح", "هزینه"]}>
            {allMaintenance.map((m) => (
              <tr key={m.id}>
                <Td className="text-xs">{formatDate(m.date)}</Td>
                <Td>
                  <p className="text-sm">{m.assetName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{m.plaque}</p>
                </Td>
                <Td>
                  <Badge variant={m.type === "repair" ? "danger" : m.type === "upgrade" ? "purple" : "info"}>
                    {m.type === "repair" ? "تعمیر" : m.type === "upgrade" ? "ارتقا" : "دوره‌ای"}
                  </Badge>
                </Td>
                <Td className="text-xs">{m.description}</Td>
                <Td><Money amount={m.cost} /></Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="تاریخچه نقل‌وانتقال" noPadding>
          {allTransfers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">نقل‌وانتقالی ثبت نشده</div>
          ) : (
            <Table headers={["تاریخ", "دارایی", "از", "به", "دلیل"]}>
              {allTransfers.map((t) => (
                <tr key={t.id}>
                  <Td className="text-xs">{formatDate(t.date)}</Td>
                  <Td>{t.assetName}</Td>
                  <Td className="text-xs">{t.fromLocation}</Td>
                  <Td className="text-xs">{t.toLocation}</Td>
                  <Td className="text-xs">{t.reason}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {/* Insurance */}
      <Card title="بیمه دارایی‌ها" noPadding>
        <Table headers={["دارایی", "شرکت بیمه", "شماره بیمه‌نامه", "شروع", "پایان", "مبلغ پوشش"]}>
          {assets.filter((a) => a.insurance).map((a) => (
            <tr key={a.id}>
              <Td className="font-medium">{a.name}</Td>
              <Td>{a.insurance!.company}</Td>
              <Td className="font-mono text-xs">{a.insurance!.policyNumber}</Td>
              <Td className="text-xs">{formatDate(a.insurance!.startDate)}</Td>
              <Td className="text-xs">{formatDate(a.insurance!.endDate)}</Td>
              <Td><Money amount={a.insurance!.amount} /></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
