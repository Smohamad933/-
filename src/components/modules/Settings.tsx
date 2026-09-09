"use client";

import { useAppStore } from "@/lib/store";
import { Card, Button, Input, Select, Toggle, PageHeader, Alert, Badge } from "@/components/ui";
import { Save, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function SettingsModule() {
  const { settings, updateSettings, setActiveModule } = useAppStore();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="تنظیمات سیستم"
        subtitle="پیکربندی عمومی نرم‌افزار"
        actions={<Button onClick={handleSave} size="sm"><Save className="w-4 h-4" /> ذخیره تنظیمات</Button>}
      />

      {saved && <Alert variant="success">تنظیمات با موفقیت ذخیره شد.</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="اطلاعات شرکت">
          <div className="space-y-4">
            <Input
              label="نام شرکت"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
            <Input
              label="شروع سال مالی"
              type="date"
              value={form.fiscalYearStart}
              onChange={(e) => setForm({ ...form, fiscalYearStart: e.target.value })}
            />
            <Select
              label="واحد پول"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={[
                { value: "IRR", label: "ریال ایران (IRR)" },
                { value: "IRT", label: "تومان (IRT)" },
                { value: "USD", label: "دلار (USD)" },
              ]}
            />
          </div>
        </Card>

        <Card title="تنظیمات مالی">
          <div className="space-y-4">
            <Input
              label="نرخ مالیات بر ارزش افزوده (٪)"
              type="number"
              value={form.vatRate}
              onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })}
            />
            <Select
              label="روش پیش‌فرض ارزیابی موجودی"
              value={form.defaultCostMethod}
              onChange={(e) => setForm({ ...form, defaultCostMethod: e.target.value as "weighted_avg" })}
              options={[
                { value: "weighted_avg", label: "میانگین موزون" },
                { value: "fifo", label: "FIFO (اولین وارده از اولین صادره)" },
                { value: "lifo", label: "LIFO (آخرین وارده از اولین صادره)" },
              ]}
            />
            <Select
              label="زبان سیستم"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value as "fa" })}
              options={[
                { value: "fa", label: "فارسی" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
        </Card>

        <Card title="یکپارچه‌سازی‌ها">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-800">سامانه مودیان</p>
                <p className="text-xs text-slate-400">ارسال صورتحساب الکترونیکی</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={settings.moadian?.enabled ? "success" : "default"}>
                  {settings.moadian?.enabled ? "فعال" : "غیرفعال"}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setActiveModule("accounting-moadian")}>
                  تنظیم
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-800">اعلان‌های بله</p>
                <p className="text-xs text-slate-400">نوتیفیکیشن از طریق بازوی بله</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={settings.bale?.enabled ? "success" : "default"}>
                  {settings.bale?.enabled ? "فعال" : "غیرفعال"}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setActiveModule("admin-bale")}>
                  تنظیم
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card title="پشتیبان‌گیری">
          <div className="space-y-4">
            <Toggle
              checked={form.autoBackup}
              onChange={(v) => setForm({ ...form, autoBackup: v })}
              label="پشتیبان‌گیری خودکار"
            />
            <Select
              label="بازه پشتیبان‌گیری"
              value={form.backupInterval}
              onChange={(e) => setForm({ ...form, backupInterval: e.target.value as "daily" })}
              options={[
                { value: "daily", label: "روزانه" },
                { value: "weekly", label: "هفتگی" },
                { value: "monthly", label: "ماهانه" },
              ]}
            />
          </div>
        </Card>

        <Card title="درباره سیستم" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400">نام سیستم</p>
              <p className="font-semibold">آریا ERP</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400">نسخه</p>
              <p className="font-mono">2.1.0</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400">مودیان API</p>
              <p className="text-emerald-600 font-medium">INVOICE.V01</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400">بله API</p>
              <a href="https://docs.bale.ai/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] inline-flex items-center gap-1">
                docs.bale.ai <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
