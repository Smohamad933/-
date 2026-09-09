"use client";

import { cn, formatCurrency, formatNumber, formatDate, toPersianDigits } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";
import { X, Search, ChevronDown, Check, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";

/* ─── Button ─── */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({ className, variant = "primary", size = "md", loading, children, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-[var(--color-primary)] text-white hover:opacity-90 shadow-sm",
    secondary: "bg-[var(--color-secondary)] text-white hover:opacity-90",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        "rounded-[var(--radius)]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

/* ─── Input ─── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input
          ref={ref}
          className={cn(
            "w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all",
            "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
            "rounded-[var(--radius)] placeholder:text-slate-400",
            icon && "pr-10",
            error && "border-red-400 focus:border-red-500 focus:ring-red-200",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

/* ─── Select ─── */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ className, label, options, error, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            "w-full appearance-none border border-slate-300 bg-white px-3 py-2 pl-8 text-sm outline-none transition-all",
            "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
            "rounded-[var(--radius)]",
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ─── Textarea ─── */
export function Textarea({ className, label, ...props }: InputHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        className={cn(
          "w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all min-h-[80px]",
          "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
          "rounded-[var(--radius)] resize-y",
          className
        )}
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    </div>
  );
}

/* ─── Card ─── */
export function Card({ children, className, title, subtitle, action, noPadding }: {
  children: ReactNode; className?: string; title?: string; subtitle?: string; action?: ReactNode; noPadding?: boolean;
}) {
  return (
    <div className={cn("bg-white border border-slate-200/80 shadow-sm rounded-[var(--radius-lg)] overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            {title && <h3 className="font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}

/* ─── Badge ─── */
export function Badge({ children, variant = "default", className }: {
  children: ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" | "purple"; className?: string;
}) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-1 ring-red-200",
    info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    purple: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full", variants[variant], className)}>
      {children}
    </span>
  );
}

/* ─── Stat Card ─── */
export function StatCard({ title, value, change, icon, color = "blue", prefix, suffix }: {
  title: string; value: string | number; change?: number; icon: ReactNode;
  color?: "blue" | "green" | "red" | "amber" | "purple" | "cyan"; prefix?: string; suffix?: string;
}) {
  const colors = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/20",
    green: "from-emerald-500 to-emerald-600 shadow-emerald-500/20",
    red: "from-red-500 to-red-600 shadow-red-500/20",
    amber: "from-amber-500 to-amber-600 shadow-amber-500/20",
    purple: "from-purple-500 to-purple-600 shadow-purple-500/20",
    cyan: "from-cyan-500 to-cyan-600 shadow-cyan-500/20",
  };
  return (
    <div className="bg-white border border-slate-200/80 rounded-[var(--radius-lg)] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 mb-1 truncate">{title}</p>
          <p className="text-xl font-bold text-slate-800 truncate" dir="ltr">
            {prefix}{typeof value === "number" ? formatNumber(value) : value}{suffix}
          </p>
          {change !== undefined && (
            <p className={cn("text-xs mt-1.5 font-medium", change >= 0 ? "text-emerald-600" : "text-red-600")}>
              {change >= 0 ? "↑" : "↓"} {toPersianDigits(Math.abs(change))}٪ نسبت به ماه قبل
            </p>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg shrink-0", colors[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ─── Modal ─── */
export function Modal({ open, onClose, title, children, size = "md", footer }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl"; footer?: ReactNode;
}) {
  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-white rounded-[var(--radius-lg)] shadow-2xl w-full max-h-[90vh] flex flex-col", sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ─── Table ─── */
export function Table({ headers, children, className }: { headers: string[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-right font-semibold text-slate-600 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className, colSpan, ...props }: { children?: ReactNode; className?: string; colSpan?: number } & React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 text-slate-700 whitespace-nowrap", className)} colSpan={colSpan} {...props}>{children}</td>;
}

/* ─── Tabs ─── */
export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: ReactNode; count?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
            active === t.id
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          )}
        >
          {t.icon}
          {t.label}
          {t.count !== undefined && (
            <span className={cn("px-1.5 py-0.5 text-xs rounded-full", active === t.id ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "bg-slate-100 text-slate-500")}>
              {toPersianDigits(t.count)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon || <Info className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

/* ─── Search Box ─── */
export function SearchBox({ value, onChange, placeholder = "جستجو..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 bg-white pr-10 pl-3 py-2 text-sm rounded-[var(--radius)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
      />
    </div>
  );
}

/* ─── Alert ─── */
export function Alert({ children, variant = "info" }: { children: ReactNode; variant?: "info" | "success" | "warning" | "danger" }) {
  const styles = {
    info: { bg: "bg-blue-50 border-blue-200 text-blue-800", icon: <Info className="w-4 h-4" /> },
    success: { bg: "bg-emerald-50 border-emerald-200 text-emerald-800", icon: <CheckCircle className="w-4 h-4" /> },
    warning: { bg: "bg-amber-50 border-amber-200 text-amber-800", icon: <AlertTriangle className="w-4 h-4" /> },
    danger: { bg: "bg-red-50 border-red-200 text-red-800", icon: <AlertCircle className="w-4 h-4" /> },
  };
  const s = styles[variant];
  return (
    <div className={cn("flex items-start gap-3 p-3.5 rounded-lg border text-sm", s.bg)}>
      <div className="shrink-0 mt-0.5">{s.icon}</div>
      <div>{children}</div>
    </div>
  );
}

/* ─── Progress Bar ─── */
export function ProgressBar({ value, max = 100, color = "blue", showLabel }: { value: number; max?: number; color?: string; showLabel?: boolean }) {
  const pct = Math.min(100, (value / max) * 100);
  const colors: Record<string, string> = {
    blue: "bg-blue-500", green: "bg-emerald-500", red: "bg-red-500", amber: "bg-amber-500", purple: "bg-purple-500",
  };
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{toPersianDigits(Math.round(pct))}٪</span>
        </div>
      )}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", colors[color] || colors.blue)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── Toggle ─── */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-6 rounded-full transition-colors duration-200",
          checked ? "bg-[var(--color-primary)]" : "bg-slate-300"
        )}
      >
        <span className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
          checked ? "right-0.5" : "right-[18px]"
        )} />
      </button>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}

/* ─── Page Header ─── */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* ─── Currency Display ─── */
export function Money({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn("font-medium tabular-nums", className)} dir="ltr">{formatCurrency(amount)}</span>;
}

export { formatCurrency, formatNumber, formatDate, toPersianDigits, Check };
