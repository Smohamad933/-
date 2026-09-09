"use client";

import { useAppStore } from "@/lib/store";
import { StatCard, Card, Badge, Money, PageHeader, ProgressBar, toPersianDigits } from "@/components/ui";
import {
  TrendingUp, TrendingDown, Wallet, Package, Building2, Users,
  AlertTriangle, FileText, CreditCard, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const monthlyData = [
  { month: "فروردین", revenue: 980, expense: 720 },
  { month: "اردیبهشت", revenue: 1120, expense: 810 },
  { month: "خرداد", revenue: 1050, expense: 780 },
  { month: "تیر", revenue: 1340, expense: 920 },
  { month: "مرداد", revenue: 1280, expense: 890 },
  { month: "شهریور", revenue: 1450, expense: 950 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function Dashboard() {
  const { products, salesInvoices, cheques, customers, accounts } = useAppStore();

  const totalRevenue = accounts.find((a) => a.code === "4")?.balance || 0;
  const totalExpense = accounts.find((a) => a.code === "5")?.balance || 0;
  const totalAssets = accounts.find((a) => a.code === "1")?.balance || 0;
  const inventoryValue = products.reduce((s, p) => s + p.stock * p.unitCost, 0);
  const lowStock = products.filter((p) => p.stock <= p.reorderPoint);
  const pendingCheques = cheques.filter((c) => c.status === "pending");
  const recentSales = salesInvoices.slice(0, 5);
  const topProducts = [...products]
    .sort((a, b) => b.salePrice * 10 - a.salePrice * 10)
    .slice(0, 5)
    .map((p) => ({ name: p.name, value: p.stock * p.salePrice }));

  const assetDist = [
    { name: "نقد و بانک", value: 32 },
    { name: "دریافتنی", value: 28 },
    { name: "موجودی کالا", value: 25 },
    { name: "دارایی ثابت", value: 15 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="داشبورد مدیریتی"
        subtitle="نمای کلی شاخص‌های کلیدی عملکرد سازمان"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="کل درآمد" value={totalRevenue} icon={<TrendingUp className="w-5 h-5" />} color="green" change={12.5} suffix=" ریال" />
        <StatCard title="کل هزینه‌ها" value={totalExpense} icon={<TrendingDown className="w-5 h-5" />} color="red" change={-3.2} suffix=" ریال" />
        <StatCard title="سود ناخالص" value={totalRevenue - totalExpense} icon={<Wallet className="w-5 h-5" />} color="blue" change={18.7} suffix=" ریال" />
        <StatCard title="ارزش کل دارایی‌ها" value={totalAssets} icon={<Building2 className="w-5 h-5" />} color="purple" change={5.1} suffix=" ریال" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="ارزش موجودی انبار" value={inventoryValue} icon={<Package className="w-5 h-5" />} color="cyan" />
        <StatCard title="تعداد مشتریان" value={customers.length} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatCard title="چک‌های در جریان" value={pendingCheques.length} icon={<CreditCard className="w-5 h-5" />} color="amber" />
        <StatCard title="هشدار موجودی" value={lowStock.length} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="جریان درآمد و هزینه" subtitle="۶ ماه اخیر (میلیون ریال)" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value, name) => [
                    `${Number(value ?? 0).toLocaleString("fa-IR")} م.ر`,
                    name === "revenue" ? "درآمد" : "هزینه",
                  ]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="ترکیب دارایی‌ها" subtitle="درصد از کل">
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v) => [`${Number(v ?? 0)}٪`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {assetDist.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-slate-600">{a.name}</span>
                <span className="text-slate-400 mr-auto">{toPersianDigits(a.value)}٪</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <Card title="آخرین فاکتورهای فروش" subtitle="تراکنش‌های اخیر">
          <div className="space-y-3">
            {recentSales.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    inv.status === "paid" ? "bg-emerald-100 text-emerald-600" :
                    inv.status === "confirmed" ? "bg-blue-100 text-blue-600" :
                    "bg-slate-200 text-slate-500"
                  }`}>
                    {inv.status === "paid" ? <ArrowDownRight className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{inv.customerName}</p>
                    <p className="text-[11px] text-slate-400">{inv.number}</p>
                  </div>
                </div>
                <div className="text-left">
                  <Money amount={inv.total} className="text-sm" />
                  <div className="mt-0.5">
                    <Badge variant={
                      inv.status === "paid" ? "success" :
                      inv.status === "confirmed" ? "info" :
                      inv.status === "draft" ? "default" : "warning"
                    }>
                      {inv.status === "paid" ? "پرداخت‌شده" :
                       inv.status === "confirmed" ? "تأیید‌شده" :
                       inv.status === "draft" ? "پیش‌نویس" : inv.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card title="هشدار موجودی" subtitle="کالاهای زیر نقطه سفارش">
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">همه کالاها در سطح مطلوب هستند</p>
            ) : (
              lowStock.map((p) => (
                <div key={p.id} className="p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.sku}</p>
                    </div>
                    <Badge variant={p.stock <= p.minStock ? "danger" : "warning"}>
                      {p.stock <= p.minStock ? "بحرانی" : "کم"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar
                      value={p.stock}
                      max={p.maxStock}
                      color={p.stock <= p.minStock ? "red" : "amber"}
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {toPersianDigits(p.stock)} / {toPersianDigits(p.reorderPoint)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Top products bar */}
      <Card title="پرفروش‌ترین کالاها" subtitle="بر اساس ارزش موجودی قابل فروش">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v) => [Number(v ?? 0).toLocaleString("fa-IR") + " ریال", "ارزش"]}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
