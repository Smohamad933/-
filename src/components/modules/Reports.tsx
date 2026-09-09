"use client";

import { useAppStore } from "@/lib/store";
import { Card, Money, PageHeader, StatCard, toPersianDigits } from "@/components/ui";
import {
  TrendingUp, Package, Building2, Wallet,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const monthlyData = [
  { month: "فروردین", revenue: 980, expense: 720, profit: 260 },
  { month: "اردیبهشت", revenue: 1120, expense: 810, profit: 310 },
  { month: "خرداد", revenue: 1050, expense: 780, profit: 270 },
  { month: "تیر", revenue: 1340, expense: 920, profit: 420 },
  { month: "مرداد", revenue: 1280, expense: 890, profit: 390 },
  { month: "شهریور", revenue: 1450, expense: 950, profit: 500 },
];

const categoryData = [
  { name: "روشنایی", value: 35 },
  { name: "کابل و سیم", value: 25 },
  { name: "تابلو برق", value: 15 },
  { name: "حفاظت", value: 12 },
  { name: "اتوماسیون", value: 8 },
  { name: "سایر", value: 5 },
];

const radarData = [
  { subject: "فروش", A: 85 },
  { subject: "موجودی", A: 70 },
  { subject: "وصول مطالبات", A: 60 },
  { subject: "سودآوری", A: 78 },
  { subject: "کارایی انبار", A: 82 },
  { subject: "رضایت مشتری", A: 90 },
];

export default function ReportsModule() {
  const { products, salesInvoices, customers, assets, accounts, cheques } = useAppStore();

  const totalRevenue = accounts.find((a) => a.code === "4")?.balance || 0;
  const totalExpense = accounts.find((a) => a.code === "5")?.balance || 0;
  const inventoryValue = products.reduce((s, p) => s + p.stock * p.unitCost, 0);
  const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="گزارش‌ساز و داشبورد KPI"
        subtitle="نمایش گرافیکی شاخص‌های کلیدی عملکرد — جریان نقدینگی، پرفروش‌ترین‌ها، سود ناخالص"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="درآمد کل" value={totalRevenue} icon={<TrendingUp className="w-5 h-5" />} color="green" change={12.5} />
        <StatCard title="سود ناخالص" value={totalRevenue - totalExpense} icon={<Wallet className="w-5 h-5" />} color="blue" change={18.7} />
        <StatCard title="ارزش انبار" value={inventoryValue} icon={<Package className="w-5 h-5" />} color="cyan" />
        <StatCard title="ارزش دارایی‌ها" value={totalAssets} icon={<Building2 className="w-5 h-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="روند درآمد، هزینه و سود" subtitle="میلیون ریال">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} name="درآمد" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} name="هزینه" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} name="سود" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="توزیع فروش بر اساس دسته‌بندی">
          <div className="h-72 flex">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => [`${Number(v ?? 0)}٪`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 flex flex-col justify-center gap-2">
              {categoryData.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-slate-600 flex-1">{c.name}</span>
                  <span className="font-medium text-slate-800">{toPersianDigits(c.value)}٪</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="عملکرد ماهانه (میلیون ریال)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="درآمد" barSize={16} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="هزینه" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="رادار عملکرد سازمانی">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 100]} />
                <Radar dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="خلاصه فروش">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">تعداد فاکتورها</span>
              <span className="font-semibold">{toPersianDigits(salesInvoices.length)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">مجموع فروش</span>
              <Money amount={salesInvoices.reduce((s, i) => s + i.total, 0)} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">میانگین فاکتور</span>
              <Money amount={salesInvoices.length ? salesInvoices.reduce((s, i) => s + i.total, 0) / salesInvoices.length : 0} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">پرداخت‌شده</span>
              <Money amount={salesInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0)} className="text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card title="خلاصه مشتریان">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">تعداد مشتریان</span>
              <span className="font-semibold">{toPersianDigits(customers.length)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">کل مطالبات</span>
              <Money amount={customers.reduce((s, c) => s + c.balance, 0)} className="text-red-600" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">عمده‌فروش</span>
              <span>{toPersianDigits(customers.filter((c) => c.type === "wholesale").length)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">خرده‌فروش</span>
              <span>{toPersianDigits(customers.filter((c) => c.type === "retail").length)}</span>
            </div>
          </div>
        </Card>

        <Card title="خلاصه چک‌ها">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">کل چک‌ها</span>
              <span className="font-semibold">{toPersianDigits(cheques.length)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">در جریان</span>
              <Money amount={cheques.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0)} className="text-amber-600" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">پاس‌شده</span>
              <Money amount={cheques.filter((c) => c.status === "cleared").reduce((s, c) => s + c.amount, 0)} className="text-emerald-600" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">برگشتی</span>
              <Money amount={cheques.filter((c) => c.status === "bounced").reduce((s, c) => s + c.amount, 0)} className="text-red-600" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
