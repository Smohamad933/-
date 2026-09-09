"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Landmark, Eye, EyeOff, User, Lock, ArrowLeft } from "lucide-react";

const DEMO_USERS = [
  { username: "admin", password: "admin123", role: "مدیر سیستم", color: "#1e40af" },
  { username: "accountant", password: "demo", role: "حسابدار", color: "#059669" },
  { username: "warehouse", password: "demo", role: "انباردار", color: "#7c3aed" },
  { username: "sales", password: "demo", role: "فروشنده", color: "#dc2626" },
  { username: "manager", password: "demo", role: "مدیر", color: "#0f766e" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAppStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (ok) {
        router.push("/dashboard");
      } else {
        setError("نام کاربری یا رمز عبور اشتباه است");
        setLoading(false);
      }
    }, 600);
  };

  const quickLogin = (user: typeof DEMO_USERS[0]) => {
    setUsername(user.username);
    setPassword(user.password);
    setLoading(true);
    setTimeout(() => {
      login(user.username, user.password);
      router.push("/dashboard");
    }, 400);
  };

  return (
    <div className="min-h-screen flex">
      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
              <Landmark className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">آریا ERP</h1>
            <p className="text-sm text-slate-500 mt-1">سیستم جامع مدیریت منابع سازمانی</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">نام کاربری</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="نام کاربری را وارد کنید"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl pr-10 pl-10 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="رمز عبور"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-gradient-to-l from-blue-600 to-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>ورود به سیستم <ArrowLeft className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs text-slate-400 text-center mb-3">ورود سریع با حساب‌های آزمایشی:</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  onClick={() => quickLogin(u)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-right group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.role.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{u.role}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{u.username} / {u.password}</p>
                  </div>
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full" />

        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            مدیریت هوشمند
            <br />
            <span className="bg-gradient-to-l from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              منابع سازمانی
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            سیستم جامع ERP با ماژول‌های حسابداری مالی، انبارداری و لجستیک،
            مدیریت دارایی‌های ثابت، خرید و فروش — یکپارچه و لحظه‌ای
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "حسابداری چندسطحی", desc: "کل · معین · تفصیلی · شناور" },
              { title: "انبارداری پیشرفته", desc: "FIFO · LIFO · میانگین موزون" },
              { title: "دارایی‌های ثابت", desc: "استهلاک · پلاک · بیمه" },
              { title: "یکپارچگی لحظه‌ای", desc: "Real-time Integration" },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 text-right">
                <p className="text-sm font-medium text-white mb-0.5">{f.title}</p>
                <p className="text-[11px] text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
